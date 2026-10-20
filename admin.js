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

function getAdminPin() {
  const pin = sessionStorage.getItem('adminPin');
  if (!pin) {
    alert('Admin session expired. Please log in again.');
    window.location.href = 'index.html';
    return null;
  }
  return pin;
}

    processCategories() {
        this.categories = [...new Set(this.data.map(p => p.category))].sort();
    },

    refreshUI() {
        this.renderSidebar();
        if (this.currentView === 'all') this.renderAll();
        else if (this.currentView === 'search') this.handleSearch();
        else this.renderCategory(this.currentView);
    },

    addTagField(value = '') {
        const container = document.getElementById('tags-container');
        if (!container) return;
        
        const row = document.createElement('div');
        row.className = 'tag-input-row';
        row.style.display = 'flex';
        row.style.gap = '8px';
        
        row.innerHTML = `
            <input type="text" class="edit-tag-item" value="${value.trim()}" placeholder="e.g. Petunia" style="flex:1; padding:10px; border:1px solid #ccc; border-radius:5px;">
            <button type="button" onclick="this.parentElement.remove()" style="padding: 10px; border: 1px solid #d32f2f; background: #ffebee; color: #d32f2f; border-radius: 5px; font-weight: bold; cursor: pointer;">✕</button>
        `;
        container.appendChild(row);
    },

    getTagsFromUI() {
        const inputs = document.querySelectorAll('.edit-tag-item');
        const tagsArray = [];
        inputs.forEach(input => {
            if (input.value.trim() !== '') {
                tagsArray.push(input.value.trim());
            }
        });
        return tagsArray.join(', ');
    },

    renderSidebar() {
        const nav = document.getElementById('sidebar-nav');
        
        // 1. Navigation Back (Top)
        let html = `
            <button class="nav-btn" onclick="window.location.href='index.html'" 
                    style="margin-bottom: 20px; background: #444; color: #fff; width: 100%;">
                ← BACK TO SHOP
            </button>`;

        // 2. Action Buttons (Grouped together)
        html += `
            <button class="nav-btn" onclick="app.openModal(null)" style="border-left: 1px solid var(--border-color) !important;">
                + NEW PRODUCT
            </button>

            <button class="nav-btn" onclick="app.addNewCategory()" style="border-left: 1px solid var(--border-color) !important; margin-bottom: 20px;">
                + NEW CATEGORY
            </button>`;

        // 3. View All Button
        html += `<button class="nav-btn ${this.currentView === 'all' ? 'active' : ''}" onclick="app.renderAll()" style="margin-bottom: 10px;">VIEW ALL STOCK</button>`;
        
        // 4. Category List Container
        html += `<div class="sidebar-nav-links">`;

        this.categories.forEach(cat => {
            const catClass = `cat-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
            const isActive = this.currentView === cat ? 'active' : '';
            
            html += `
                <button class="nav-btn ${catClass} ${isActive}" onclick="app.renderCategory('${cat}')">
                    ${cat.toUpperCase()}
                </button>`;
        });
        
        html += `</div>`;
        nav.innerHTML = html;
    },

    addNewCategory() {
        const newCat = prompt("Enter the name for the new category:");
        if (newCat && newCat.trim() !== "") {
            const formattedCat = newCat.trim();
            this.openModal(null);
            
            const catSelect = document.getElementById('edit-cat');
            const option = document.createElement("option");
            option.value = formattedCat;
            option.text = formattedCat;
            catSelect.add(option);
            catSelect.value = formattedCat;
        }
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
            const bgClass = s.includes('out') ? 'card-out' : s.includes('low') ? 'card-low' : '';
            const catClass = `cat-${(p.category || "none").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;

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
        
        const catSelect = document.getElementById('edit-cat');
        catSelect.innerHTML = this.categories.map(c => `<option value="${c}">${c}</option>`).join('');

        // Clear previous dynamic tag fields
        const tagsContainer = document.getElementById('tags-container');
        if (tagsContainer) tagsContainer.innerHTML = '';

        if (id) {
            const p = this.data.find(x => x.id === id);
            document.getElementById('modal-title').innerText = "Edit Product";
            document.getElementById('edit-cat').value = p.category || '';
            document.getElementById('edit-name').value = p.name || '';
            document.getElementById('edit-offer').value = p.offer || '';
            document.getElementById('edit-price').value = p.price || '';
            document.getElementById('edit-comments').value = p.comments || '';
            document.getElementById('del-btn').style.display = "block";

            // Parse tags and populate fields if they exist
            if (p.tags && p.tags.trim() !== '') {
                const tagsList = p.tags.split(',');
                tagsList.forEach(t => this.addTagField(t));
            } else {
                this.addTagField('');
            }

            const stockSelect = document.getElementById('edit-stock');
            const dbValue = (p.stock || "").trim();
            
            let matched = false;
            for (let i = 0; i < stockSelect.options.length; i++) {
                if (stockSelect.options[i].value.toLowerCase() === dbValue.toLowerCase()) {
                    stockSelect.selectedIndex = i;
                    matched = true;
                    break;
                }
            }
            if (!matched) stockSelect.selectedIndex = 0;

        } else {
            document.getElementById('modal-title').innerText = "Add New Product";
            document.getElementById('edit-cat').value = this.categories[0] || '';
            document.getElementById('edit-name').value = '';
            document.getElementById('edit-offer').value = '';
            document.getElementById('edit-price').value = '£';
            document.getElementById('edit-stock').value = ''; 
            document.getElementById('edit-comments').value = '';
            document.getElementById('del-btn').style.display = "none";
            
            this.addTagField('');
        }
        modal.style.display = "flex";
    },

    closeModal() { document.getElementById('edit-modal').style.display = "none"; },

async saveProduct() {
  const pin = getAdminPin();
  if (!pin) return;

  const payload = {
    category: document.getElementById('edit-cat').value,
    name: document.getElementById('edit-name').value,
    offer: document.getElementById('edit-offer').value,
    price: document.getElementById('edit-price').value,
    stock: document.getElementById('edit-stock').value,
    comments: document.getElementById('edit-comments').value,
    tags: this.getTagsFromUI(),
  };

  const action = this.editingId ? 'update' : 'create';

  const res = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': pin,
    },
    body: JSON.stringify({
      action,
      id: this.editingId,
      product: payload,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert('Error saving: ' + (err.message || res.statusText));
  } else {
    this.closeModal();
    await this.init();
  }
},

async deleteProduct() {
  if (!confirm('Permanently delete this item?')) return;

  const pin = getAdminPin();
  if (!pin) return;

  const res = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': pin,
    },
    body: JSON.stringify({
      action: 'delete',
      id: this.editingId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert('Error deleting: ' + (err.message || res.statusText));
  } else {
    this.closeModal();
    await this.init();
  }
},

app.init();