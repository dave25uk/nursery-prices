const SUPABASE_URL = 'https://xnjsvclilulxxnuvyfla.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuanN2Y2xpbHVseHhudXZ5ZmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTM0NjYsImV4cCI6MjA5MTQ2OTQ2Nn0.jJheSQImSYPRaALGyuUNU5bkUl2D7SihcolMdk7dBDI';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
/**
 * THE OLD FORGE NURSERY - PWA CORE
 * Version 13.5: Performance & Admin Polish
 */


const app = {
    data: [],
    categories: [],
    currentView: 'home',

    async init() {
        // 1. Immediate Cache Load
        const cache = localStorage.getItem('nursery_data');
        if (cache) {
            this.data = JSON.parse(cache);
            this.refreshState();
        }

        // 2. Background Live Sync
        try {
            const { data, error } = await sb.from('products').select('*');
            if (!error && data) {
                this.data = data;
                localStorage.setItem('nursery_data', JSON.stringify(data));
                this.refreshState();
            }
        } catch (e) {
            console.error("Connection Error:", e);
        }
        
        this.renderAZ();
    },

    refreshState() {
        this.categories = [...new Set(this.data.map(p => p.category || "Uncategorized"))].sort();
        this.renderSidebar();
        
        // Re-render current view to ensure data is fresh
        if (this.currentView === 'home') this.renderHome();
        else if (this.currentView === 'search') this.handleSearch();
        else if (this.currentView === 'admin') this.renderAdminTable();
        else this.renderCategory(this.currentView);
    },

    // --- NAVIGATION ---

    renderSidebar() {
        const nav = document.getElementById('sidebar-nav');
        let html = `<button class="nav-btn ${this.currentView === 'home' ? 'active' : ''}" onclick="app.renderHome()">HOME</button>`;
        
        this.categories.forEach(cat => {
            html += `<button class="nav-btn ${this.currentView === cat ? 'active' : ''}" onclick="app.renderCategory('${cat}')">${cat}</button>`;
        });

        html += `
            <div style="margin-top:auto; padding-top:20px; border-top:1px solid #ddd;">
                <button class="nav-btn ${this.currentView === 'admin' ? 'active' : ''}" 
                    onclick="app.renderAdminTable()" style="background:#f8f9fa; border: 1px solid #333;">
                    ⚙️ MANAGEMENT
                </button>
            </div>
        `;
        nav.innerHTML = html;
    },

    renderHome() {
        this.currentView = 'home';
        document.getElementById('az-rail').style.display = 'none';
        document.getElementById('main-content').innerHTML = `
            <div class="home-view">
                <img src="logo.png" alt="Logo" onerror="this.style.display='none'">
                <h2 style="color:#2e7d32">Price List 2026</h2>
                <p style="color:#999; font-size:12px; font-weight:bold;">READY FOR SERVICE</p>
            </div>
        `;
        this.renderSidebar();
    },

    // --- VIEW RENDERING ---

    renderCategory(cat) {
        this.currentView = cat;
        const filtered = this.data.filter(p => p.category === cat).sort((a,b) => a.name.localeCompare(b.name));
        this.renderList(filtered);
        document.getElementById('az-rail').style.display = 'flex';
        this.renderSidebar();
    },

    renderList(products) {
        const container = document.getElementById('main-content');
        let html = '<div class="product-list">';
        
        products.forEach(p => {
            const s = (p.stock || "").toLowerCase();
            const bgClass = s.includes('out') ? 'card-out' : s.includes('low') ? 'card-low' : '';
            
            html += `
                <div class="product-card ${bgClass}">
                    <div class="prod-info">
                        <div class="prod-name">${p.name}</div>
                        <div class="status-line">
                            ${p.stock ? `<span class="stock-label">${p.stock}</span>` : ''}
                            ${p.comments ? `<span class="comment-label">${p.comments}</span>` : ''}
                        </div>
                    </div>
                    <div class="prod-price">${p.price || 'TBC'}</div>
                </div>`;
        });
        
        container.innerHTML = html + '</div>';
        container.scrollTop = 0;
    },

    // --- ADMIN MANAGEMENT ---

    renderAdminTable() {
        this.currentView = 'admin';
        document.getElementById('az-rail').style.display = 'none';
        this.renderSidebar();

        const container = document.getElementById('main-content');
        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="margin:0;">Management Mode</h2>
                <button class="nav-btn" onclick="app.addNewProduct()" style="padding:10px 20px; background: #2e7d32; color:white;">+ Add New Plant</button>
            </div>
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th width="20%">Category</th>
                            <th width="35%">Plant Name</th>
                            <th width="15%">Price</th>
                            <th width="15%">Stock Status</th>
                            <th width="15%">Comments</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        const sorted = [...this.data].sort((a,b) => (a.category || "").localeCompare(b.category || "") || a.name.localeCompare(b.name));

        sorted.forEach(p => {
            html += `
                <tr id="row-${p.id}">
                    <td><input type="text" value="${p.category || ''}" onchange="app.updateField(${p.id}, 'category', this.value, this)" list="cat-list"></td>
                    <td><input type="text" value="${p.name || ''}" onchange="app.updateField(${p.id}, 'name', this.value, this)"></td>
                    <td><input type="text" value="${p.price || ''}" onchange="app.updateField(${p.id}, 'price', this.value, this)"></td>
                    <td>
                        <select onchange="app.updateField(${p.id}, 'stock', this.value, this)">
                            <option value="" ${!p.stock ? 'selected' : ''}>In Stock</option>
                            <option value="Low Stock" ${p.stock === 'Low Stock' ? 'selected' : ''}>Low Stock</option>
                            <option value="Out of Stock" ${p.stock === 'Out of Stock' ? 'selected' : ''}>Out of Stock</option>
                        </select>
                    </td>
                    <td><input type="text" value="${p.comments || ''}" onchange="app.updateField(${p.id}, 'comments', this.value, this)"></td>
                </tr>
            `;
        });

        const catOptions = this.categories.map(c => `<option value="${c}">`).join('');
        
        html += `</tbody></table></div><datalist id="cat-list">${catOptions}</datalist>`;
        container.innerHTML = html;
    },

    async updateField(id, field, value, element) {
        const cell = element.parentElement;
        
        const { error } = await sb
            .from('products')
            .update({ [field]: value })
            .eq('id', id);

        if (error) {
            console.error(error);
            cell.style.backgroundColor = '#ffebee'; // Red for error
        } else {
            // Visual Success Feedback (Triggering CSS Animation)
            cell.classList.remove('cell-saved');
            void cell.offsetWidth; 
            cell.classList.add('cell-saved');

            // Internal Update
            const item = this.data.find(p => p.id === id);
            if (item) item[field] = value;
            localStorage.setItem('nursery_data', JSON.stringify(this.data));
            
            if (field === 'category') this.processCategories();
        }
    },

    async addNewProduct() {
        const name = prompt("Enter plant name:");
        if (!name) return;

        const { data, error } = await sb
            .from('products')
            .insert([{ name: name, category: 'Uncategorized', price: '£0.00' }])
            .select();

        if (!error && data) {
            this.data.push(data[0]);
            this.refreshState();
        }
    },

    // --- SEARCH & A-Z ---

    handleSearch() {
        const q = document.getElementById('main-search').value.toLowerCase();
        if (!q) { this.renderHome(); return; }
        
        this.currentView = 'search';
        const results = this.data.filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.tags && p.tags.toLowerCase().includes(q))
        ).sort((a,b) => a.name.localeCompare(b.name));
        
        this.renderList(results);
        document.getElementById('az-rail').style.display = 'flex';
        this.renderSidebar();
    },

    renderAZ() {
        const rail = document.getElementById('az-rail');
        const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        rail.innerHTML = alpha.map(l => `<div style="cursor:pointer;padding:2px;" onclick="app.scrollToLetter('${l}')">${l}</div>`).join("");
    },

    scrollToLetter(l) {
        const cards = document.getElementsByClassName('product-card');
        for (let card of cards) {
            const name = card.querySelector('.prod-name').innerText.trim().toUpperCase();
            if (name.startsWith(l)) {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                break;
            }
        }
    }
};

app.init();