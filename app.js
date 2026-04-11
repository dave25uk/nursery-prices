const SUPABASE_URL = 'https://xnjsvclilulxxnuvyfla.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuanN2Y2xpbHVseHhudXZ5ZmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTM0NjYsImV4cCI6MjA5MTQ2OTQ2Nn0.jJheSQImSYPRaALGyuUNU5bkUl2D7SihcolMdk7dBDI';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const app = {
    data: [],
    categories: [],
    currentView: 'home',
    editingId: null,

    async init() {
        const cache = localStorage.getItem('nursery_data');
        if (cache) {
            this.data = JSON.parse(cache);
            this.refreshState();
        }
        try {
            const { data, error } = await sb.from('products').select('*');
            if (!error && data) {
                this.data = data;
                localStorage.setItem('nursery_data', JSON.stringify(data));
                this.refreshState();
            }
        } catch (e) { console.error(e); }
        this.renderAZ();
        this.injectModal();
    },

    refreshState() {
        this.categories = [...new Set(this.data.map(p => p.category || "Uncategorized"))].sort();
        this.renderSidebar();
        if (this.currentView === 'home') this.renderHome();
        else if (this.currentView === 'search') this.handleSearch();
        else if (this.currentView === 'admin') this.renderAdminList();
        else this.renderCategory(this.currentView);
    },

    renderSidebar() {
        const nav = document.getElementById('sidebar-nav');
        let html = `<button class="nav-btn ${this.currentView === 'home' ? 'active' : ''}" onclick="app.renderHome()">HOME</button>`;
        this.categories.forEach(cat => {
            html += `<button class="nav-btn ${this.currentView === cat ? 'active' : ''}" onclick="app.renderCategory('${cat}')">${cat}</button>`;
        });
        html += `<div style="margin-top:auto; padding-top:20px; border-top:1px solid #ddd;">
                    <button class="nav-btn ${this.currentView === 'admin' ? 'active' : ''}" onclick="app.renderAdminList()" style="background:#f8f9fa; border: 1px solid #333;">⚙️ MANAGEMENT</button>
                 </div>`;
        nav.innerHTML = html;
    },

    renderHome() {
        this.currentView = 'home';
        document.getElementById('az-rail').style.display = 'none';
        document.getElementById('main-content').innerHTML = `
            <div class="home-view">
                <img src="logo.png" alt="The Old Forge Nursery">
                <h2>Price List 2026</h2>
            </div>`;
        this.renderSidebar();
    },

    renderCategory(cat) {
        this.currentView = cat;
        const filtered = this.data.filter(p => p.category === cat).sort((a,b) => a.name.localeCompare(b.name));
        this.renderList(filtered, false, ""); 
        document.getElementById('az-rail').style.display = 'flex';
        this.renderSidebar();
    },

    renderAdminList() {
        this.currentView = 'admin';
        document.getElementById('az-rail').style.display = 'none';
        const sorted = [...this.data].sort((a,b) => (a.category||"").localeCompare(b.category||"") || a.name.localeCompare(b.name));
        const headerHtml = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="margin:0;">Management Mode</h2>
                <button class="nav-btn" onclick="app.openEditModal(null)" style="background:var(--nursery-green); color:white;">+ ADD NEW</button>
            </div>`;
        this.renderList(sorted, true, headerHtml);
        this.renderSidebar();
    },

    renderList(products, isAdmin, prefixHtml) {
        const container = document.getElementById('main-content');
        let html = prefixHtml + '<div class="product-list">';
        
        products.forEach(p => {
            const catClass = `cat-${(p.category || "").toLowerCase().replace(/\s+/g, '-')}`;
            
            html += `
                <div class="product-card ${catClass}">
                    <div class="card-top-row">
                        <div class="prod-name">${p.name}</div>
                        ${p.offer ? `<div class="prod-offer">${p.offer}</div>` : ''}
                        <div class="prod-price">${p.price || ''}</div>
                        ${isAdmin ? `<button class="nav-btn" style="margin-left:10px; padding:8px;" onclick="app.openEditModal(${p.id})">EDIT</button>` : ''}
                    </div>
                    
                    ${(p.stock || p.comments) ? `
                        <div class="card-bottom-row">
                            ${p.stock ? `<span class="stock-alert">${p.stock}</span>` : ''}
                            ${p.comments ? `<span class="prod-comments">${p.comments}</span>` : ''}
                            ${isAdmin ? `<span class="admin-badge">${p.category}</span>` : ''}
                        </div>
                    ` : ''}
                </div>`;
        });
        
        container.innerHTML = html + '</div>';
        container.scrollTop = 0;
    },

    injectModal() {
        if(document.getElementById('edit-modal')) return;
        const modalHtml = `
            <div id="edit-modal" class="modal-overlay">
                <div class="modal-content">
                    <h3 id="modal-title" style="margin-top:0; color:var(--nursery-green);">Product Details</h3>
                    <div class="modal-field"><label>Category</label><input type="text" id="edit-cat" list="cat-list"></div>
                    <div class="modal-field"><label>Plant Name</label><input type="text" id="edit-name"></div>
                    <div class="modal-field"><label>Offer (e.g. 3 for £12)</label><input type="text" id="edit-offer"></div>
                    <div class="modal-field"><label>Price</label><input type="text" id="edit-price"></div>
                    <div class="modal-field"><label>Stock Alert</label>
                        <select id="edit-stock">
                            <option value="">Standard (In Stock)</option>
                            <option value="Low Stock">Low Stock</option>
                            <option value="Out of Stock">Out of Stock</option>
                        </select>
                    </div>
                    <div class="modal-field"><label>Comments</label><input type="text" id="edit-comments"></div>
                    <div class="modal-actions">
                        <button class="nav-btn btn-cancel" onclick="app.closeModal()">Cancel</button>
                        <button class="nav-btn btn-save" onclick="app.saveProduct()">Save Changes</button>
                    </div>
                    <button id="del-btn" class="nav-btn btn-delete" onclick="app.deleteProduct()">Delete Product</button>
                </div>
            </div><datalist id="cat-list"></datalist>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    openEditModal(id) {
        this.editingId = id;
        const modal = document.getElementById('edit-modal');
        document.getElementById('cat-list').innerHTML = this.categories.map(c => `<option value="${c}">`).join('');

        if (id) {
            const p = this.data.find(x => x.id === id);
            document.getElementById('modal-title').innerText = "Edit Product";
            document.getElementById('edit-cat').value = p.category || '';
            document.getElementById('edit-name').value = p.name || '';
            document.getElementById('edit-offer').value = p.offer || '';
            document.getElementById('edit-price').value = p.price || '';
            document.getElementById('edit-stock').value = p.stock || '';
            document.getElementById('edit-comments').value = p.comments || '';
            document.getElementById('del-btn').style.display = "block";
        } else {
            document.getElementById('modal-title').innerText = "Add New Product";
            document.getElementById('edit-cat').value = '';
            document.getElementById('edit-name').value = '';
            document.getElementById('edit-offer').value = '';
            document.getElementById('edit-price').value = '£0.00';
            document.getElementById('edit-stock').value = '';
            document.getElementById('edit-comments').value = '';
            document.getElementById('del-btn').style.display = "none";
        }
        modal.style.display = "flex";
    },

    closeModal() { document.getElementById('edit-modal').style.display = "none"; },

    async saveProduct() {
        const payload = {
            category: document.getElementById('edit-cat').value,
            name: document.getElementById('edit-name').value,
            offer: document.getElementById('edit-offer').value,
            price: document.getElementById('edit-price').value,
            stock: document.getElementById('edit-stock').value,
            comments: document.getElementById('edit-comments').value
        };
        if (this.editingId) await sb.from('products').update(payload).eq('id', this.editingId);
        else await sb.from('products').insert([payload]);
        this.closeModal();
        this.init(); 
    },

    async deleteProduct() {
        if (confirm("Delete this plant permanently?")) {
            await sb.from('products').delete().eq('id', this.editingId);
            this.closeModal();
            this.init();
        }
    },

    handleSearch() {
        const q = document.getElementById('main-search').value.toLowerCase();
        if (!q) { this.renderHome(); return; }
        this.currentView = 'search';
        const res = this.data.filter(p => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)));
        this.renderList(res, false, `<h2 style="margin-top:0;">Search Results</h2>`);
        document.getElementById('az-rail').style.display = 'flex';
        this.renderSidebar();
    },

    renderAZ() {
        const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        document.getElementById('az-rail').innerHTML = alpha.map(l => `<div style="cursor:pointer;padding:2px;" onclick="app.scrollToLetter('${l}')">${l}</div>`).join("");
    },

    scrollToLetter(l) {
        const cards = document.getElementsByClassName('product-card');
        for (let c of cards) {
            if (c.querySelector('.prod-name').innerText.trim().toUpperCase().startsWith(l)) {
                c.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
            }
        }
    }
};

app.init();