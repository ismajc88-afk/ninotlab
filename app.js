// State Management
const state = {
    designs: JSON.parse(localStorage.getItem('ninot_designs')) || [
        { id: 1, name: 'Ninot Faller Clásico', tags: 'Tradición', version: 'v2.1', license: 'Comercial', weight: 450, time: 12, cost: 9.90, price: 45.00, img: 'ninot_3d_example_1778687684211.png' },
        { id: 2, name: 'Llaveros Personalizados x10', tags: 'Eventos', version: 'v1.0', license: 'Comercial', weight: 120, time: 2.5, cost: 2.64, price: 25.00, img: null },
    ],
    finance: JSON.parse(localStorage.getItem('ninot_finance')) || [
        { date: '2026-05-01', concept: 'Venta Ninot Faller', category: 'Venta', amount: 45.00, type: 'income' },
        { date: '2026-05-02', concept: 'Bobina PLA Bambu Green', category: 'Filamento', amount: 24.90, type: 'expense' },
    ],
    inventory: JSON.parse(localStorage.getItem('ninot_inventory')) || [
        { id: 1, brand: 'Bambu Lab', material: 'PLA Basic', color: 'Green', hex: '#00ffa3', weight: 1000, current: 850, cost: 24.90, temp: '220/65', flow: '0.98' },
        { id: 2, brand: 'eSUN', material: 'PLA+', color: 'White', hex: '#ffffff', weight: 1000, current: 400, cost: 21.00, temp: '215/60', flow: '1.0' }
    ],
    clients: JSON.parse(localStorage.getItem('ninot_clients')) || [
        { id: 1, name: 'Juan Pérez', email: 'juan@example.com', projects: [] },
        { id: 2, name: 'Asoc. Local Fallera', email: 'falla@valencia.es', projects: [] }
    ],
    projects: JSON.parse(localStorage.getItem('ninot_projects')) || [
        { id: 101, clientId: 1, clientName: 'Juan Pérez', name: 'Ninot Faller v2', date: '2026-05-13', status: 'in_progress', tasks: [], linkedDesigns: [1], timeLogged: 2, notes: '', sketches: [] },
        { id: 102, clientId: 1, clientName: 'Juan Pérez', name: 'Presupuesto Llaveros', date: '2026-05-14', status: 'pending', tasks: [], linkedDesigns: [], timeLogged: 0, notes: '', sketches: [] },
    ],
    profiles: JSON.parse(localStorage.getItem('ninot_profiles')) || [
        { id: 1, material: 'PLA Basic (Bambu Lab)', printer: 'Bambu Lab A1', temp: 220, bed: 65, flow: 0.98, ret: 0.8 },
        { id: 2, material: 'PETG (eSUN)', printer: 'Prusa MK3S+', temp: 240, bed: 80, flow: 1.0, ret: 1.2 }
    ],
    settings: JSON.parse(localStorage.getItem('ninot_settings')) || {
        name: 'NINOT LAB',
        sub: 'Prototipado & Impresión 3D',
        email: 'info@ninotlab.com',
        phone: '+34 600 000 000',
        iban: 'ES00 1234 5678 9012 3456',
        bizum: '+34 600 000 000',
        titular: 'Ninot Lab'
    },
    activeTab: 'dashboard',
    selectedClient: null,
    currentProjectModalId: null,
    financeModalType: 'income'
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initCalculator();
    renderAll();
    
    // Mobile menu toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if(menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-active');
        });
    }

    // Auto-connect Firebase on boot if config exists
    const storedConfig = localStorage.getItem('ninot_firebase_config');
    if(storedConfig) {
        setTimeout(() => window.connectFirebase(), 1000);
    }
});

function renderAll() {
    renderDashboard();
    renderDesigns();
    renderFinance();
    renderInventory();
    renderClients();
    renderProjectsKanban();
    renderProfiles();
    renderSettings();
    
    // Set Firebase UI if connected
    const config = localStorage.getItem('ninot_firebase_config');
    if(config) {
        document.getElementById('set-firebase-config').value = config;
        document.getElementById('firebase-status').innerText = "Estado: Conectado (Sincronización Activa)";
        document.getElementById('firebase-status').style.color = "var(--green)";
    }
}

let db = null;
let isSyncingFromCloud = false;

window.connectFirebase = () => {
    let configStr = document.getElementById('set-firebase-config').value;
    
    // Default config if empty (User provided this)
    if (!configStr) {
        configStr = JSON.stringify({
            apiKey: "AIzaSyACoz8PkGAKNGwl-zln4-TEbqaDMCOB0Ss",
            authDomain: "ninot-lab.firebaseapp.com",
            databaseURL: "https://ninot-lab-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "ninot-lab",
            storageBucket: "ninot-lab.firebasestorage.app",
            messagingSenderId: "696932672491",
            appId: "1:696932672491:web:e3b7d75bf44bc61a7aefae"
        }, null, 2);
        document.getElementById('set-firebase-config').value = configStr;
    }

    try {
        const config = JSON.parse(configStr);
        if (!firebase.apps.length) {
            firebase.initializeApp(config);
        }
        db = firebase.database();
        localStorage.setItem('ninot_firebase_config', configStr);
        
        // Listen for cloud changes
        db.ref('state').on('value', (snapshot) => {
            const cloudState = snapshot.val();
            if (cloudState) {
                isSyncingFromCloud = true;
                Object.assign(state, cloudState);
                renderAll();
                setTimeout(() => isSyncingFromCloud = false, 100);
            }
        });
        
        document.getElementById('firebase-status').innerText = "Estado: Conectado (Nube Ninot Lab Activa)";
        document.getElementById('firebase-status').style.color = "var(--green)";
        
        // Push initial state to cloud if cloud is empty
        db.ref('state').once('value').then(snap => {
            if(!snap.exists()) {
                saveState();
            }
        });

        console.log("¡Conectado a Firebase!");
    } catch (e) {
        alert("Error en la configuración de Firebase.");
        console.error(e);
    }
};

function saveState() {
    localStorage.setItem('ninot_designs', JSON.stringify(state.designs));
    localStorage.setItem('ninot_finance', JSON.stringify(state.finance));
    localStorage.setItem('ninot_inventory', JSON.stringify(state.inventory));
    localStorage.setItem('ninot_clients', JSON.stringify(state.clients));
    localStorage.setItem('ninot_projects', JSON.stringify(state.projects));
    localStorage.setItem('ninot_profiles', JSON.stringify(state.profiles));
    localStorage.setItem('ninot_settings', JSON.stringify(state.settings));
    
    // Sync to Firebase if connected
    if (db && !isSyncingFromCloud) {
        db.ref('state').set({
            designs: state.designs,
            finance: state.finance,
            inventory: state.inventory,
            clients: state.clients,
            projects: state.projects,
            profiles: state.profiles,
            settings: state.settings
        });
    }
    
    renderAll(); // Auto update UI on state change
}

// Tab Navigation
function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const sidebar = document.querySelector('.sidebar');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.getAttribute('data-tab');
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === `${tab}-view`) {
                    view.classList.add('active');
                }
            });
            state.activeTab = tab;
            
            // Close mobile sidebar if open
            if(sidebar) sidebar.classList.remove('mobile-active');
        });
    });
}

