// admin.js - Unified HotMealBa admin gateway

import { store, escapeHtml, sanitizeText } from '../store.js';
import { dataLoader } from '../data-loader.js';
import { renderOrderTable, renderPagination } from '../components/table.js';
import { renderRevenueChart } from '../components/charts.js';

const S = escapeHtml;
const RM = (value) => `RM ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusLabels = {
  received: 'Received',
  preparing: 'Payment confirmed',
  cooking: 'Packing',
  out_for_delivery: 'Out for shipment',
  delivered: 'Delivered'
};

const MENU_CATEGORIES = [
  'Dumpling Packs',
  'Sampler Boxes',
  'Party Trays',
  'Sauces',
  'Reseller Cases',
  'Add-ons'
];

let ordersFilters = {
  search: '',
  status: 'All',
  page: 1,
  limit: 12
};

let selectedMealId = '';

function statusCounts() {
  return Object.keys(statusLabels).map((status) => ({
    status,
    label: statusLabels[status],
    count: store.state.orders.filter((order) => order.status === status).length
  }));
}

function renderAdminTabs(activeView) {
  const tabs = [
    ['admin-dash', 'Dashboard'],
    ['admin-orders', 'Orders']
  ];
  return `
    <div class="flex flex-wrap gap-2 rounded-lg border border-background-dark bg-background-card p-2 shadow-premium">
      ${tabs.map(([route, label]) => `
        <button onclick="window.app.switchView('${route}')" class="min-h-10 rounded-lg px-4 text-sm font-bold transition-all ${activeView === route ? 'bg-accent text-white shadow-accent-glow' : 'bg-background text-secondary hover:text-primary border border-background-dark'}">${label}</button>
      `).join('')}
      <button onclick="window.app.logoutAdmin()" class="ml-auto min-h-10 rounded-lg border border-background-dark bg-background px-4 text-sm font-bold text-secondary hover:text-primary">Lock</button>
    </div>
  `;
}

function emptyOrdersNotice() {
  return `
    <div class="rounded-lg border border-background-dark bg-background p-6 text-sm text-secondary">
      No actual orders are saved yet. Customer orders created from checkout will appear here.
    </div>
  `;
}

function renderMenuManager() {
  const selected = selectedMealId === '__new__'
    ? {}
    : store.state.meals.find((meal) => meal.mealId === selectedMealId) || store.state.meals[0] || {};
  const currentCategory = MENU_CATEGORIES.includes(selected.category) ? selected.category : (selected.category || 'Dumpling Packs');
  const currentImage = selected.image || '/assets/images/dumplings-plate.png';
  return `
    <section class="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
      <form onsubmit="event.preventDefault(); window.app.adminSaveMeal(new FormData(this))" class="rounded-lg border border-background-dark bg-background-card p-5 shadow-premium space-y-4">
        <div>
          <span class="text-xs font-bold uppercase text-accent">Menu editor</span>
          <h2 class="font-display text-3xl text-primary">Edit Menu item</h2>
        </div>
        <input type="hidden" name="mealId" value="${S(selected.mealId || '')}" />
        <label class="block text-xs font-bold text-secondary">Name<input name="mealName" required value="${S(selected.mealName || '')}" class="form-input-premium mt-1 text-sm" /></label>
        <div class="block text-xs font-bold text-secondary">
          <span>Category</span>
          <input id="adminMealCategory" type="hidden" name="category" required value="${S(currentCategory)}" />
          <button type="button" onclick="window.app.adminOpenCategoryPicker()" class="form-input-premium mt-1 flex min-h-12 items-center justify-between text-left text-sm font-bold text-primary">
            <span id="adminMealCategoryLabel">${S(currentCategory)}</span>
            <svg class="h-4 w-4 text-secondary" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15.75L12 19.5l3.75-3.75m-7.5-7.5L12 4.5l3.75 3.75"/></svg>
          </button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label class="block text-xs font-bold text-secondary">Price<input type="number" step="0.01" min="0" name="price" required value="${Number(selected.price || 0)}" class="form-input-premium mt-1 text-sm" /></label>
          <label class="block text-xs font-bold text-secondary">Rating<input type="number" step="0.1" min="1" max="5" name="rating" value="${Number(selected.rating || 4.8)}" class="form-input-premium mt-1 text-sm" /></label>
        </div>
        <div class="block text-xs font-bold text-secondary">
          <span>Menu image</span>
          <input id="adminMealImage" type="hidden" name="image" value="${S(currentImage)}" />
          <div class="mt-1 rounded-lg border border-background-dark bg-background p-3">
            <img id="adminMealImagePreview" src="${S(currentImage)}" alt="Selected Menu item" class="h-36 w-full rounded-lg border border-background-dark bg-background-card object-cover" />
            <div class="mt-3 flex flex-wrap gap-2">
              <label class="button-accent min-h-10 cursor-pointer px-4 py-2">
                Upload image
                <input type="file" accept="image/*" onchange="window.app.adminPickMealImage(this)" class="sr-only" />
              </label>
              <button type="button" onclick="window.app.adminSetMealImage('/assets/images/dumplings-plate.png')" class="button-ghost min-h-10 px-4 py-2">Use sample</button>
            </div>
            <p class="mt-2 text-[11px] font-normal text-secondary">PNG, JPG, WebP, or GIF under 1.5 MB.</p>
          </div>
        </div>
        <label class="block text-xs font-bold text-secondary">Pack size<input name="packSize" value="${S(selected.packSize || '12 pcs')}" class="form-input-premium mt-1 text-sm" /></label>
        <label class="block text-xs font-bold text-secondary">Description<textarea name="description" rows="3" class="form-input-premium mt-1 text-sm">${S(selected.description || '')}</textarea></label>
        <label class="block text-xs font-bold text-secondary">Ingredients<textarea name="ingredients" rows="2" class="form-input-premium mt-1 text-sm">${S((selected.ingredients || []).join(', '))}</textarea></label>
        <button type="submit" class="button-accent w-full min-h-11">Save Menu item</button>
        <div id="admin-category-dialog" class="hidden fixed inset-0 z-[70] items-center justify-center bg-charcoal/45 px-4 backdrop-blur-sm">
          <button type="button" aria-label="Close category picker" onclick="window.app.adminCloseCategoryPicker()" class="absolute inset-0 cursor-default"></button>
          <div class="clean-dialog relative w-full max-w-sm p-4">
            <div class="mb-3 flex items-center justify-between gap-3">
              <h3 class="font-display text-2xl text-primary">Choose category</h3>
              <button type="button" onclick="window.app.adminCloseCategoryPicker()" class="icon-button h-9 w-9" aria-label="Close">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="space-y-2">
              ${MENU_CATEGORIES.map((category) => `
                <button type="button" onclick="window.app.adminChooseCategory('${S(category)}')" class="w-full min-h-11 rounded-lg border border-background-dark bg-background px-4 text-left text-sm font-bold text-primary transition-all hover:border-accent/40 hover:bg-background-card">
                  ${S(category)}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </form>
      <div class="rounded-lg border border-background-dark bg-background-card p-5 shadow-premium">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="font-display text-3xl text-primary">Menu library</h2>
            <p class="text-xs text-secondary">${store.state.meals.length} items · edit or delete any item.</p>
          </div>
          <button onclick="window.app.adminNewMeal()" class="button-ghost min-h-10 px-4 py-2">New item</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1" data-native-scroll>
          ${store.state.meals.map((meal) => `
            <div class="rounded-lg border border-background-dark bg-background p-3 flex gap-3">
              <img src="${S(meal.image)}" alt="${S(meal.mealName)}" class="h-16 w-16 rounded-lg object-cover border border-background-dark flex-shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="font-display text-lg text-primary line-clamp-1">${S(meal.mealName)}</p>
                <p class="text-xs text-secondary">${S(meal.category)} · ${RM(meal.price)}</p>
                <div class="mt-2 flex items-center gap-3">
                  <button onclick="window.app.adminEditMeal('${meal.mealId}')" class="text-xs font-bold text-accent hover:underline">Edit</button>
                  <button onclick="window.app.adminDeleteMeal('${meal.mealId}')" class="text-xs font-bold text-danger hover:underline">Delete</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

export const adminViews = {
  renderLogin(container) {
    container.innerHTML = `
      <section class="animate-fade-scroll max-w-md mx-auto clean-dialog p-6 md:p-8">
        <div class="text-center">
          <img src="/assets/images/hotmealba-logo.png" alt="HotMealBa logo" class="w-24 h-24 mx-auto rounded-2xl object-cover border border-background-dark shadow-premium" />
          <span class="text-xs font-bold uppercase text-accent mt-5 block">Protected admin gateway</span>
          <h1 class="font-display text-4xl text-primary mt-2">HotMealBa Admin</h1>
          <p class="text-sm text-secondary mt-2">Enter the set password to manage orders, tracking, and Menu items.</p>
        </div>
        <form onsubmit="event.preventDefault(); window.app.submitAdminPassword(new FormData(this))" class="mt-6 space-y-4">
          <label class="block text-xs font-bold text-secondary">Password<input type="password" name="password" required autocomplete="current-password" class="form-input-premium mt-1 text-sm min-h-12" /></label>
          <button type="submit" class="button-accent w-full min-h-12">Unlock gateway</button>
        </form>
      </section>
    `;
  },

  renderDashboard(container) {
    const metrics = dataLoader.getAdminMetrics();
    const counts = statusCounts();

    container.innerHTML = `
      <div class="space-y-6 animate-fade-scroll">
        ${renderAdminTabs('admin-dash')}
        <section class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium">
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
            <div>
              <span class="text-xs font-bold uppercase text-accent">Admin gateway</span>
              <h1 class="font-display text-4xl md:text-5xl text-primary mt-1">HotMealBa operations</h1>
              <p class="text-sm text-secondary mt-2 max-w-2xl">Actual saved orders, Menu editing, and manual location updates stay in one unified responsive gateway.</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div class="rounded-lg bg-background border border-background-dark px-3 py-2"><strong class="text-primary">${store.state.meals.length}</strong><span class="block text-secondary">Menu items</span></div>
              <div class="rounded-lg bg-background border border-background-dark px-3 py-2"><strong class="text-primary">${store.state.orders.length}</strong><span class="block text-secondary">actual orders</span></div>
              <div class="rounded-lg bg-background border border-background-dark px-3 py-2"><strong class="text-primary">${store.state.customers.length}</strong><span class="block text-secondary">users</span></div>
              <div class="rounded-lg bg-background border border-background-dark px-3 py-2"><strong class="text-primary">OSM</strong><span class="block text-secondary">tracking</span></div>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          ${[
            ['Revenue', RM(metrics.kpis.totalRevenue), 'Saved order totals'],
            ['Total orders', metrics.kpis.totalOrders, 'Actual checkout orders'],
            ['Active shipments', metrics.kpis.activeOrders, 'Not yet delivered'],
            ['Average rating', `${metrics.kpis.avgRating.toFixed(1)} / 5`, 'Customer feedback stream']
          ].map(([label, value, hint]) => `
            <div class="rounded-lg border border-background-dark bg-background-card p-5 shadow-premium">
              <span class="text-xs font-bold uppercase text-secondary">${label}</span>
              <strong class="font-display text-3xl text-primary block mt-2">${value}</strong>
              <span class="text-xs text-secondary mt-1 block">${hint}</span>
            </div>
          `).join('')}
        </section>

        <section class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <span class="text-xs font-bold uppercase text-accent">Storefront</span>
              <h2 class="font-display text-3xl text-primary">Order-open window</h2>
              <p class="text-sm text-secondary mt-1">Sets the "Orders open" status shown to customers on the home page.</p>
            </div>
            <form onsubmit="event.preventDefault(); window.app.adminSaveOrderWindow(new FormData(this))" class="flex flex-wrap items-end gap-3">
              <label class="text-xs font-bold text-secondary">Opens<input type="time" name="openTime" required value="${S(store.state.orderWindow.openTime)}" class="form-input-premium mt-1 text-sm min-h-11 w-36" /></label>
              <label class="text-xs font-bold text-secondary">Closes<input type="time" name="closeTime" required value="${S(store.state.orderWindow.closeTime)}" class="form-input-premium mt-1 text-sm min-h-11 w-36" /></label>
              <button type="submit" class="button-accent min-h-11">Save window</button>
            </form>
          </div>
        </section>

        ${renderMenuManager()}

        <section class="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
          <div class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <div>
                <h2 class="font-display text-3xl text-primary">Revenue timeline</h2>
                <p class="text-xs text-secondary">Seven-day saved sales volume</p>
              </div>
              <span class="text-xs font-bold text-accent">RM totals</span>
            </div>
            <div class="relative w-full h-72 md:h-80">
              <canvas id="revenueChartCanvas" class="w-full h-full"></canvas>
            </div>
          </div>

          <div class="rounded-lg border border-background-dark bg-background-card p-5 shadow-premium">
            <h2 class="font-display text-3xl text-primary">Shipment mix</h2>
            <div class="space-y-3 mt-5">
              ${counts.map((item) => {
                const pct = metrics.kpis.totalOrders ? Math.round((item.count / metrics.kpis.totalOrders) * 100) : 0;
                return `
                  <div>
                    <div class="flex justify-between text-xs mb-1">
                      <span class="font-bold text-primary">${item.label}</span>
                      <span class="text-secondary">${item.count} (${pct}%)</span>
                    </div>
                    <div class="h-2 rounded-full bg-background border border-background-dark overflow-hidden">
                      <div class="h-full bg-accent" style="width:${pct}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </section>
      </div>
    `;

    setTimeout(() => renderRevenueChart('revenueChartCanvas', metrics.revenueChart), 100);
  },

  renderOrders(container) {
    const results = dataLoader.queryOrders(ordersFilters);

    container.innerHTML = `
      <div class="space-y-5 animate-fade-scroll">
        ${renderAdminTabs('admin-orders')}
        <section class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium space-y-5">
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-background-dark pb-5">
            <div>
              <span class="text-xs font-bold uppercase text-accent">Order ledger</span>
              <h1 class="font-display text-4xl text-primary mt-1">Orders and manual updates</h1>
              <p class="text-sm text-secondary mt-2">Search, filter, update status, and set the current map point for actual saved orders.</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <div class="relative w-full xl:w-72">
                <input type="text" placeholder="Search orders or customers" value="${S(ordersFilters.search)}" oninput="window.app.adminOrdersSearch(this.value)" class="form-input-premium text-sm min-h-11 pl-10" />
                <svg class="w-4 h-4 text-secondary/50 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <select onchange="window.app.adminOrdersStatus(this.value)" class="form-input-premium text-sm min-h-11 sm:w-56">
                <option value="All" ${ordersFilters.status === 'All' ? 'selected' : ''}>All statuses</option>
                ${Object.entries(statusLabels).map(([status, label]) => `<option value="${status}" ${ordersFilters.status === status ? 'selected' : ''}>${label}</option>`).join('')}
              </select>
            </div>
          </div>
          ${results.items.length ? renderOrderTable(results.items) : emptyOrdersNotice()}
          ${renderPagination(results.page, results.totalPages, 'adminOrdersPage')}
        </section>
        <section class="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium">
            <h2 class="font-display text-3xl text-primary">Manual tracking location</h2>
            <p class="text-sm text-secondary mt-2">Paste a Google Maps <strong class="text-primary">plus code</strong> (short like <code class="text-accent">6PM7+QF</code> or full like <code class="text-accent">8FVC9G8F+6X</code>) or a Google Maps <strong class="text-primary">link</strong>. The pin updates on the customer tracking map.</p>
            <form onsubmit="event.preventDefault(); window.app.adminUpdateTracking(new FormData(this))" class="grid grid-cols-1 gap-3 mt-5">
              <select name="orderId" required class="form-input-premium text-sm min-h-12">
                ${store.state.orders.length ? store.state.orders.map((order) => `<option value="${S(order.orderId)}">${S(order.orderId)}</option>`).join('') : '<option value="">No saved orders</option>'}
              </select>
              <input name="location" required placeholder="Plus code or Google Maps link" class="form-input-premium text-sm min-h-12" />
              <button type="submit" class="button-accent min-h-12">Update map pin</button>
            </form>
          </div>

          <div class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium">
            <h2 class="font-display text-3xl text-primary">Order photo</h2>
            <p class="text-sm text-secondary mt-2">Attach a packing or proof photo to a saved order. It shows in the order ledger.</p>
            <form onsubmit="event.preventDefault(); window.app.adminUploadOrderPhoto(this)" class="grid grid-cols-1 gap-3 mt-5">
              <select name="orderId" required class="form-input-premium text-sm min-h-12">
                ${store.state.orders.length ? store.state.orders.map((order) => `<option value="${S(order.orderId)}">${S(order.orderId)}</option>`).join('') : '<option value="">No saved orders</option>'}
              </select>
              <input name="photo" type="file" accept="image/*" required class="form-input-premium text-sm min-h-12 file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-white file:font-bold" />
              <button type="submit" class="button-accent min-h-12">Upload photo</button>
            </form>
          </div>
        </section>
      </div>
    `;
  },

  adminOrdersSearch(query) {
    ordersFilters.search = sanitizeText(query, 80);
    ordersFilters.page = 1;
    this.refreshOrders();
  },

  adminOrdersStatus(status) {
    ordersFilters.status = status;
    ordersFilters.page = 1;
    this.refreshOrders();
  },

  adminOrdersPage(page) {
    ordersFilters.page = page;
    this.refreshOrders();
  },

  adminUpdateStatus(orderId, status) {
    store.updateOrderStatus(orderId, status);
    this.refreshOrders();
  },

  adminUpdateTracking(formData) {
    const orderId = formData.get('orderId');
    if (!orderId) { window.app.showFloatingAlert('No saved orders to update.', 'info'); return; }
    const ok = store.updateTrackingFromInput(orderId, formData.get('location'));
    window.app.showFloatingAlert(ok ? 'Map pin updated from location.' : 'Could not read a plus code or Maps link.', ok ? 'success' : 'info');
    this.refreshOrders();
  },

  adminUploadOrderPhoto(form) {
    const orderId = form.orderId.value;
    const file = form.photo.files && form.photo.files[0];
    if (!orderId) { window.app.showFloatingAlert('No saved orders to attach a photo to.', 'info'); return; }
    if (!file) { window.app.showFloatingAlert('Choose an image first.', 'info'); return; }
    if (!file.type.startsWith('image/') || file.size > 4 * 1024 * 1024) {
      window.app.showFloatingAlert('Use an image under 4 MB.', 'info');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      store.setOrderPhoto(orderId, reader.result);
      window.app.showFloatingAlert('Photo attached to order.', 'success');
      this.refreshOrders();
    };
    reader.readAsDataURL(file);
  },

  adminSaveOrderWindow(formData) {
    store.setOrderWindow(formData.get('openTime'), formData.get('closeTime'));
    window.app.showFloatingAlert('Order-open window updated.', 'success');
    const container = document.getElementById('view-container');
    if (container && store.state.activeView === 'admin-dash') this.renderDashboard(container);
  },

  adminDeleteMeal(mealId) {
    const meal = store.state.meals.find((m) => m.mealId === mealId);
    if (!window.confirm(`Delete "${meal ? meal.mealName : 'this item'}" from the menu?`)) return;
    store.deleteMeal(mealId);
    if (selectedMealId === mealId) selectedMealId = '';
    window.app.showFloatingAlert('Menu item deleted.', 'success');
    const container = document.getElementById('view-container');
    if (container && store.state.activeView === 'admin-dash') this.renderDashboard(container);
  },

  refreshOrders() {
    const container = document.getElementById('view-container');
    if (store.state.activeView === 'admin-orders' && container) this.renderOrders(container);
  },

  adminEditMeal(mealId) {
    selectedMealId = mealId;
    const container = document.getElementById('view-container');
    if (container) this.renderDashboard(container);
  },

  adminNewMeal() {
    selectedMealId = '__new__';
    const container = document.getElementById('view-container');
    if (container) this.renderDashboard(container);
  },

  adminOpenCategoryPicker() {
    const dialog = document.getElementById('admin-category-dialog');
    if (!dialog) return;
    dialog.classList.remove('hidden');
    dialog.classList.add('flex');
  },

  adminCloseCategoryPicker() {
    const dialog = document.getElementById('admin-category-dialog');
    if (!dialog) return;
    dialog.classList.add('hidden');
    dialog.classList.remove('flex');
  },

  adminChooseCategory(category) {
    const safeCategory = MENU_CATEGORIES.includes(category) ? category : 'Dumpling Packs';
    const input = document.getElementById('adminMealCategory');
    const label = document.getElementById('adminMealCategoryLabel');
    if (input) input.value = safeCategory;
    if (label) label.textContent = safeCategory;
    this.adminCloseCategoryPicker();
  },

  adminSetMealImage(src) {
    const safeSrc = sanitizeText(src, 300) || '/assets/images/dumplings-plate.png';
    const input = document.getElementById('adminMealImage');
    const preview = document.getElementById('adminMealImagePreview');
    if (input) input.value = safeSrc;
    if (preview) preview.src = safeSrc;
  },

  adminPickMealImage(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 1.5 * 1024 * 1024) {
      window.app.showFloatingAlert('Use a PNG, JPG, WebP, or GIF under 1.5 MB.', 'info');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      const hidden = document.getElementById('adminMealImage');
      const preview = document.getElementById('adminMealImagePreview');
      if (hidden) hidden.value = value;
      if (preview) preview.src = value;
      window.app.showFloatingAlert('Menu image ready. Save the item to keep it.', 'success');
    };
    reader.readAsDataURL(file);
  },

  adminSaveMeal(formData) {
    const id = store.upsertMeal(formData);
    window.app.showFloatingAlert('Menu item saved.', 'success');
    selectedMealId = id;
    const container = document.getElementById('view-container');
    if (container) this.renderDashboard(container);
  }
};

window.app = window.app || {};
window.app.adminOrdersSearch = adminViews.adminOrdersSearch.bind(adminViews);
window.app.adminOrdersStatus = adminViews.adminOrdersStatus.bind(adminViews);
window.app.adminOrdersPage = adminViews.adminOrdersPage.bind(adminViews);
window.app.adminUpdateStatus = adminViews.adminUpdateStatus.bind(adminViews);
window.app.adminUpdateTracking = adminViews.adminUpdateTracking.bind(adminViews);
window.app.adminUploadOrderPhoto = adminViews.adminUploadOrderPhoto.bind(adminViews);
window.app.adminSaveOrderWindow = adminViews.adminSaveOrderWindow.bind(adminViews);
window.app.adminDeleteMeal = adminViews.adminDeleteMeal.bind(adminViews);
window.app.adminEditMeal = adminViews.adminEditMeal.bind(adminViews);
window.app.adminNewMeal = adminViews.adminNewMeal.bind(adminViews);
window.app.adminOpenCategoryPicker = adminViews.adminOpenCategoryPicker.bind(adminViews);
window.app.adminCloseCategoryPicker = adminViews.adminCloseCategoryPicker.bind(adminViews);
window.app.adminChooseCategory = adminViews.adminChooseCategory.bind(adminViews);
window.app.adminSetMealImage = adminViews.adminSetMealImage.bind(adminViews);
window.app.adminPickMealImage = adminViews.adminPickMealImage.bind(adminViews);
window.app.adminSaveMeal = adminViews.adminSaveMeal.bind(adminViews);
