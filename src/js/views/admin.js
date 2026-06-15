// admin.js - Unified HotMealBa admin gateway

import { store, escapeHtml, sanitizeText } from '../store.js';
import { dataLoader } from '../data-loader.js';
import { renderOrderTable, renderCustomerTable, renderPagination } from '../components/table.js';
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

let ordersFilters = {
  search: '',
  status: 'All',
  page: 1,
  limit: 12
};

let customersFilters = {
  search: '',
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
    ['admin-orders', 'Orders'],
    ['admin-customers', 'Customers']
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
  return `
    <section class="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
      <form onsubmit="event.preventDefault(); window.app.adminSaveMeal(new FormData(this))" class="rounded-lg border border-background-dark bg-background-card p-5 shadow-premium space-y-4">
        <div>
          <span class="text-xs font-bold uppercase text-accent">Menu editor</span>
          <h2 class="font-display text-3xl text-primary">Edit Menu item</h2>
        </div>
        <input type="hidden" name="mealId" value="${S(selected.mealId || '')}" />
        <label class="block text-xs font-bold text-secondary">Name<input name="mealName" required value="${S(selected.mealName || '')}" class="form-input-premium mt-1 text-sm" /></label>
        <label class="block text-xs font-bold text-secondary">Category<input name="category" required value="${S(selected.category || 'Dumpling Packs')}" class="form-input-premium mt-1 text-sm" /></label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block text-xs font-bold text-secondary">Price<input type="number" step="0.01" min="0" name="price" required value="${Number(selected.price || 0)}" class="form-input-premium mt-1 text-sm" /></label>
          <label class="block text-xs font-bold text-secondary">Rating<input type="number" step="0.1" min="1" max="5" name="rating" value="${Number(selected.rating || 4.8)}" class="form-input-premium mt-1 text-sm" /></label>
        </div>
        <label class="block text-xs font-bold text-secondary">Image URL<input name="image" value="${S(selected.image || '/assets/images/dumplings-plate.png')}" class="form-input-premium mt-1 text-sm" /></label>
        <label class="block text-xs font-bold text-secondary">Pack size<input name="packSize" value="${S(selected.packSize || '12 pcs')}" class="form-input-premium mt-1 text-sm" /></label>
        <label class="block text-xs font-bold text-secondary">Description<textarea name="description" rows="3" class="form-input-premium mt-1 text-sm">${S(selected.description || '')}</textarea></label>
        <label class="block text-xs font-bold text-secondary">Ingredients<textarea name="ingredients" rows="2" class="form-input-premium mt-1 text-sm">${S((selected.ingredients || []).join(', '))}</textarea></label>
        <button type="submit" class="button-accent w-full min-h-11">Save Menu item</button>
      </form>
      <div class="rounded-lg border border-background-dark bg-background-card p-5 shadow-premium">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="font-display text-3xl text-primary">Menu library</h2>
            <p class="text-xs text-secondary">Edit names, prices, categories, and pictures.</p>
          </div>
          <button onclick="window.app.adminNewMeal()" class="button-ghost min-h-10 px-4 py-2">New item</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${store.state.meals.slice(0, 8).map((meal) => `
            <div class="rounded-lg border border-background-dark bg-background p-3 flex gap-3">
              <img src="${S(meal.image)}" alt="${S(meal.mealName)}" class="h-16 w-16 rounded-lg object-cover border border-background-dark" />
              <div class="min-w-0 flex-1">
                <p class="font-display text-lg text-primary line-clamp-1">${S(meal.mealName)}</p>
                <p class="text-xs text-secondary">${S(meal.category)} · ${RM(meal.price)}</p>
                <button onclick="window.app.adminEditMeal('${meal.mealId}')" class="mt-2 text-xs font-bold text-accent">Edit</button>
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
        <section class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium">
          <h2 class="font-display text-3xl text-primary">Manual tracking location</h2>
          <p class="text-sm text-secondary mt-2">Set the current order point shown on the customer OpenStreetMap tracking view.</p>
          <form onsubmit="event.preventDefault(); window.app.adminUpdateTracking(new FormData(this))" class="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
            <select name="orderId" required class="form-input-premium text-sm min-h-12 md:col-span-1">
              ${store.state.orders.map((order) => `<option value="${S(order.orderId)}">${S(order.orderId)}</option>`).join('')}
            </select>
            <input name="lat" required type="number" step="0.000001" placeholder="Latitude" class="form-input-premium text-sm min-h-12" />
            <input name="lng" required type="number" step="0.000001" placeholder="Longitude" class="form-input-premium text-sm min-h-12" />
            <button type="submit" class="button-accent min-h-12">Update map</button>
          </form>
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
    const ok = store.updateTrackingLocation(formData.get('orderId'), formData.get('lat'), formData.get('lng'));
    window.app.showFloatingAlert(ok ? 'Tracking location updated.' : 'Enter valid coordinates.', ok ? 'success' : 'info');
    this.refreshOrders();
  },

  refreshOrders() {
    const container = document.getElementById('view-container');
    if (store.state.activeView === 'admin-orders' && container) this.renderOrders(container);
  },

  renderCustomers(container) {
    const results = dataLoader.queryCustomers(customersFilters);

    container.innerHTML = `
      <div class="space-y-5 animate-fade-scroll">
        ${renderAdminTabs('admin-customers')}
        <section class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium space-y-5">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-background-dark pb-5">
            <div>
              <span class="text-xs font-bold uppercase text-accent">Customer records</span>
              <h1 class="font-display text-4xl text-primary mt-1">Buyer directory</h1>
              <p class="text-sm text-secondary mt-2">Guest checkout customers are saved with their real orders.</p>
            </div>
            <div class="relative w-full md:w-80">
              <input type="text" placeholder="Search customers" value="${S(customersFilters.search)}" oninput="window.app.adminCustomersSearch(this.value)" class="form-input-premium text-sm min-h-11 pl-10" />
              <svg class="w-4 h-4 text-secondary/50 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>
          ${renderCustomerTable(results.items)}
          ${renderPagination(results.page, results.totalPages, 'adminCustomersPage')}
        </section>
      </div>
    `;
  },

  adminCustomersSearch(query) {
    customersFilters.search = sanitizeText(query, 80);
    customersFilters.page = 1;
    this.refreshCustomers();
  },

  adminCustomersPage(page) {
    customersFilters.page = page;
    this.refreshCustomers();
  },

  refreshCustomers() {
    const container = document.getElementById('view-container');
    if (store.state.activeView === 'admin-customers' && container) this.renderCustomers(container);
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

  adminSaveMeal(formData) {
    store.upsertMeal(formData);
    window.app.showFloatingAlert('Menu item saved.', 'success');
    const id = sanitizeText(formData.get('mealId'), 40);
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
window.app.adminCustomersSearch = adminViews.adminCustomersSearch.bind(adminViews);
window.app.adminCustomersPage = adminViews.adminCustomersPage.bind(adminViews);
window.app.adminEditMeal = adminViews.adminEditMeal.bind(adminViews);
window.app.adminNewMeal = adminViews.adminNewMeal.bind(adminViews);
window.app.adminSaveMeal = adminViews.adminSaveMeal.bind(adminViews);