// Dashboard Logic
function renderDashboard() {
    const dateEl = document.getElementById('dash-date');
    if(dateEl) dateEl.innerText = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let balance = 0;
    let income = 0;
    let expenses = 0;
    state.finance.forEach(f => {
        balance += (f.type === 'income' ? f.amount : -f.amount);
        if(f.type === 'income') income += f.amount;
        else expenses += f.amount;
    });
    
    document.getElementById('dash-balance').innerText = `€${balance.toFixed(2)}`;
    document.getElementById('dash-projects').innerText = state.projects.length;
    document.getElementById('dash-designs').innerText = state.designs.length;
    document.getElementById('dash-clients').innerText = state.clients.length;

    // Advanced Stats
    document.getElementById('stats-revenue').innerText = `€${income.toFixed(2)}`;
    document.getElementById('stats-expenses').innerText = `€${expenses.toFixed(2)}`;
    document.getElementById('stats-profit').innerText = `€${(income - expenses).toFixed(2)}`;
    
    const confirmed = state.projects.filter(p => p.status !== 'draft').length;
    const drafts = state.projects.filter(p => p.status === 'draft').length;
    const conv = confirmed > 0 ? (confirmed / (confirmed + drafts)) * 100 : 0;
    document.getElementById('stats-conv').innerText = `${conv.toFixed(1)}%`;

    // Kanban Summary
    const pending = state.projects.filter(p => p.status === 'pending').length;
    const progress = state.projects.filter(p => p.status === 'in_progress').length;
    const done = state.projects.filter(p => p.status === 'done').length;
    const total = state.projects.length || 1;

    document.getElementById('dash-pending').innerText = pending;
    document.getElementById('dash-progress').innerText = progress;
    document.getElementById('dash-done').innerText = done;

    document.getElementById('dash-kanban-bar').innerHTML = `
        <div class="kb-seg" style="width: ${(pending/total)*100}%; background: var(--yellow)"></div>
        <div class="kb-seg" style="width: ${(progress/total)*100}%; background: var(--blue)"></div>
        <div class="kb-seg" style="width: ${(done/total)*100}%; background: var(--green)"></div>
    `;

    // Recent Transactions
    const dashList = document.getElementById('dash-finance-list');
    const recentFin = state.finance.slice(-3).reverse();
    if(dashList) {
        dashList.innerHTML = recentFin.length ? recentFin.map(f => `
            <li class="order-item">
                <div class="order-info">
                    <strong>${f.concept}</strong>
                    <span>${f.date}</span>
                </div>
                <span style="font-weight:700; color: ${f.type === 'income' ? 'var(--green)' : 'var(--red)'}">
                    ${f.type === 'income' ? '+' : '-'}€${f.amount.toFixed(2)}
                </span>
            </li>
        `).join('') : '<li class="order-item text-muted" style="justify-content:center;">Sin transacciones</li>';
    }
}

// Calculator
// Calculator
function initCalculator() {
    window.toggleCalcMode = () => {
        const mode = document.getElementById('calc-mode').value;
        const p3d = document.querySelector('#calculator-view .card:nth-of-type(1)');
        const pPaint = document.getElementById('calc-paint-params');
        if(mode === '3d') { p3d.style.display = 'block'; pPaint.style.display = 'none'; }
        else { p3d.style.display = 'none'; pPaint.style.display = 'block'; }
    };

    window.calculate = () => {
        const mode = document.getElementById('calc-mode').value;
        let html = '';

        if(mode === '3d') {
            let weight = parseFloat(document.getElementById('calc-weight').value) || 0;
            const priceKg = parseFloat(document.getElementById('calc-price-kg').value) || 0;
            let hours = parseFloat(document.getElementById('calc-hours').value) || 0;
            const watts = parseFloat(document.getElementById('calc-watts').value) || 0;
            const kwh = parseFloat(document.getElementById('calc-kwh').value) || 0;
            const margin = parseFloat(document.getElementById('calc-margin').value) || 0;
            const wear = parseFloat(document.getElementById('calc-wear').value) || 0;
            const shipping = parseFloat(document.getElementById('calc-shipping').value) || 0;
            const labor = parseFloat(document.getElementById('calc-labor').value) || 0;
            const scale = parseFloat(document.getElementById('calc-scale').value) || 100;

            if (scale !== 100) {
                const scaleFactor = Math.pow(scale / 100, 3);
                weight = weight * scaleFactor;
                hours = hours * scaleFactor;
            }

            const filamentCost = (weight / 1000) * priceKg;
            const energyCost = (watts / 1000) * hours * kwh;
            const wearCost = hours * wear;
            const baseCost = filamentCost + energyCost + wearCost + labor + shipping;
            const totalPrice = baseCost * (1 + (margin / 100));

            html = `
                <div class="result-row"><span>Material (${weight.toFixed(0)}g)</span><span>€${filamentCost.toFixed(2)}</span></div>
                <div class="result-row"><span>Energía & Amort.</span><span>€${(energyCost + wearCost).toFixed(2)}</span></div>
                <div class="result-row"><span>Mano de obra</span><span>€${labor.toFixed(2)}</span></div>
                <div class="result-row"><span>Envío</span><span>€${shipping.toFixed(2)}</span></div>
                <div class="result-row"><span>Margen (${margin}%)</span><span>€${(totalPrice - baseCost).toFixed(2)}</span></div>
                <div class="result-row total-row"><span>PRECIO VENTA</span><span>€${totalPrice.toFixed(2)}</span></div>
            `;
        } else {
            const hours = parseFloat(document.getElementById('calc-paint-hours').value) || 0;
            const rate = parseFloat(document.getElementById('calc-paint-rate').value) || 0;
            const mats = parseFloat(document.getElementById('calc-paint-mats').value) || 0;
            const factor = parseFloat(document.getElementById('calc-paint-factor').value) || 1;
            
            const labor = hours * rate;
            const total = (labor + mats) * factor;

            html = `
                <div class="result-row"><span>Mano de obra (${hours}h)</span><span>€${labor.toFixed(2)}</span></div>
                <div class="result-row"><span>Materiales</span><span>€${mats.toFixed(2)}</span></div>
                <div class="result-row"><span>Factor Complejidad</span><span>x${factor}</span></div>
                <div class="result-row total-row"><span>PRECIO VENTA</span><span>€${total.toFixed(2)}</span></div>
            `;
        }
        document.getElementById('calc-results').innerHTML = html;
    };
}

// Designs
function renderDesigns() {
    const container = document.getElementById('designs-container');
    if (!container) return;
    
    const filter = document.getElementById('design-category-filter')?.value || 'all';
    const search = (document.getElementById('design-search')?.value || '').toLowerCase();
    const sort = document.getElementById('design-sort')?.value || 'name';

    // KPIs
    document.getElementById('cat-kpi-total').innerText = state.designs.length;
    const cats = new Set(state.designs.map(d => d.tags));
    document.getElementById('cat-kpi-cats').innerText = cats.size;
    const avgPrice = state.designs.length > 0 ? state.designs.reduce((s,d) => s+d.price, 0) / state.designs.length : 0;
    document.getElementById('cat-kpi-avg').innerText = `€${avgPrice.toFixed(0)}`;
    document.getElementById('cat-kpi-value').innerText = `€${state.designs.reduce((s,d) => s+d.price, 0).toFixed(0)}`;

    let filtered = state.designs;
    if(filter !== 'all') filtered = filtered.filter(d => d.tags === filter || (d.tags && d.tags.includes(filter)));
    if(search) filtered = filtered.filter(d => d.name.toLowerCase().includes(search));
    
    // Sort
    filtered = [...filtered].sort((a,b) => {
        if(sort === 'name') return a.name.localeCompare(b.name);
        if(sort === 'price-desc') return b.price - a.price;
        if(sort === 'price-asc') return a.price - b.price;
        if(sort === 'weight') return b.weight - a.weight;
        if(sort === 'recent') return b.id - a.id;
        return 0;
    });

    // Profit margin display
    container.innerHTML = filtered.map(d => {
        const margin = d.price > 0 && d.cost > 0 ? Math.round(((d.price - d.cost) / d.cost) * 100) : 0;
        const marginColor = margin > 200 ? 'var(--green)' : margin > 100 ? 'var(--yellow)' : 'var(--red)';
        const projCount = state.projects.filter(p => (p.linkedDesigns || []).includes(d.id)).length;
        return `
            <div class="design-card" style="position:relative;cursor:pointer;" onclick="window.openDesignDetail(${d.id})">
                <div class="design-img" style="position:relative;">
                    ${d.img ? `<img src="${d.img}" alt="${d.name}">` : `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--text-muted);"><i class="fas fa-cube" style="font-size:1.5rem;"></i><span style="font-size:0.6rem;">Sin imagen</span></div>`}
                    <div style="position:absolute;top:5px;right:5px;display:flex;gap:3px;">
                        <button class="btn-icon" onclick="event.stopPropagation();window.editDesign(${d.id})" style="width:24px;height:24px;background:rgba(0,0,0,0.6);border:none;color:white;font-size:0.6rem;backdrop-filter:blur(4px);"><i class="fas fa-pen"></i></button>
                        <button class="btn-icon" onclick="event.stopPropagation();window.duplicateDesign(${d.id})" style="width:24px;height:24px;background:rgba(0,0,0,0.6);border:none;color:white;font-size:0.6rem;backdrop-filter:blur(4px);"><i class="fas fa-copy"></i></button>
                        <button class="btn-icon" onclick="event.stopPropagation();window.deleteDesign(${d.id})" style="width:24px;height:24px;background:rgba(239,68,68,0.8);border:none;color:white;font-size:0.6rem;backdrop-filter:blur(4px);"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="design-content">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                        <span class="design-tag">${d.tags || d.category || '—'}</span>
                        ${projCount > 0 ? `<span style="font-size:0.55rem;color:var(--text-muted);"><i class="fas fa-link"></i> ${projCount}</span>` : ''}
                    </div>
                    <h3 style="margin-bottom:4px;font-size:0.85rem;">${d.name}</h3>
                    <div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:6px;">
                        v${d.version || '1.0'} · ${d.license || 'Estándar'}
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;font-size:0.72rem;">
                        <div style="text-align:center;background:var(--s2);padding:3px;border-radius:5px;">
                            <div class="ps-label">Peso</div><strong>${d.weight}g</strong>
                        </div>
                        <div style="text-align:center;background:var(--s2);padding:3px;border-radius:5px;">
                            <div class="ps-label">Tiempo</div><strong>${d.time}h</strong>
                        </div>
                        <div style="text-align:center;background:var(--s2);padding:3px;border-radius:5px;">
                            <div class="ps-label">Margen</div><strong style="color:${marginColor};">${margin}%</strong>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:6px;border-top:1px solid var(--border);">
                        <span style="font-size:0.65rem;color:var(--text-muted);">Coste: €${(d.cost || 0).toFixed(2)}</span>
                        <span style="font-size:0.95rem;font-weight:800;color:var(--green);">€${d.price.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('') || '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:2rem;">No se encontraron diseños.</p>';
}

window.addDesign = () => {
    document.getElementById('new-design-name').value = '';
    document.getElementById('new-design-price').value = '15.00';
    document.getElementById('new-design-weight').value = '100';
    document.getElementById('new-design-time').value = '2';
    document.getElementById('new-design-cost').value = '3';
    document.getElementById('new-design-img').value = '';
    document.getElementById('add-design-modal').classList.add('active');
};

window.confirmAddDesign = () => {
    const name = document.getElementById('new-design-name').value;
    const price = parseFloat(document.getElementById('new-design-price').value);
    const tags = document.getElementById('new-design-category').value;
    const weight = parseInt(document.getElementById('new-design-weight').value) || 100;
    const time = parseFloat(document.getElementById('new-design-time').value) || 2;
    const cost = parseFloat(document.getElementById('new-design-cost').value) || 3;
    const img = document.getElementById('new-design-img').value || null;
    if (!name || isNaN(price)) { alert("Datos inválidos"); return; }
    
    state.designs.push({
        id: Date.now(), name, tags, version: '1.0', license: 'Estándar',
        weight, time, cost, price, img, category: tags
    });
    saveState();
    document.getElementById('add-design-modal').classList.remove('active');
};

window.deleteDesign = (id) => {
    const d = state.designs.find(x => x.id === id);
    if(!d) return;
    if(!confirm(`¿Eliminar "${d.name}" del catálogo?`)) return;
    state.designs = state.designs.filter(x => x.id !== id);
    saveState();
};

window.duplicateDesign = (id) => {
    const d = state.designs.find(x => x.id === id);
    if(!d) return;
    state.designs.push({ ...d, id: Date.now(), name: d.name + ' (copia)' });
    saveState();
};

window.editDesign = (id) => {
    const d = state.designs.find(x => x.id === id);
    if(!d) return;
    const newName = prompt('Nombre:', d.name);
    if(!newName) return;
    const newPrice = parseFloat(prompt('Precio (€):', d.price));
    if(isNaN(newPrice)) return;
    const newWeight = parseInt(prompt('Peso (g):', d.weight)) || d.weight;
    const newTime = parseFloat(prompt('Tiempo (h):', d.time)) || d.time;
    const newCost = parseFloat(prompt('Coste (€):', d.cost)) || d.cost;
    d.name = newName; d.price = newPrice; d.weight = newWeight; d.time = newTime; d.cost = newCost;
    saveState();
};

window.uploadDesignImg = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { document.getElementById('new-design-img').value = ev.target.result; };
        reader.readAsDataURL(file);
    };
    input.click();
};

