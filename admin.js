const SUPABASE_URL = 'https://xnjsvclilulxxnuvyfla.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuanN2Y2xpbHVseHhudXZ5ZmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTM0NjYsImV4cCI6MjA5MTQ2OTQ2Nn0.jJheSQImSYPRaALGyuUNU5bkUl2D7SihcolMdk7dBDI';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const app = {
    data: [],
    categories: [],
    currentView: 'all',
    editingId: null,

    async init() {
        const { data, error } = await sb.from('products').select('*');
        if (!error && data) {
            this.data = data;
            this.processCategories();
            this.refreshUI();
        }
    },

    processCategories() {
        this.categories = [...new Set(this.data.map(p => p.category))].sort();
    },

    refreshUI() {
        this.renderSidebar();
        if (this.currentView === 'all') this.renderAll();
        else if (this.currentView === 'search') this.handleSearch();
        else this.renderCategory(this.currentView);
    },

renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    
    // START with the Back to Shop button
    let html = `
        <button class="nav-btn" onclick="window.location.href='index.html'" 
                style="margin-bottom: 20px; background: #444; color: #fff; width: 100%;">
            ← BACK TO SHOP
        </button>`;

    // Add the "View All" and "Add New" buttons
    html += `<button class="nav-btn ${this.currentView === 'all' ? 'active' : ''}" onclick="app.renderAll()">VIEW ALL</button>`;
    html += `<button class="nav-btn" onclick="app.openModal(null)" style="border: 2px dashed var(--nursery-green); margin-bottom: 10px;">+ ADD NEW</button>`;
    
    // Add the categories with their color classes
    this.categories.forEach(cat => {
        // Create CSS-friendly class name (same as index.html)
        const catClass = `cat-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
        const isActive = this.currentView === cat ? 'active' : '';
        
        html += `<button class="nav-btn ${catClass} ${isActive}" onclick="app.renderCategory('${cat}')">
                    ${cat.toUpperCase()}
                 </button>`;
    });
    
    nav.innerHTML = html;
},

    renderAll() {
        this.currentView = 'all';
        const sorted = [...this.data].sort((a,b) => (a.category||"").localeCompare(b.category||"") || a.name.localeCompare(b.name));
        this.renderList(sorted);
        this.renderSidebar();
    },

    renderCategory(cat) {
        this.currentView = cat;
        const filtered = this.data.filter(p => p.category === cat).sort((a,b) => a.name.localeCompare(b.name));
        this.renderList(filtered);
        this.renderSidebar();
    },

renderList(products) {
    const container = document.getElementById('main-content');
    let html = '<div class="product-list">';
    
    products.forEach(p => {
        const s = (p.stock || "").toLowerCase();
        // Applies the red/orange backgrounds for stock levels
        const bgClass = s.includes('out') ? 'card-out' : s.includes('low') ? 'card-low' : '';
        
        // Category class for border colors
        const catClass = `cat-${(p.category || "none")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')}`;

        html += `
            <div class="product-card ${bgClass} ${catClass}" onclick="app.openModal(${p.id})" style="cursor:pointer;">
                <div style="width: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        
                        <div class="prod-name" style="padding-right: 20px;">${p.name}</div>
                        
                        <div style="display: flex; align-items: center; gap: 20px; flex-shrink: 0;">
                            ${p.offer ? `<span style="color: #e65100; font-weight: 700; font-size: 16px; white-space: nowrap;">${p.offer}</span>` : ''}
                            <div class="prod-price">${p.price}</div>
                        </div>
                    </div>

                    <div class="status-line" style="margin-top: 10px;">
                        ${p.stock ? `<span class="stock-label">${p.stock}</span>` : ''}
                        ${p.comments ? `<span class="comment-label">${p.comments}</span>` : ''}
                    </div>
                </div>
            </div>`;
    });
    container.innerHTML = html + '</div>';
    container.scrollTop = 0;
},

    openModal(id) {
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
            document.getElementById('modal-title').innerText = "Add New Plant";
            document.getElementById('edit-cat').value = '';
            document.getElementById('edit-name').value = '';
            document.getElementById('edit-offer').value = '';
            document.getElementById('edit-price').value = '£';
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

        if (this.editingId) {
            await sb.from('products').update(payload).eq('id', this.editingId);
        } else {
            await sb.from('products').insert([payload]);
        }
        this.closeModal();
        this.init(); // Refresh data
    },

    async deleteProduct() {
        if (confirm("Permanently delete this item?")) {
            await sb.from('products').delete().eq('id', this.editingId);
            this.closeModal();
            this.init();
        }
    },

    handleSearch() {
        const q = document.getElementById('main-search').value.toLowerCase();
        if (!q) { this.renderAll(); return; }
        this.currentView = 'search';
        const res = this.data.filter(p => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)));
        this.renderList(res);
    }
};

app.init();