const menuData = [
  { id: 1, category: 'Entradas', name: 'Bruschetta Tradicional', desc: 'Pão italiano tostado, tomate confit, manjericão e azeite trufado.', price: 28.9, img: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=800&q=80' },
  { id: 2, category: 'Entradas', name: 'Batata Rústica', desc: 'Batatas temperadas com páprica e alecrim, acompanha maionese da casa.', price: 24.9, img: 'https://images.unsplash.com/photo-1544025162-831514bc5c4a?auto=format&fit=crop&w=800&q=80' },
  { id: 3, category: 'Principais', name: 'Smash Burguer Duplo', desc: 'Pão brioche, 2 blends de 90g, queijo cheddar, bacon e molho especial.', price: 38.9, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { id: 4, category: 'Principais', name: 'Massa Trufada', desc: 'Fettuccine artesanal ao molho branco com azeite de trufas e cogumelos frescos.', price: 54.9, img: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80' },
  { id: 5, category: 'Bebidas', name: 'Suco Natural de Laranja', desc: 'Feito na hora, 400ml.', price: 12.0, img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80' },
  { id: 6, category: 'Bebidas', name: 'Cerveja IPA Artesanal', desc: 'Cerveja local, notas cítricas, 500ml.', price: 22.0, img: 'https://images.unsplash.com/photo-1575037614876-c38db5190b2b?auto=format&fit=crop&w=800&q=80' },
  { id: 7, category: 'Principais', name: 'Salada Caesar', desc: 'Alface romana, parmesão, croutons, frango grelhado e molho caesar.', price: 33.5, img: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80' },
  { id: 8, category: 'Entradas', name: 'Mini Ceviche', desc: 'Peixe marinado em limão, cebola roxa, pimenta e coentro.', price: 31.5, img: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80' },
  { id: 9, category: 'Bebidas', name: 'Refrigerante Zero', desc: 'Lata 350ml, vários sabores.', price: 9.5, img: 'https://images.unsplash.com/photo-1622483767028-3f66f2b7420a?auto=format&fit=crop&w=800&q=80' }
];

const STORAGE_KEYS = {
  cart: 'mesabyte-cart',
  orders: 'mesabyte-orders',
  table: 'mesabyte-table'
};

let cart = loadFromStorage(STORAGE_KEYS.cart, []);
let orders = loadFromStorage(STORAGE_KEYS.orders, []);
let currentCategory = 'Todos';
let currentSearch = '';
let currentTable = loadFromStorage(STORAGE_KEYS.table, null);

let scanTimeout;
let feedbackTimeout;

const elements = {
  home: document.getElementById('view-home'),
  menu: document.getElementById('view-menu'),
  cart: document.getElementById('view-cart'),
  orders: document.getElementById('view-orders'),
  headerTable: document.getElementById('header-table-info'),
  featured: document.getElementById('featured-items'),
  menuContainer: document.getElementById('menu-container'),
  cartEmpty: document.getElementById('cart-empty'),
  cartContent: document.getElementById('cart-content'),
  cartItems: document.getElementById('cart-items-container'),
  cartSubtotal: document.getElementById('cart-subtotal'),
  cartTax: document.getElementById('cart-tax'),
  cartTotal: document.getElementById('cart-total'),
  badge: document.getElementById('cart-badge'),
  ordersList: document.getElementById('orders-list'),
  noOrders: document.getElementById('no-orders'),
  searchInput: document.getElementById('search-input'),
  modal: document.getElementById('scanner-modal'),
  feedback: document.getElementById('scan-feedback')
};

function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    return fallback;
  }
}

function persistStorage() {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
  if (currentTable) {
    localStorage.setItem(STORAGE_KEYS.table, JSON.stringify(currentTable));
  } else {
    localStorage.removeItem(STORAGE_KEYS.table);
  }
}

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function syncTableHeader() {
  if (!currentTable) {
    elements.headerTable.textContent = 'Mesa não identificada';
    elements.headerTable.classList.remove('active-table');
    return;
  }

  elements.headerTable.textContent = `Mesa ${String(currentTable).padStart(2, '0')}`;
  elements.headerTable.classList.add('active-table');
}

function switchTab(targetId) {
  document.querySelectorAll('.view-section').forEach((section) => {
    section.classList.remove('active');
  });

  const nextView = document.getElementById(`view-${targetId}`);
  if (nextView) {
    nextView.classList.add('active');
  }

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.target === targetId);
  });
}

function renderFeatured() {
  const featured = menuData.slice(0, 4);
  elements.featured.innerHTML = featured.map((item) => `
    <article class="feature-card" onclick="addToCart(${item.id})" aria-label="Adicionar ${item.name} ao pedido">
      <div class="thumb" style="background-image: url('${item.img}')"></div>
      <div class="body">
        <h4>${item.name}</h4>
        <div class="price">${formatCurrency(item.price)}</div>
      </div>
    </article>
  `).join('');
}

function renderMenu() {
  const filtered = menuData.filter((item) => {
    const matchesCategory = currentCategory === 'Todos' || item.category === currentCategory;
    const searchText = currentSearch.trim().toLowerCase();
    const matchesSearch = !searchText || item.name.toLowerCase().includes(searchText) || item.desc.toLowerCase().includes(searchText);
    return matchesCategory && matchesSearch;
  });

  if (!filtered.length) {
    elements.menuContainer.innerHTML = `
      <div class="empty-state">
        <i class="ph ph-magnifying-glass"></i>
        <h3>Nenhum item encontrado</h3>
        <p>Tente outra pesquisa ou selecione outra categoria.</p>
      </div>
    `;
    return;
  }

  elements.menuContainer.innerHTML = filtered.map((item) => `
    <article class="menu-item">
      <div class="menu-thumb" style="background-image: url('${item.img}')"></div>

      <div class="menu-body">
        <h4>${item.name}</h4>
        <p>${item.desc}</p>

        <div class="menu-meta">
          <span class="price-tag">${formatCurrency(item.price)}</span>
          <button class="add-btn" type="button" aria-label="Adicionar ${item.name}" onclick="addToCart(${item.id})">
            <i class="ph ph-plus"></i>
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

function addToCart(itemId) {
  const item = menuData.find((entry) => entry.id === itemId);
  if (!item) return;

  const existing = cart.find((entry) => entry.id === itemId);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  persistStorage();
  updateCartUI();
}

function changeQty(itemId, delta) {
  const item = cart.find((entry) => entry.id === itemId);
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    cart = cart.filter((entry) => entry.id !== itemId);
  }

  persistStorage();
  updateCartUI();
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  elements.badge.textContent = totalItems;
  elements.badge.classList.toggle('hidden', totalItems === 0);

  if (!cart.length) {
    elements.cartEmpty.classList.remove('hidden');
    elements.cartContent.classList.add('hidden');
    return;
  }

  elements.cartEmpty.classList.add('hidden');
  elements.cartContent.classList.remove('hidden');

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  elements.cartItems.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div class="thumb" style="background-image: url('${item.img}')"></div>

      <div class="details">
        <h4>${item.name}</h4>
        <span class="unit-price">${formatCurrency(item.price)} cada</span>
      </div>

      <div class="qty-group">
        <button class="qty-btn" type="button" onclick="changeQty(${item.id}, -1)" aria-label="Diminuir quantidade de ${item.name}">
          <i class="ph ph-minus"></i>
        </button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn" type="button" onclick="changeQty(${item.id}, 1)" aria-label="Aumentar quantidade de ${item.name}">
          <i class="ph ph-plus"></i>
        </button>
      </div>
    </div>
  `).join('');

  elements.cartSubtotal.textContent = formatCurrency(subtotal);
  elements.cartTax.textContent = formatCurrency(tax);
  elements.cartTotal.textContent = formatCurrency(total);
}

function renderOrders() {
  if (!orders.length) {
    elements.noOrders.classList.remove('hidden');
    elements.ordersList.classList.add('hidden');
    return;
  }

  elements.noOrders.classList.add('hidden');
  elements.ordersList.classList.remove('hidden');

  elements.ordersList.innerHTML = orders.map((order) => `
    <article class="order-card">
      <div class="order-top">
        <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
        <span class="order-id">#${order.id}</span>
      </div>

      <p class="order-summary">${order.summary}</p>

      <div class="order-bottom">
        <div class="order-meta">
          <div>Mesa ${String(order.table).padStart(2, '0')}</div>
          <div>${order.time}</div>
        </div>
        <div class="order-total">${formatCurrency(order.total)}</div>
      </div>
    </article>
  `).join('');
}

function placeOrder() {
  if (!cart.length) return;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = subtotal * 1.1;
  const tableNumber = currentTable || 4;

  const itemSummary = cart.map((item) => `${item.qty}x ${item.name}`).join(', ');

  const newOrder = {
    id: Math.floor(Math.random() * 9000) + 1000,
    table: tableNumber,
    summary: itemSummary,
    total: total,
    status: 'Preparando',
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };

  orders.unshift(newOrder);
  cart = [];
  persistStorage();
  updateCartUI();
  renderOrders();
  switchTab('orders');
}

function openScanner() {
  elements.modal.classList.add('visible');
  elements.feedback.classList.remove('visible');

  clearTimeout(scanTimeout);
  clearTimeout(feedbackTimeout);

  scanTimeout = setTimeout(() => {
    elements.feedback.classList.add('visible');

    feedbackTimeout = setTimeout(() => {
      closeScanner();
      identifyTable(4);
    }, 1400);
  }, 2200);
}

function closeScanner() {
  elements.modal.classList.remove('visible');
  clearTimeout(scanTimeout);
  clearTimeout(feedbackTimeout);
}

function identifyTable(tableNumber) {
  currentTable = tableNumber;
  persistStorage();
  syncTableHeader();
  switchTab('menu');
}

function bindCategoryButtons() {
  document.querySelectorAll('.category-pill').forEach((button) => {
    button.addEventListener('click', () => {
      currentCategory = button.dataset.category;
      document.querySelectorAll('.category-pill').forEach((btn) => btn.classList.toggle('active', btn === button));
      renderMenu();
    });
  });
}

function bindSearch() {
  elements.searchInput.addEventListener('input', (event) => {
    currentSearch = event.target.value;
    renderMenu();
  });
}

function initialize() {
  bindCategoryButtons();
  bindSearch();
  syncTableHeader();
  renderFeatured();
  renderMenu();
  updateCartUI();
  renderOrders();
}

initialize();

window.addEventListener('load', () => {
  if (currentTable) {
    switchTab('menu');
  }
});

window.addEventListener('beforeunload', () => {
  clearTimeout(scanTimeout);
  clearTimeout(feedbackTimeout);
});



































