// Design Detail Modal
state.currentDesignDetailId = null;

window.openDesignDetail = (id) => {
    state.currentDesignDetailId = id;
    const d = state.designs.find(x => x.id === id);
    if(!d) return;
    
    // Image
    const imgContainer = document.getElementById('design-detail-img');
    if(d.img) {
        imgContainer.innerHTML = `
            <img src="${d.img}" style="width:100%;height:100%;object-fit:cover;">
            <div style="position:absolute;top:10px;right:10px;display:flex;gap:4px;">
                <button class="btn-icon" onclick="window.changeDesignImg()" style="width:30px;height:30px;background:rgba(0,0,0,0.6);border:none;color:white;font-size:0.7rem;backdrop-filter:blur(4px);border-radius:6px;" title="Cambiar imagen"><i class="fas fa-camera"></i></button>
                <button class="btn-icon" onclick="document.getElementById('design-detail-modal').classList.remove('active')" style="width:30px;height:30px;background:rgba(0,0,0,0.6);border:none;color:white;font-size:0.7rem;backdrop-filter:blur(4px);border-radius:6px;"><i class="fas fa-times"></i></button>
            </div>
            <div style="position:absolute;bottom:10px;left:12px;"><span class="design-tag" style="font-size:0.65rem;">${d.tags || '—'}</span></div>`;
    } else {
        imgContainer.innerHTML = `
            <i class="fas fa-cube" style="font-size:3rem;color:var(--text-muted);"></i>
            <div style="position:absolute;top:10px;right:10px;display:flex;gap:4px;">
                <button class="btn-icon" onclick="window.changeDesignImg()" style="width:30px;height:30px;background:rgba(0,0,0,0.6);border:none;color:white;font-size:0.7rem;backdrop-filter:blur(4px);border-radius:6px;" title="Añadir imagen"><i class="fas fa-camera"></i></button>
                <button class="btn-icon" onclick="document.getElementById('design-detail-modal').classList.remove('active')" style="width:30px;height:30px;background:rgba(0,0,0,0.6);border:none;color:white;font-size:0.7rem;backdrop-filter:blur(4px);border-radius:6px;"><i class="fas fa-times"></i></button>
            </div>
            <div style="position:absolute;bottom:10px;left:12px;"><span class="design-tag" style="font-size:0.65rem;">${d.tags || '—'}</span></div>`;
    }
    
    // Name & meta
    document.getElementById('design-detail-name').innerText = d.name;
    document.getElementById('design-detail-meta').innerText = `v${d.version || '1.0'} · ${d.license || 'Estándar'} · ID: ${d.id}`;
    
    // Stats
    document.getElementById('design-detail-weight').innerText = `${d.weight}g`;
    document.getElementById('design-detail-time').innerText = `${d.time}h`;
    document.getElementById('design-detail-cost').innerText = `€${(d.cost || 0).toFixed(2)}`;
    document.getElementById('design-detail-price').innerText = `€${d.price.toFixed(2)}`;
    
    const margin = d.price > 0 && d.cost > 0 ? Math.round(((d.price - d.cost) / d.cost) * 100) : 0;
    const marginColor = margin > 200 ? 'var(--green)' : margin > 100 ? 'var(--yellow)' : 'var(--red)';
    document.getElementById('design-detail-margin').innerText = `${margin}%`;
    document.getElementById('design-detail-margin').style.color = marginColor;
    
    // Profit bar
    const profitPct = Math.min(margin, 400) / 4; // normalize to 0-100
    document.getElementById('design-detail-profit-bar').style.width = profitPct + '%';
    document.getElementById('design-detail-profit-bar').style.background = marginColor;
    const profit = d.price - (d.cost || 0);
    document.getElementById('design-detail-profit-label').innerText = `€${profit.toFixed(2)} beneficio por unidad`;
    
    // Production data
    document.getElementById('design-detail-filament').innerText = `${d.weight}g`;
    const elecCost = (d.time * 0.3 * 0.18).toFixed(2); // 300W * €0.18/kWh
    document.getElementById('design-detail-elec').innerText = `€${elecCost}`;
    
    // Linked projects
    const linkedProjects = state.projects.filter(p => (p.linkedDesigns || []).includes(d.id));
    document.getElementById('design-detail-prints').innerText = linkedProjects.filter(p => p.status === 'done').length;
    document.getElementById('design-detail-revenue').innerText = `€${(linkedProjects.filter(p => p.status === 'done').length * d.price).toFixed(2)}`;
    
    const projContainer = document.getElementById('design-detail-projects');
    projContainer.innerHTML = linkedProjects.map(p => {
        const statusColors = { draft: 'var(--text-muted)', pending: 'var(--yellow)', in_progress: 'var(--blue)', done: 'var(--green)' };
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;background:var(--s2);border-radius:5px;font-size:0.7rem;">
                <span><strong>${p.name}</strong> <span class="text-muted">· ${p.clientName}</span></span>
                <span style="width:6px;height:6px;border-radius:50%;background:${statusColors[p.status] || 'var(--text-muted)'};flex-shrink:0;"></span>
            </div>`;
    }).join('') || '<p class="text-muted" style="font-size:0.68rem;">Sin proyectos vinculados</p>';
    
    document.getElementById('design-detail-modal').classList.add('active');
};

window.editDesignFromDetail = () => {
    const d = state.designs.find(x => x.id === state.currentDesignDetailId);
    if(!d) return;
    window.editDesign(d.id);
    window.openDesignDetail(d.id); // refresh
};

window.duplicateDesignFromDetail = () => {
    window.duplicateDesign(state.currentDesignDetailId);
    document.getElementById('design-detail-modal').classList.remove('active');
};

window.deleteDesignFromDetail = () => {
    window.deleteDesign(state.currentDesignDetailId);
    document.getElementById('design-detail-modal').classList.remove('active');
};

window.changeDesignImg = () => {
    const d = state.designs.find(x => x.id === state.currentDesignDetailId);
    if(!d) return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            d.img = ev.target.result;
            saveState();
            window.openDesignDetail(d.id); // refresh modal
        };
        reader.readAsDataURL(file);
    };
    input.click();
};

// Finance
function renderFinance() {
    const list = document.getElementById('finance-list');
    if (!list) return;

    let inc = 0, exp = 0;
    list.innerHTML = state.finance.slice().reverse().map(f => {
        if(f.type === 'income') inc += f.amount;
        else exp += f.amount;

        return `
            <tr>
                <td>${f.date}</td>
                <td>${f.concept}</td>
                <td><span class="category-tag">${f.category}</span></td>
                <td class="${f.type === 'income' ? 'type-income' : 'type-expense'}">${f.type === 'income' ? '+' : '-'}€${f.amount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const bal = inc - exp;
    document.getElementById('fin-income').innerText = `€${inc.toFixed(2)}`;
    document.getElementById('fin-expenses').innerText = `€${exp.toFixed(2)}`;
    document.getElementById('fin-balance').innerText = `€${bal.toFixed(2)}`;
}

window.openFinanceModal = (type) => {
    state.financeModalType = type;
    document.getElementById('finance-modal-title').innerText = type === 'income' ? 'Registrar Ingreso' : 'Registrar Gasto';
    document.getElementById('fin-concept').value = '';
    document.getElementById('fin-amount').value = '';
    document.getElementById('fin-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('finance-modal').classList.add('active');
};

window.closeFinanceModal = () => {
    document.getElementById('finance-modal').classList.remove('active');
};

window.saveFinanceEntry = () => {
    const concept = document.getElementById('fin-concept').value;
    const amount = parseFloat(document.getElementById('fin-amount').value);
    const category = document.getElementById('fin-category').value;
    const date = document.getElementById('fin-date').value;

    if(!concept || !amount || amount <= 0) { alert("Completa los campos correctamente"); return; }

    state.finance.push({ concept, amount, category, date, type: state.financeModalType });
    saveState();
    window.closeFinanceModal();
};

// Inventory
function renderInventory() {
    const container = document.getElementById('inventory-container');
    if (!container) return;

    container.innerHTML = state.inventory.map(s => {
        const pct = (s.current / s.weight) * 100;
        return `
            <div class="spool-card">
                <div class="spool-header">
                    <span class="spool-brand">${s.brand}</span>
                    <div class="spool-color-blob" style="background: ${s.hex}"></div>
                </div>
                <h3 style="margin-bottom:8px;">${s.material} ${s.color}</h3>
                <div class="progress-container"><div class="progress-bar" style="width: ${pct}%"></div></div>
                <div class="spool-stats">
                    <span>Stock: <strong style="color:var(--text-1)">${s.current}g</strong> / ${s.weight}g</span>
                    <span>Coste: <strong>€${s.cost.toFixed(2)}</strong></span>
                </div>
            </div>
        `;
    }).join('');
}

window.addStock = () => {
    document.getElementById('new-stock-mat').value = '';
    document.getElementById('new-stock-color').value = '';
    document.getElementById('new-stock-cost').value = '20.00';
    document.getElementById('add-stock-modal').classList.add('active');
};

window.confirmAddStock = () => {
    const material = document.getElementById('new-stock-mat').value;
    const color = document.getElementById('new-stock-color').value;
    const cost = parseFloat(document.getElementById('new-stock-cost').value);
    
    if(!material || isNaN(cost)) { alert("Datos inválidos"); return; }

    state.inventory.push({ id: Date.now(), brand: 'Nuevo', material, color, hex: '#444', weight: 1000, current: 1000, cost, temp: '220/60', flow: '1.0' });
    state.finance.push({ date: new Date().toISOString().split('T')[0], concept: `Bobina ${material} ${color}`, category: 'Filamento', amount: cost, type: 'expense' });
    saveState();
    document.getElementById('add-stock-modal').classList.remove('active');
};

function initSimulator() {
    const dSel = document.getElementById('sim-design-select');
    const sSel = document.getElementById('sim-spool-select');
    if (!dSel || !sSel) return;

    dSel.innerHTML = state.designs.map(d => `<option value="${d.id}">${d.name} (${d.weight}g)</option>`).join('');
    sSel.innerHTML = state.inventory.map(s => `<option value="${s.id}">${s.material} ${s.color} (${s.current}g)</option>`).join('');

    const calcSim = () => {
        const d = state.designs.find(x => x.id == dSel.value);
        const s = state.inventory.find(x => x.id == sSel.value);
        if(!d || !s) return;

        const maxUnits = Math.floor(s.current / d.weight);
        const val = maxUnits * d.price;
        const cPU = (d.weight / s.weight) * s.cost;

        document.getElementById('sim-production-result').innerHTML = `
            <div class="result-row"><span>Unidades posibles:</span><span style="font-weight:800;font-size:1.2rem;color:var(--blue)">${maxUnits}</span></div>
            <div class="result-row"><span>Coste por unidad:</span><span>€${cPU.toFixed(2)}</span></div>
            <div class="result-row total-row"><span>VALOR POTENCIAL:</span><span>€${val.toFixed(2)}</span></div>
        `;
    };
    dSel.addEventListener('change', calcSim);
    sSel.addEventListener('change', calcSim);
    calcSim();
}

// Clients
function renderClients() {
    const list = document.getElementById('clients-list');
    if (!list) return;

    // KPI stats
    document.getElementById('clients-total').innerText = state.clients.length;
    const activeIds = new Set(state.projects.filter(p => p.status !== 'done').map(p => p.clientId));
    document.getElementById('clients-active').innerText = activeIds.size;
    
    // Find top client
    const clientProjCounts = {};
    state.projects.forEach(p => { clientProjCounts[p.clientId] = (clientProjCounts[p.clientId] || 0) + 1; });
    const topId = Object.entries(clientProjCounts).sort((a,b) => b[1] - a[1])[0];
    const topClient = topId ? state.clients.find(c => c.id == topId[0]) : null;
    document.getElementById('clients-top').innerText = topClient ? topClient.name : '—';

    const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#22c55e','#38bdf8','#ef4444'];
    list.innerHTML = state.clients.map((c, i) => {
        const count = state.projects.filter(p => p.clientId === c.id).length;
        const initials = c.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
        const bg = colors[i % colors.length];
        const isActive = activeIds.has(c.id);
        return `
            <div class="order-item client-item" onclick="window.selectClient(${c.id})" style="cursor:pointer;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:32px;height:32px;border-radius:8px;background:${bg};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.65rem;color:#fff;flex-shrink:0;">${initials}</div>
                    <div class="order-info">
                        <strong>${c.name}</strong>
                        <span>${c.email || 'Sin contacto'}</span>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    ${isActive ? '<span style="width:6px;height:6px;border-radius:50%;background:var(--green);"></span>' : ''}
                    <span class="status done">${count}</span>
                </div>
            </div>
        `;
    }).join('') || '<p class="text-muted" style="font-size:0.8rem;text-align:center;padding:1rem;">Sin clientes aún</p>';
}

window.addClient = () => {
    document.getElementById('new-client-name').value = '';
    document.getElementById('new-client-email').value = '';
    document.getElementById('add-client-modal').classList.add('active');
};

window.confirmAddClient = () => {
    const name = document.getElementById('new-client-name').value;
    const email = document.getElementById('new-client-email').value;
    if(!name) { alert("El nombre es obligatorio"); return; }
    
    state.clients.push({ id: Date.now(), name, email, projects: [] });
    saveState();
    document.getElementById('add-client-modal').classList.remove('active');
};

window.selectClient = (id) => {
    state.selectedClient = state.clients.find(c => c.id == id);
    if(!state.selectedClient) return;
    const c = state.selectedClient;
    
    document.getElementById('client-details-card').style.display = 'block';
    document.getElementById('detail-client-name').innerText = c.name;
    document.getElementById('detail-client-email').innerText = c.email || 'Sin contacto';
    
    const initials = c.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    document.getElementById('detail-client-avatar').innerText = initials;
    
    const projs = state.projects.filter(p => p.clientId === id);
    document.getElementById('detail-proj-count').innerText = projs.length;
    
    // Calculate revenue from linked designs
    let revenue = 0;
    projs.forEach(p => {
        p.linkedDesigns.forEach(dId => {
            const d = state.designs.find(x => x.id == dId);
            if(d) revenue += d.price;
        });
    });
    document.getElementById('detail-revenue').innerText = `€${revenue.toFixed(0)}`;
    
    const lastProj = projs.sort((a,b) => b.date.localeCompare(a.date))[0];
    document.getElementById('detail-last-date').innerText = lastProj ? lastProj.date : '—';
    
    const statusMap = { draft: ['Borrador','var(--text-muted)'], pending: ['Pendiente','var(--yellow)'], in_progress: ['En proceso','var(--blue)'], done: ['Completado','var(--green)'] };
    const pList = document.getElementById('client-projects-list');
    pList.innerHTML = projs.map(p => {
        const [label, color] = statusMap[p.status] || ['—','var(--text-muted)'];
        return `
            <div class="order-item" onclick="window.openProjectModal(${p.id})" style="cursor:pointer;">
                <div class="order-info">
                    <strong><i class="fas ${p.type === 'painting' ? 'fa-palette' : 'fa-microchip'}" style="color:var(--text-muted);font-size:0.7rem;margin-right:4px;"></i>${p.name}</strong>
                    <span>${p.date}</span>
                </div>
                <span style="font-size:0.65rem;font-weight:700;color:${color};">${label}</span>
            </div>
        `;
    }).join('') || '<p class="text-muted" style="font-size:0.75rem;text-align:center;padding:0.5rem;">Sin proyectos</p>';
};

window.deleteClient = () => {
    if(!state.selectedClient) return;
    if(!confirm(`¿Eliminar a ${state.selectedClient.name}?`)) return;
    state.clients = state.clients.filter(c => c.id !== state.selectedClient.id);
    state.selectedClient = null;
    document.getElementById('client-details-card').style.display = 'none';
    saveState();
};

window.closeClientDetails = () => {
    document.getElementById('client-details-card').style.display = 'none';
    state.selectedClient = null;
};

// Projects Kanban
function renderProjectsKanban() {
    const cols3D = { pending: '', in_progress: '', done: '' };
    const colsPaint = { pending: '', in_progress: '', done: '' };
    const counts = { pending: 0, in_progress: 0, done: 0, pendingPaint: 0, progressPaint: 0, donePaint: 0 };
    let draftsHtml = '';
    let totalHours = 0, doneCount = 0, activeCount = 0;
    
    state.projects.forEach(p => {
        totalHours += (p.timeLogged || 0);
        if(p.status === 'done') doneCount++;
        if(p.status === 'in_progress') activeCount++;
        
        if (p.status === 'draft') {
            draftsHtml += `
                <div class="card" style="padding:0.75rem;border:1px dashed var(--accent2);">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span class="design-tag" style="margin:0;background:rgba(234,179,8,0.1);color:#eab308;">${p.clientName}</span>
                        <span style="font-size:0.68rem;color:var(--text-muted);">${p.date}</span>
                    </div>
                    <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
                        <i class="fas ${p.type === 'painting' ? 'fa-palette' : 'fa-microchip'}" style="color:var(--text-muted);font-size:0.72rem;"></i>
                        <h4 style="font-size:0.88rem;font-weight:600;color:var(--text-1);margin:0;">${p.name}</h4>
                    </div>
                    <div style="display:flex;gap:6px;">
                        <button class="btn-secondary" style="flex:1;padding:4px;font-size:0.72rem;" onclick="window.openProjectModal(${p.id})"><i class="fas fa-eye"></i> Ver</button>
                        <button class="btn-primary" style="flex:1;padding:4px;font-size:0.72rem;" onclick="window.changeProjectStatus(${p.id}, 'pending')"><i class="fas fa-check"></i> Confirmar</button>
                    </div>
                </div>
            `;
            return;
        }

        const isPaint = p.type === 'painting';
        if (!isPaint) counts[p.status]++;
        else {
            if(p.status === 'pending') counts.pendingPaint++;
            else if(p.status === 'in_progress') counts.progressPaint++;
            else counts.donePaint++;
        }

        const tasks = p.tasks || [];
        const tasksDone = tasks.filter(t => t.done).length;
        const taskPct = tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0;
        const linkedCount = (p.linkedDesigns || []).length;
        let totalValue = 0;
        (p.linkedDesigns || []).forEach(dId => {
            const d = state.designs.find(x => x.id == dId);
            if(d) totalValue += d.price;
        });

        const priority = p.priority || 'normal';
        const prioMap = {
            urgent: '<span style="font-size:0.55rem;font-weight:700;background:rgba(239,68,68,0.15);color:var(--red);padding:1px 4px;border-radius:3px;">URGENTE</span>',
            high: '<span style="font-size:0.55rem;font-weight:700;background:rgba(245,158,11,0.15);color:var(--yellow);padding:1px 4px;border-radius:3px;">ALTA</span>',
            normal: '', low: ''
        };

        const daysSince = Math.floor((Date.now() - new Date(p.date).getTime()) / 86400000);
        const daysLabel = daysSince === 0 ? 'Hoy' : daysSince === 1 ? 'Ayer' : `${daysSince}d`;

        const cardHtml = `
            <div class="kanban-card" onclick="window.openProjectModal(${p.id})">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <div style="display:flex;align-items:center;gap:3px;">
                        <span class="design-tag" style="margin:0;${isPaint ? 'background:rgba(168,85,247,0.12);color:var(--purple);' : ''}">${p.clientName}</span>
                        ${prioMap[priority]}
                    </div>
                    <span style="font-size:0.6rem;color:var(--text-muted);">${daysLabel}</span>
                </div>
                <h4 style="font-size:0.8rem;font-weight:600;margin-bottom:3px;color:var(--text-1);">${p.name}</h4>
                ${p.artist ? `<div style="font-size:0.62rem;color:var(--purple);margin-bottom:3px;"><i class="fas fa-user-pen"></i> ${p.artist}</div>` : ''}
                <div style="display:flex;gap:6px;align-items:center;margin-bottom:5px;">
                    ${p.timeLogged ? `<span style="font-size:0.6rem;color:var(--text-muted);"><i class="fas fa-clock" style="margin-right:2px;"></i>${p.timeLogged}h</span>` : ''}
                    ${linkedCount > 0 ? `<span style="font-size:0.6rem;color:var(--text-muted);"><i class="fas fa-cube" style="margin-right:2px;"></i>${linkedCount}</span>` : ''}
                    ${totalValue > 0 ? `<span style="font-size:0.6rem;color:var(--green);font-weight:600;">€${totalValue.toFixed(0)}</span>` : ''}
                </div>
                ${tasks.length > 0 ? `
                <div style="margin-bottom:5px;">
                    <div style="display:flex;justify-content:space-between;font-size:0.55rem;color:var(--text-muted);margin-bottom:2px;"><span>Checklist</span><span>${tasksDone}/${tasks.length}</span></div>
                    <div style="height:3px;background:var(--s3);border-radius:99px;overflow:hidden;"><div style="height:100%;width:${taskPct}%;background:${taskPct===100?'var(--green)':'var(--accent)'};border-radius:99px;"></div></div>
                </div>` : ''}
                <div style="display:flex;gap:4px;">
                    ${p.status !== 'pending' ? `<button class="btn-secondary" style="flex:1;padding:3px;font-size:0.7rem" onclick="event.stopPropagation();window.changeProjectStatus(${p.id},'${p.status === 'done' ? 'in_progress' : 'pending'}')"><i class="fas fa-arrow-left"></i></button>` : ''}
                    ${p.status !== 'done' ? `<button class="btn-secondary" style="flex:1;padding:3px;font-size:0.7rem;border-color:var(--accent);color:var(--accent2)" onclick="event.stopPropagation();window.changeProjectStatus(${p.id},'${p.status === 'pending' ? 'in_progress' : 'done'}')"><i class="fas fa-arrow-right"></i></button>` : ''}
                </div>
            </div>
        `;

        if (isPaint) colsPaint[p.status] += cardHtml;
        else cols3D[p.status] += cardHtml;
    });
    
    // KPIs
    const total = state.projects.length;
    document.getElementById('proj-kpi-total').innerText = total;
    document.getElementById('proj-kpi-active').innerText = activeCount;
    document.getElementById('proj-kpi-rate').innerText = total > 0 ? Math.round((doneCount / total) * 100) + '%' : '0%';
    document.getElementById('proj-kpi-hours').innerText = totalHours + 'h';
    
    document.getElementById('drafts-container').innerHTML = draftsHtml || '<p class="text-muted" style="grid-column:1/-1;font-size:0.75rem;">No hay presupuestos pendientes.</p>';
    
    document.getElementById('count-pending').innerText = counts.pending;
    document.getElementById('count-progress').innerText = counts.in_progress;
    document.getElementById('count-done').innerText = counts.done;
    document.getElementById('count-pending-paint').innerText = counts.pendingPaint;
    document.getElementById('count-progress-paint').innerText = counts.progressPaint;
    document.getElementById('count-done-paint').innerText = counts.donePaint;
    
    document.querySelector('#kanban-pending .kanban-cards').innerHTML = cols3D.pending;
    document.querySelector('#kanban-progress .kanban-cards').innerHTML = cols3D.in_progress;
    document.querySelector('#kanban-done .kanban-cards').innerHTML = cols3D.done;
    document.querySelector('#kanban-pending-paint .kanban-cards').innerHTML = colsPaint.pending;
    document.querySelector('#kanban-progress-paint .kanban-cards').innerHTML = colsPaint.in_progress;
    document.querySelector('#kanban-done-paint .kanban-cards').innerHTML = colsPaint.done;
}

window.changeProjectStatus = (id, status) => {
    const p = state.projects.find(x => x.id === id);
    if(p) { 
        const oldStatus = p.status;
        p.status = status; 
        
        // Automation: Subtract inventory if project is done
        if(status === 'done' && oldStatus !== 'done' && p.linkedMaterialId) {
            const material = state.inventory.find(m => m.id === p.linkedMaterialId);
            if(material) {
                let totalWeight = 0;
                p.linkedDesigns.forEach(dId => {
                    const d = state.designs.find(x => x.id == dId);
                    if(d && d.weight) totalWeight += d.weight;
                });
                if(totalWeight > 0) {
                    material.stock -= totalWeight;
                    addTransaction(`Material para ${p.name}`, totalWeight * (material.price / 1000), 'expense', 'Logística');
                }
            }
        }
        
        saveState(); 
    }
};

window.addProject = () => {
    if(!state.clients.length) { alert("Añade un cliente primero en la pestaña de Dashboard"); return; }
    
    const select = document.getElementById('new-proj-client');
    select.innerHTML = state.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    document.getElementById('new-proj-name').value = '';
    document.getElementById('add-project-modal').classList.add('active');
};

window.confirmAddProject = () => {
    const clientId = parseInt(document.getElementById('new-proj-client').value);
    const client = state.clients.find(c => c.id === clientId);
    const name = document.getElementById('new-proj-name').value;
    const type = document.getElementById('new-proj-type').value;
    const priority = document.getElementById('new-proj-priority').value;
    const deadline = document.getElementById('new-proj-deadline').value;
    const notes = document.getElementById('new-proj-notes').value;
    
    if(!client || !name) { alert("Datos inválidos"); return; }
    
    state.projects.push({
        id: Date.now(), clientId: client.id, clientName: client.name, name, type,
        date: new Date().toISOString().split('T')[0], status: 'draft',
        priority, deadline: deadline || null, notes: notes || '',
        tasks: [], linkedDesigns: [], timeLogged: 0, sketches: [],
        artist: '', imgBefore: null, imgAfter: null
    });
    saveState();
    document.getElementById('add-project-modal').classList.remove('active');
};

window.openProjectModal = (id) => {
    state.currentProjectModalId = id;
    renderProjectModal();
    document.getElementById('project-modal').classList.add('active');
};

window.closeProjectModal = () => {
    document.getElementById('project-modal').classList.remove('active');
};

function renderProjectModal() {
    const p = state.projects.find(x => x.id === state.currentProjectModalId);
    if(!p) return;
    
    if(!p.tasks) p.tasks = []; if(!p.linkedDesigns) p.linkedDesigns = []; if(!p.sketches) p.sketches = [];
    
    // Header
    document.getElementById('proj-modal-name').innerText = p.name;
    document.getElementById('proj-modal-client').innerText = `${p.clientName} · ${p.type === 'painting' ? 'Pintura' : 'Impresión 3D'}`;
    
    const typeIcon = document.getElementById('proj-modal-type-icon');
    if(p.type === 'painting') {
        typeIcon.style.background = 'rgba(168,85,247,0.15)';
        typeIcon.innerHTML = '<i class="fas fa-palette" style="color:var(--purple);"></i>';
    } else {
        typeIcon.style.background = 'rgba(99,102,241,0.15)';
        typeIcon.innerHTML = '<i class="fas fa-microchip" style="color:var(--accent2);"></i>';
    }
    
    // Status badge
    const statusBadge = document.getElementById('proj-modal-status-badge');
    const statusStyles = {
        draft: ['Borrador','rgba(100,116,139,0.15)','var(--text-muted)'],
        pending: ['Pendiente','rgba(245,158,11,0.15)','var(--yellow)'],
        in_progress: ['En proceso','rgba(56,189,248,0.15)','var(--blue)'],
        done: ['Completado','rgba(34,197,94,0.15)','var(--green)']
    };
    const [sLabel, sBg, sColor] = statusStyles[p.status] || statusStyles.draft;
    statusBadge.innerText = sLabel;
    statusBadge.style.background = sBg;
    statusBadge.style.color = sColor;
    
    // Priority
    document.getElementById('proj-modal-priority').value = p.priority || 'normal';
    
    // Stats row
    document.getElementById('proj-modal-date').innerText = p.date || '—';
    document.getElementById('proj-modal-deadline').innerText = p.deadline || '—';
    document.getElementById('proj-modal-time').innerText = `${p.timeLogged || 0}h`;
    
    const tasksDone = p.tasks.filter(t => t.done).length;
    document.getElementById('proj-modal-task-summary').innerText = `${tasksDone}/${p.tasks.length}`;
    
    let totalValue = 0;
    p.linkedDesigns.forEach(dId => { const d = state.designs.find(x => x.id == dId); if(d) totalValue += d.price; });
    document.getElementById('proj-modal-value').innerText = `€${totalValue.toFixed(0)}`;
    
    // Time big display
    const timeBig = document.getElementById('proj-modal-time-big');
    if(timeBig) timeBig.innerText = `${p.timeLogged || 0}h`;
    
    // Deadline bar
    const deadlineBar = document.getElementById('proj-modal-deadline-bar');
    if(p.deadline) {
        deadlineBar.style.display = 'flex';
        const daysLeft = Math.ceil((new Date(p.deadline) - Date.now()) / 86400000);
        const daysEl = document.getElementById('proj-modal-days-left');
        if(daysLeft < 0) { daysEl.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:var(--red);"></i> ${Math.abs(daysLeft)} días de retraso`; daysEl.style.color = 'var(--red)'; deadlineBar.style.background = 'rgba(239,68,68,0.08)'; }
        else if(daysLeft <= 3) { daysEl.innerHTML = `<i class="fas fa-clock" style="color:var(--yellow);"></i> ${daysLeft} días restantes`; daysEl.style.color = 'var(--yellow)'; deadlineBar.style.background = 'rgba(245,158,11,0.06)'; }
        else { daysEl.innerHTML = `<i class="fas fa-calendar-check" style="color:var(--green);"></i> ${daysLeft} días restantes`; daysEl.style.color = 'var(--green)'; deadlineBar.style.background = 'rgba(34,197,94,0.06)'; }
    } else {
        deadlineBar.style.display = 'none';
    }
    
    // Notes & Artist
    document.getElementById('proj-modal-notes').value = p.notes || '';
    document.getElementById('proj-modal-artist').value = p.artist || '';
    document.getElementById('proj-modal-artist-box').style.display = p.type === 'painting' ? 'block' : 'none';
    document.getElementById('painting-comparison').style.display = p.type === 'painting' ? 'block' : 'none';
    
    if(p.type === 'painting') {
        document.getElementById('before-img-container').innerHTML = p.imgBefore ? `<img src="${p.imgBefore}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-plus"></i>';
        document.getElementById('after-img-container').innerHTML = p.imgAfter ? `<img src="${p.imgAfter}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-plus"></i>';
    }
    
    // Progress bar
    const taskPct = p.tasks.length > 0 ? Math.round((tasksDone / p.tasks.length) * 100) : 0;
    const progressFill = document.getElementById('proj-modal-progress-fill');
    if(progressFill) { progressFill.style.width = taskPct + '%'; progressFill.style.background = taskPct === 100 ? 'var(--green)' : 'var(--accent)'; }

    // Checklist
    document.getElementById('proj-modal-checklist').innerHTML = p.tasks.map((t, i) => `
        <label style="display:flex;align-items:center;gap:6px;font-size:0.78rem;padding:3px 0;cursor:pointer;${t.done ? 'color:var(--text-muted);text-decoration:line-through' : ''}">
            <input type="checkbox" ${t.done?'checked':''} onchange="window.toggleProjectTask(${i})" style="width:14px;height:14px;"> ${t.text}
        </label>
    `).join('') || '<p class="text-muted" style="font-size:0.72rem;">Sin tareas</p>';
    
    // Designs
    document.getElementById('proj-modal-designs').innerHTML = p.linkedDesigns.map(dId => {
        const d = state.designs.find(x => x.id == dId);
        return d ? `
            <div class="order-item" style="padding:5px 8px;">
                <div class="order-info"><strong style="font-size:0.78rem;">${d.name}</strong><span style="font-size:0.65rem;">${d.weight}g · ${d.category}</span></div>
                <span style="font-size:0.78rem;font-weight:700;color:var(--green);">€${d.price.toFixed(2)}</span>
            </div>` : '';
    }).join('') || '<p class="text-muted" style="font-size:0.72rem;">Sin diseños vinculados</p>';
    
    document.getElementById('proj-design-select').innerHTML = state.designs.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    
    // Material
    const matBox = document.getElementById('proj-material-box');
    const matSelect = document.getElementById('proj-material-select');
    if(matBox && matSelect) {
        matBox.style.display = p.type === 'painting' ? 'none' : 'block';
        matSelect.innerHTML = `<option value="">Seleccionar filamento...</option>` + state.inventory.map(m => `<option value="${m.id}" ${p.linkedMaterialId == m.id ? 'selected' : ''}>${m.material || m.name} ${m.color} (${m.current || m.stock}g)</option>`).join('');
    }
    
    // Sketches
    const sContainer = document.getElementById('proj-modal-sketches');
    if(sContainer) {
        sContainer.innerHTML = p.sketches.map((url, i) => `
            <div style="position:relative;width:90px;height:90px;border-radius:8px;overflow:hidden;border:1px solid var(--border);flex-shrink:0;">
                <img src="${url}" style="width:100%;height:100%;object-fit:cover;">
                <div style="position:absolute;inset:0;background:rgba(0,0,0,0.4);display:flex;gap:3px;align-items:center;justify-content:center;opacity:0;transition:opacity .15s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                    <button class="btn-icon" onclick="window.openPaint('${url}',${i})" style="width:26px;height:26px;background:var(--accent);color:white;border:none;font-size:0.65rem;"><i class="fas fa-paintbrush"></i></button>
                    <button class="btn-icon" onclick="window.removeProjectSketch(${i})" style="width:26px;height:26px;background:var(--red);color:white;border:none;font-size:0.65rem;"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('') || '<p class="text-muted" style="font-size:0.72rem;">Sin bocetos</p>';
    }
}

window.addProjectTask = () => {
    const input = document.getElementById('proj-new-task');
    if(!input.value) return;
    const p = state.projects.find(x => x.id === state.currentProjectModalId);
    p.tasks.push({text: input.value, done: false});
    input.value = ''; saveState(); renderProjectModal();
};

window.toggleProjectTask = (idx) => {
    const p = state.projects.find(x => x.id === state.currentProjectModalId);
    p.tasks[idx].done = !p.tasks[idx].done; saveState(); renderProjectModal();
};

window.linkDesignToProject = () => {
    const val = parseInt(document.getElementById('proj-design-select').value);
    const p = state.projects.find(x => x.id === state.currentProjectModalId);
    if(val && !p.linkedDesigns.includes(val)) { p.linkedDesigns.push(val); saveState(); renderProjectModal(); }
};

window.addProjectTime = () => {
    const hrs = parseFloat(document.getElementById('proj-add-time').value);
    if(hrs > 0) { 
        const p = state.projects.find(x => x.id === state.currentProjectModalId);
        p.timeLogged = (p.timeLogged || 0) + hrs; 
        document.getElementById('proj-add-time').value = ''; 
        saveState(); renderProjectModal(); 
    }
};

window.saveProjectPriority = () => {
    const p = state.projects.find(x => x.id === state.currentProjectModalId);
    if(p) { p.priority = document.getElementById('proj-modal-priority').value; saveState(); }
};

window.deleteProject = () => {
    const p = state.projects.find(x => x.id === state.currentProjectModalId);
    if(!p) return;
    if(!confirm(`¿Eliminar el proyecto "${p.name}"? Esta acción no se puede deshacer.`)) return;
    state.projects = state.projects.filter(x => x.id !== p.id);
    saveState();
    document.getElementById('project-modal').classList.remove('active');
};

window.saveProjectNotes = () => {
    const p = state.projects.find(x => x.id === state.currentProjectModalId);
    if(p) { p.notes = document.getElementById('proj-modal-notes').value; saveState(); }
};

window.saveProjectArtist = () => {
    const p = state.projects.find(x => x.id === state.currentProjectModalId);
    if(p) { p.artist = document.getElementById('proj-modal-artist').value; saveState(); }
};

window.saveProjectMaterial = () => {
    const p = state.projects.find(x => x.id === state.currentProjectModalId);
    if(p) { 
        p.linkedMaterialId = parseInt(document.getElementById('proj-material-select').value); 
        saveState(); 
    }
};

window.addProjectSketch = () => {
    const url = prompt("URL de la imagen (o deja vacío para dibujar desde cero):");
    const p = state.projects.find(x => x.id === state.currentProjectModalId);
    if(url === "") {
        window.openPaint(); // Draw from scratch
    } else if(url) {
        p.sketches.push(url); saveState(); renderProjectModal();
    }
};

window.removeProjectSketch = (idx) => {
    const p = state.projects.find(x => x.id === state.currentProjectModalId);
    p.sketches.splice(idx, 1); saveState(); renderProjectModal();
};

// ────────────────────────────────────────────────────────────
// DIGITAL PAINTING TOOL
// ────────────────────────────────────────────────────────────
let canvas, ctx, drawing = false, currentTool = 'brush', currentSketchIdx = null;

function initPaint() {
    canvas = document.getElementById('paint-canvas');
    if(!canvas) return;
    ctx = canvas.getContext('2d');
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
}

window.openPaint = (url = null, idx = null) => {
    currentSketchIdx = idx;
    document.getElementById('paint-modal').classList.add('active');
    if(!canvas) initPaint();
    
    window.clearCanvas();
    if(url) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            // Center image if smaller or scale down
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = url;
    }
};

function startDrawing(e) {
    drawing = true;
    draw(e);
}

function stopDrawing() {
    drawing = false;
    ctx.beginPath();
}

function draw(e) {
    if(!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineWidth = document.getElementById('brush-size').value;
    ctx.lineCap = 'round';
    ctx.strokeStyle = currentTool === 'brush' ? document.getElementById('paint-color').value : '#ffffff';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

window.setTool = (tool) => {
    currentTool = tool;
    document.getElementById('brush-tool').style.borderColor = tool === 'brush' ? 'var(--accent)' : 'var(--border)';
    document.getElementById('eraser-tool').style.borderColor = tool === 'eraser' ? 'var(--accent)' : 'var(--border)';
};

window.clearCanvas = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

window.savePaint = () => {
    const p = state.projects.find(x => x.id === state.currentProjectModalId);
    if(p) {
        const dataUrl = canvas.toDataURL("image/png");
        if(currentSketchIdx !== null) {
            p.sketches[currentSketchIdx] = dataUrl;
        } else {
            p.sketches.push(dataUrl);
        }
        saveState();
        renderProjectModal();
        window.closePaint();
    }
};

window.closePaint = () => {
    document.getElementById('paint-modal').classList.remove('active');
};

window.uploadPaintingImg = (field) => {
    const url = prompt(`URL de la imagen (${field === 'before' ? 'Antes' : 'Después'}):`);
    if(url) {
        const p = state.projects.find(x => x.id === state.currentProjectModalId);
        if(field === 'before') p.imgBefore = url;
        else p.imgAfter = url;
        saveState();
        renderProjectModal();
    }
};

window.generateProjectInvoice = () => {
    const p = state.projects.find(x => x.id === state.currentProjectModalId);
    if(!p) return;
    
    const client = state.clients.find(c => c.id === p.clientId);
    document.getElementById('inv-client-name').innerText = p.clientName;
    document.getElementById('inv-client-contact').innerText = client ? client.email : '';
    document.getElementById('inv-date').innerText = new Date().toLocaleDateString();
    document.getElementById('inv-num').innerText = `REF: #PROJ-${p.id.toString().slice(-6)}`;
    
    // Bind settings
    document.getElementById('inv-company-name').innerText = state.settings.name;
    document.getElementById('inv-company-sub').innerText = state.settings.sub;
    document.getElementById('inv-iban').innerText = state.settings.iban;
    document.getElementById('inv-bizum').innerText = state.settings.bizum;
    document.getElementById('inv-titular').innerText = state.settings.titular;
    
    let html = ''; let sub = 0;
    p.linkedDesigns.forEach(dId => {
        const d = state.designs.find(x => x.id == dId);
        if(d) { 
            html += `<tr>
                <td style="padding:12px 0; color:#0f172a; border-bottom: 1px dashed #e2e8f0;">${d.name}</td>
                <td style="padding:12px 0; text-align:center; color:#475569; border-bottom: 1px dashed #e2e8f0;">1</td>
                <td style="padding:12px 0; text-align:right; color:#475569; border-bottom: 1px dashed #e2e8f0;">€${d.price.toFixed(2)}</td>
                <td style="padding:12px 0; text-align:right; color:#0f172a; font-weight:bold; border-bottom: 1px dashed #e2e8f0;">€${d.price.toFixed(2)}</td>
            </tr>`; 
            sub += d.price; 
        }
    });
    if(p.timeLogged > 0) {
        const cost = p.timeLogged * 15;
        html += `<tr>
            <td style="padding:12px 0; color:#0f172a; border-bottom: 1px dashed #e2e8f0;">Mano de obra (${p.timeLogged}h)</td>
            <td style="padding:12px 0; text-align:center; color:#475569; border-bottom: 1px dashed #e2e8f0;">${p.timeLogged}</td>
            <td style="padding:12px 0; text-align:right; color:#475569; border-bottom: 1px dashed #e2e8f0;">€15.00/h</td>
            <td style="padding:12px 0; text-align:right; color:#0f172a; font-weight:bold; border-bottom: 1px dashed #e2e8f0;">€${cost.toFixed(2)}</td>
        </tr>`;
        sub += cost;
    }
    if(sub === 0) { alert("El proyecto no tiene costes vinculados."); return; }
    
    const tax = sub * 0.21;
    document.getElementById('inv-items').innerHTML = html;
    document.getElementById('inv-subtotal').innerText = `€${sub.toFixed(2)}`;
    document.getElementById('inv-tax').innerText = `€${tax.toFixed(2)}`;
    document.getElementById('inv-grand-total').innerText = `€${(sub+tax).toFixed(2)}`;
    document.getElementById('inv-advance').innerText = `€${((sub+tax)/2).toFixed(2)}`;
    document.getElementById('inv-pending').innerText = `€${((sub+tax)/2).toFixed(2)}`;
    
    window.closeProjectModal();
    document.getElementById('invoice-modal').classList.add('active');
};

window.newBudget = () => {
    if(!state.selectedClient) return;
    const dummyProj = { 
        id: Date.now(), 
        clientId: state.selectedClient.id, 
        clientName: state.selectedClient.name,
        name: 'Presupuesto Rápido',
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        timeLogged: 0, 
        linkedDesigns: [],
        tasks: [],
        sketches: []
    };
    state.currentProjectModalId = dummyProj.id;
    state.projects.push(dummyProj);
    window.generateProjectInvoice();
};

window.closeInvoice = () => document.getElementById('invoice-modal').classList.remove('active');
window.print = () => window.print();

// Search Filter Global
document.getElementById('global-search').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    document.querySelectorAll('.design-card, .kanban-card, .order-item, .spool-card').forEach(el => {
        if(el.innerText.toLowerCase().includes(val)) el.style.display = '';
        else el.style.display = 'none';
    });
});

// ────────────────────────────────────────────────────────────
// PROFILES LOGIC
// ────────────────────────────────────────────────────────────
function renderProfiles() {
    const list = document.getElementById('profiles-list');
    if (!list) return;
    
    let html = '';
    state.profiles.forEach(p => {
        html += `
            <tr>
                <td><strong>${p.material}</strong></td>
                <td>${p.printer}</td>
                <td><span class="tag tag-yellow"><i class="fas fa-fire"></i> ${p.temp}°C</span></td>
                <td><span class="tag tag-yellow"><i class="fas fa-bed"></i> ${p.bed}°C</span></td>
                <td>${p.flow}</td>
                <td>${p.ret} mm</td>
                <td>
                    <button class="btn-icon" style="color:var(--red)" onclick="window.deleteProfile(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    
    if(state.profiles.length === 0) {
        html = `<tr><td colspan="7" class="text-center text-muted" style="padding: 2rem;">No hay perfiles guardados. ¡Añade el primero!</td></tr>`;
    }
    
    list.innerHTML = html;
}

window.addProfile = () => {
    document.getElementById('new-prof-mat').value = '';
    document.getElementById('new-prof-printer').value = '';
    document.getElementById('add-profile-modal').classList.add('active');
};

window.confirmAddProfile = () => {
    const material = document.getElementById('new-prof-mat').value;
    const printer = document.getElementById('new-prof-printer').value;
    const temp = parseFloat(document.getElementById('new-prof-temp').value);
    const bed = parseFloat(document.getElementById('new-prof-bed').value);
    const flow = parseFloat(document.getElementById('new-prof-flow').value);
    const ret = parseFloat(document.getElementById('new-prof-ret').value);
    
    if(!material || !printer) { alert("El material y la impresora son obligatorios"); return; }
    
    state.profiles.push({
        id: Date.now(),
        material, printer, temp, bed, flow, ret
    });
    saveState();
    document.getElementById('add-profile-modal').classList.remove('active');
};

window.deleteProfile = (id) => {
    if(confirm("¿Seguro que quieres eliminar este perfil?")) {
        state.profiles = state.profiles.filter(p => p.id !== id);
        saveState();
        renderProfiles();
    }
};

// ────────────────────────────────────────────────────────────
// SETTINGS LOGIC
// ────────────────────────────────────────────────────────────
function renderSettings() {
    document.getElementById('set-company-name').value = state.settings.name;
    document.getElementById('set-company-sub').value = state.settings.sub;
    document.getElementById('set-company-email').value = state.settings.email;
    document.getElementById('set-company-phone').value = state.settings.phone;
    document.getElementById('set-company-iban').value = state.settings.iban;
    document.getElementById('set-company-bizum').value = state.settings.bizum;
    document.getElementById('set-company-titular').value = state.settings.titular;
}

window.saveSettings = () => {
    state.settings = {
        name: document.getElementById('set-company-name').value || 'NINOT LAB',
        sub: document.getElementById('set-company-sub').value,
        email: document.getElementById('set-company-email').value,
        phone: document.getElementById('set-company-phone').value,
        iban: document.getElementById('set-company-iban').value,
        bizum: document.getElementById('set-company-bizum').value,
        titular: document.getElementById('set-company-titular').value
    };
    saveState();
    alert('Configuración guardada correctamente.');
};

// ────────────────────────────────────────────────────────────
// DATA PORTABILITY (EXPORT/IMPORT)
// ────────────────────────────────────────────────────────────
window.exportData = () => {
    const data = {
        designs: state.designs,
        finance: state.finance,
        inventory: state.inventory,
        clients: state.clients,
        projects: state.projects,
        profiles: state.profiles,
        settings: state.settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ninot_lab_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

window.importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm("Esto reemplazará todos tus datos actuales. ¿Deseas continuar?")) {
                if (data.designs)   localStorage.setItem('ninot_designs', JSON.stringify(data.designs));
                if (data.finance)   localStorage.setItem('ninot_finance', JSON.stringify(data.finance));
                if (data.inventory) localStorage.setItem('ninot_inventory', JSON.stringify(data.inventory));
                if (data.clients)   localStorage.setItem('ninot_clients', JSON.stringify(data.clients));
                if (data.projects)  localStorage.setItem('ninot_projects', JSON.stringify(data.projects));
                if (data.profiles)  localStorage.setItem('ninot_profiles', JSON.stringify(data.profiles));
                if (data.settings)  localStorage.setItem('ninot_settings', JSON.stringify(data.settings));
                
                alert("Datos importados con éxito. La página se recargará.");
                window.location.reload();
            }
        } catch (err) {
            alert("Error al importar el archivo. Asegúrate de que es un JSON válido de Ninot Lab.");
        }
    };
    reader.readAsText(file);
};

