const SUPABASE_URL = 'https://xnjsvclilulxxnuvyfla.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuanN2Y2xpbHVseHhudXZ5ZmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTM0NjYsImV4cCI6MjA5MTQ2OTQ2Nn0.jJheSQImSYPRaALGyuUNU5bkUl2D7SihcolMdk7dBDI';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const app = {
    data: [],
    categories: [],
    currentView: 'home',

    async init() {
        // 1. Instant load from local cache
        const cache = localStorage.getItem('nursery_data');
        if (cache) {
            this.data = JSON.parse(cache);
            this.processCategories();
            this.renderSidebar();
            this.renderHome();
        }

        // 2. Fetch fresh data from Supabase
        try {
            const { data, error } = await sb.from('products').select('*');
            if (!error && data) {
                this.data = data;
                localStorage.setItem('nursery_data', JSON.stringify(data));
                this.processCategories();
                this.renderSidebar();
                // Update the current view if user is already looking at a category
                if (this.currentView === 'home') this.renderHome();
                else if (this.currentView === 'search') this.handleSearch();
                else this.renderCategory(this.currentView);
            }
        } catch (e) { console.error("Database error", e); }
        
        this.renderAZ();
    },

    processCategories() {
        this.categories = [...new Set(this.data.map(p => p.category))].sort();
    },

    renderSidebar() {
        const nav = document.getElementById('sidebar-nav');
        let html = `<button class="nav-btn ${this.currentView === 'home' ? 'active' : ''}" onclick="app.renderHome()">HOME</button>`;
        this.categories.forEach(cat => {
            html += `<button class="nav-btn ${this.currentView === cat ? 'active' : ''}" onclick="app.renderCategory('${cat}')">${cat}</button>`;
        });
        nav.innerHTML = html;
    },

    renderHome() {
        this.currentView = 'home';
        document.getElementById('az-rail').style.display = 'none';
        document.getElementById('main-content').innerHTML = `
            <div class="home-view">
                <img src="logo.png" alt="Logo">
                <h2 style="color:#2e7d32">Price List 2026</h2>
                <p style="color:#888; font-weight:bold;">v13.0 | Always Connected</p>
            </div>
        `;
        this.renderSidebar();
    },

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
                    <div class="prod-price">${p.price}</div>
                </div>`;
        });
        container.innerHTML = html + '</div>';
        container.scrollTop = 0;
    },

    handleSearch() {
        const q = document.getElementById('main-search').value.toLowerCase();
        if (!q) { this.renderHome(); return; }
        this.currentView = 'search';
        const results = this.data.filter(p => 
            p.name.toLowerCase().includes(q) || (p.tags && p.tags.toLowerCase().includes(q))
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
            if (card.querySelector('.prod-name').innerText.trim().toUpperCase().startsWith(l)) {
                card.scrollIntoView({ behavior: 'smooth' });
                break;
            }
        }
    }
};

app.init();