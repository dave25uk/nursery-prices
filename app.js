const SUPABASE_URL = 'https://xnjsvclilulxxnuvyfla.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuanN2Y2xpbHVseHhudXZ5ZmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTM0NjYsImV4cCI6MjA5MTQ2OTQ2Nn0.jJheSQImSYPRaALGyuUNU5bkUl2D7SihcolMdk7dBDI';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const app = {
    data: [],
    categories: [],
    currentView: 'home',
    lastUpdated: '',

    // Fix for Fire Tablet viewport issues
    lockScroll() {
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100vh';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    },

    unlockScroll() {
        document.body.style.overflow = '';
        document.body.style.height = '';
        document.body.style.position = '';
        document.body.style.width = '';
        window.scrollTo(0, 0);
    },

    openManagement() {
        const modal = document.getElementById('pin-modal');
        const field = document.getElementById('pin-field');
        field.value = '';
        modal.style.display = 'flex';
        this.lockScroll(); // Lock the screen to prevent background squash
        field.focus();
    },

    verifyPin() {
        const pin = document.getElementById('pin-field').value;
        if (pin === "123456") {
            this.unlockScroll(); // Reset screen before navigating
            window.location.href = "management.html";
        } else {
            alert("Incorrect PIN.");
            document.getElementById('pin-field').value = '';
        }
    },

    async init() {
        const cache = localStorage.getItem('nursery_data');
        if (cache) {
            this.data = JSON.parse(cache);
            this.lastUpdated = localStorage.getItem('last_updated_time') || '';
            this.processCategories();
            this.renderSidebar();
            this.renderHome();
        }

        try {
            const { data, error } = await sb.from('products').select('*');
            if (!error && data) {
                this.data = data;

                const validDates = data
                    .map(p => p.updated_at)
                    .filter(d => d != null)
                    .map(d => new Date(d));

                if (validDates.length > 0) {
                    const latestUpdate = new Date(Math.max(...validDates));
                    this.lastUpdated = latestUpdate.toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    });
                } else {
                    this.lastUpdated = 'Pending first update...';
                }

                localStorage.setItem('nursery_data', JSON.stringify(data));
                localStorage.setItem('last_updated_time', this.lastUpdated);
                
                this.processCategories();
                this.renderSidebar();
                
                if (this.currentView === 'home') this.renderHome();
                else if (this.currentView === 'search') this.handleSearch();
                else this.renderCategory(this.currentView);
            }
        } catch (e) { 
            console.error("Database error", e); 
        }
        
        this.renderAZ();
    },

    processCategories() {
        this.categories = [...new Set(this.data.map(p => p.category))].sort();
    },

    renderSidebar() {
        const nav = document.getElementById('sidebar-nav');
        let html = `<button class="nav-btn home-btn ${this.currentView === 'home' ? 'active' : ''}" 
                    onclick="app.renderHome()">HOME</button>`;
        
        this.categories.forEach(cat => {
            const catClass = `cat-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
            const isActive = this.currentView === cat ? 'active' : '';
            html += `<button class="nav-btn ${catClass} ${isActive}" 
                     onclick="app.renderCategory('${cat}')">${cat.toUpperCase()}</button>`;
        });
        
        nav.innerHTML = html;
    },

    renderHome() {
        this.currentView = 'home';
        document.getElementById('az-rail').style.display = 'none';
        
        // Force reset the viewport height in case the tablet is still "squashed"
        this.unlockScroll();

        const updateText = this.lastUpdated ? `Last updated: ${this.lastUpdated}` : '';

        document.getElementById('main-content').innerHTML = `
            <div class="home-view">
                <img src="logo.png" alt="Logo">
                <h2 style="color: var(--nursery-green); margin-top: 20px;">Price List 2026</h2>
                <p style="color: #888; font-size: 14px; font-weight: 600; margin-top: 10px;">
                    ${updateText}
                </p>
            </div>
        `;
        this.renderSidebar();
    },

    renderCategory(cat) {
        this.currentView = cat;
        const filtered = this.data.filter(p => p.category === cat).sort((a,b) => a.name.localeCompare(b.name));
        this.renderList(filtered);
        this.renderAZ(filtered); 
        document.getElementById('az-rail').style.display = 'flex';
        this.renderSidebar();
    },

    renderList(products) {
        const container = document.getElementById('main-content');
        let html = '<div class="product-list">';
        
        products.forEach(p => {
            const s = (p.stock || "").toLowerCase();
            const bgClass = s.includes('out') ? 'card-out' : s.includes('low') ? 'card-low' : '';
            const catClass = `cat-${(p.category || "none").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;

            html += `
                <div class="product-card ${bgClass} ${catClass}">
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

    handleSearch() {
        const q = document.getElementById('main-search').value.toLowerCase();
        if (!q) { this.renderHome(); return; }
        this.currentView = 'search';
        const results = this.data.filter(p => 
            p.name.toLowerCase().includes(q) || (p.tags && p.tags.toLowerCase().includes(q))
        ).sort((a,b) => a.name.localeCompare(b.name));
        this.renderList(results);
        this.renderAZ(results); 
        document.getElementById('az-rail').style.display = 'flex';
        this.renderSidebar();
    },

    renderAZ(products) {
        const rail = document.getElementById('az-rail');
        if (!rail) return;
        const listToScan = products || this.data;
        const activeLetters = new Set(
            listToScan
                .filter(p => p.name) 
                .map(p => p.name.trim().charAt(0).toUpperCase())
        );
        const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        rail.innerHTML = alpha.map(l => {
            const hasItems = activeLetters.has(l);
            if (hasItems) {
                return `<div style="cursor:pointer; padding:2px; color:var(--nursery-green);" 
                             onclick="app.scrollToLetter('${l}')">${l}</div>`;
            } else {
                return `<div style="padding:2px; color:#ccc; cursor:default; pointer-events:none;">${l}</div>`;
            }
        }).join("");
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