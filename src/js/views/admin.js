// admin.js - Desktop operations screens for Dumpling Desk

import { store } from '../store.js';
import { dataLoader } from '../data-loader.js';
import { renderOrderTable, renderCustomerTable, renderPagination } from '../components/table.js';
import { renderRevenueChart } from '../components/charts.js';

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

function statusCounts() {
  return Object.keys(statusLabels).map((status) => ({
    status,
    label: statusLabels[status],
    count: store.state.orders.filter((order) => order.status === status).length
  }));
}

export const adminViews = {
  renderDashboard(container) {
    const metrics = dataLoader.getAdminMetrics();
    const counts = statusCounts();
    const resellerCases = store.state.meals.filter((meal) => meal.category === 'Reseller Cases').length;

    container.innerHTML = `
      <div class="space-y-6 animate-fade-scroll">
        <section class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium">
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
            <div>
              <span class="text-xs font-bold uppercase text-accent">Admin gateway</span>
              <h1 class="font-display text-4xl md:text-5xl text-primary mt-1">Dumpling operations desk</h1>
              <p class="text-sm text-secondary mt-2 max-w-2xl">Monitor pack revenue, shipment status, student customers, and reseller demand from one desktop-first screen.</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div class="rounded-lg bg-background border border-background-dark px-3 py-2"><strong class="text-primary">${store.state.meals.length}</strong><span class="block text-secondary">products</span></div>
              <div class="rounded-lg bg-background border border-background-dark px-3 py-2"><strong class="text-primary">${store.state.orders.length}</strong><span class="block text-secondary">orders</span></div>
              <div class="rounded-lg bg-background border border-background-dark px-3 py-2"><strong class="text-primary">${store.state.customers.length}</strong><span class="block text-secondary">users</span></div>
              <div class="rounded-lg bg-background border border-background-dark px-3 py-2"><strong class="text-primary">${resellerCases}</strong><span class="block text-secondary">case SKUs</span></div>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          ${[
            ['Revenue', RM(metrics.kpis.totalRevenue), 'All simulated order totals'],
            ['Total orders', metrics.kpis.totalOrders, 'Loaded from JSON plus new carts'],
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

        <section class="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
          <div class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <div>
                <h2 class="font-display text-3xl text-primary">Revenue timeline</h2>
                <p class="text-xs text-secondary">Seven-day simulated sales volume</p>
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

        <section class="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
          <div class="rounded-lg border border-background-dark bg-background-card p-5 shadow-premium min-w-0">
            <h2 class="font-display text-3xl text-primary">Top packs</h2>
            <div class="space-y-4 mt-5">
              ${metrics.popularMeals.map((meal, idx) => `
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="w-8 h-8 rounded-lg bg-primary text-background font-bold text-sm flex items-center justify-center">${idx + 1}</span>
                    <div class="min-w-0">
                      <h3 class="font-display text-lg text-primary line-clamp-1">${meal.mealName}</h3>
                      <span class="text-xs text-secondary">${meal.category}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-sm font-bold text-primary block">${meal.quantity}</span>
                    <span class="text-xs text-secondary">${RM(meal.price * meal.quantity)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="rounded-lg border border-background-dark bg-background-card p-5 shadow-premium min-w-0 overflow-hidden">
            <div class="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 class="font-display text-3xl text-primary">Operations queue</h2>
                <p class="text-xs text-secondary">Newest active shipments requiring attention</p>
              </div>
              <button onclick="window.app.switchView('admin-orders')" class="button-ghost min-h-10 px-4 py-2">Open ledger</button>
            </div>
            ${renderOrderTable(dataLoader.queryOrders({ status: 'All', page: 1, limit: 5 }).items)}
          </div>
        </section>
      </div>
    `;

    setTimeout(() => {
      renderRevenueChart('revenueChartCanvas', metrics.revenueChart);
    }, 100);
  },

  renderOrders(container) {
    const results = dataLoader.queryOrders(ordersFilters);

    container.innerHTML = `
      <div class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium space-y-5 animate-fade-scroll">
        <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-background-dark pb-5">
          <div>
            <span class="text-xs font-bold uppercase text-accent">Shipment ledger</span>
            <h1 class="font-display text-4xl text-primary mt-1">Orders and status updates</h1>
            <p class="text-sm text-secondary mt-2">Search, filter, and move simulated orders through the shipment pipeline.</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div class="relative w-full xl:w-72">
              <input type="text" placeholder="Search orders or customers" value="${ordersFilters.search}" oninput="window.app.adminOrdersSearch(this.value)" class="form-input-premium text-sm min-h-11 pl-10" />
              <svg class="w-4 h-4 text-secondary/50 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <select onchange="window.app.adminOrdersStatus(this.value)" class="form-input-premium text-sm min-h-11 sm:w-56">
              <option value="All" ${ordersFilters.status === 'All' ? 'selected' : ''}>All statuses</option>
              <option value="received" ${ordersFilters.status === 'received' ? 'selected' : ''}>Received</option>
              <option value="preparing" ${ordersFilters.status === 'preparing' ? 'selected' : ''}>Payment confirmed</option>
              <option value="cooking" ${ordersFilters.status === 'cooking' ? 'selected' : ''}>Packing</option>
              <option value="out_for_delivery" ${ordersFilters.status === 'out_for_delivery' ? 'selected' : ''}>Out for shipment</option>
              <option value="delivered" ${ordersFilters.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            </select>
          </div>
        </div>
        ${renderOrderTable(results.items)}
        ${renderPagination(results.page, results.totalPages, 'adminOrdersPage')}
      </div>
    `;
  },

  adminOrdersSearch(query) {
    ordersFilters.search = query;
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

  refreshOrders() {
    const container = document.getElementById('view-container');
    if (store.state.activeView === 'admin-orders' && container) this.renderOrders(container);
  },

  renderCustomers(container) {
    const results = dataLoader.queryCustomers(customersFilters);

    container.innerHTML = `
      <div class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium space-y-5 animate-fade-scroll">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-background-dark pb-5">
          <div>
            <span class="text-xs font-bold uppercase text-accent">Customer records</span>
            <h1 class="font-display text-4xl text-primary mt-1">Student and buyer directory</h1>
            <p class="text-sm text-secondary mt-2">Simulated users, order counts, and lifetime spend for 200+ record rendering.</p>
          </div>
          <div class="relative w-full md:w-80">
            <input type="text" placeholder="Search customers" value="${customersFilters.search}" oninput="window.app.adminCustomersSearch(this.value)" class="form-input-premium text-sm min-h-11 pl-10" />
            <svg class="w-4 h-4 text-secondary/50 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
        ${renderCustomerTable(results.items)}
        ${renderPagination(results.page, results.totalPages, 'adminCustomersPage')}
      </div>
    `;
  },

  adminCustomersSearch(query) {
    customersFilters.search = query;
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
  }
};

window.app = window.app || {};
window.app.adminOrdersSearch = adminViews.adminOrdersSearch.bind(adminViews);
window.app.adminOrdersStatus = adminViews.adminOrdersStatus.bind(adminViews);
window.app.adminOrdersPage = adminViews.adminOrdersPage.bind(adminViews);
window.app.adminUpdateStatus = adminViews.adminUpdateStatus.bind(adminViews);
window.app.adminCustomersSearch = adminViews.adminCustomersSearch.bind(adminViews);
window.app.adminCustomersPage = adminViews.adminCustomersPage.bind(adminViews);
