// customer.js - Customer screens for HotMealBa

import { store, escapeHtml, sanitizeText, sanitizePhone, sanitizeOrderId } from '../store.js';
import { dataLoader } from '../data-loader.js';
import { renderMealCard, renderCategoryChips, renderRatingStars } from '../components/cards.js';
import { renderPagination } from '../components/table.js';
import { renderTrackingStepper, renderLeafletMap, mountLeafletTrackingMap } from '../components/tracking.js';

const CATEGORIES = [
  'All',
  'Dumpling Packs',
  'Sampler Boxes',
  'Party Trays',
  'Sauces',
  'Reseller Cases',
  'Add-ons'
];

const RM = (value) => `RM ${Number(value || 0).toFixed(2)}`;

const statusLabels = {
  received: 'Order received',
  preparing: 'Payment confirmed',
  cooking: 'Order packed',
  out_for_delivery: 'Out for shipment',
  delivered: 'Delivered'
};

const statusColors = {
  received: 'bg-secondary/10 text-secondary border-secondary/20',
  preparing: 'bg-warning/10 text-warning-dark border-warning/20',
  cooking: 'bg-accent/10 text-accent-dark border-accent/20',
  out_for_delivery: 'bg-primary/10 text-primary border-primary/20',
  delivered: 'bg-success/10 text-success-dark border-success/20'
};

let catalogFilters = {
  search: '',
  category: 'All',
  sortBy: 'rating',
  page: 1,
  limit: 12
};

const catalogCategoryBaseClass = 'whitespace-nowrap min-h-10 px-4 py-2 rounded-full text-sm font-bold border transition-all active:scale-95';
const catalogCategoryActiveClass = 'bg-accent text-white border-accent shadow-accent-glow';
const catalogCategoryInactiveClass = 'bg-background text-secondary border-background-dark hover:border-accent/40 hover:text-primary';
const catalogSortOptions = ['rating', 'name', 'price-asc', 'price-desc'];

let trackOrderResult = null;
let noteIndex = 0;
let detailsTab = 'details';
let detailsQty = 1;

const S = escapeHtml;

function deliveryWindows() {
  const now = new Date();
  const windows = [
    { label: 'Today, 10 AM - 1 PM', endHour: 13 },
    { label: 'Today, 2 PM - 4 PM', endHour: 16 },
    { label: 'Today, 4 PM - 7 PM', endHour: 19 },
    { label: 'Tomorrow, 10 AM - 1 PM', endHour: null },
    { label: 'Tomorrow, 2 PM - 6 PM', endHour: null }
  ];
  return windows.map((item) => ({
    ...item,
    disabled: item.endHour !== null && now.getHours() >= item.endHour
  }));
}

// Order-open window shown on the home page; admins set it from the gateway.
function orderWindowInfo() {
  const ow = store.state.orderWindow || { openTime: '10:00', closeTime: '18:00' };
  const fmt = (hm) => {
    const [h, m] = String(hm).split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = ((h + 11) % 12) + 1;
    return `${hh}${m ? ':' + String(m).padStart(2, '0') : ''} ${ampm}`;
  };
  const toMin = (hm) => { const [h, m] = String(hm).split(':').map(Number); return h * 60 + m; };
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const open = cur >= toMin(ow.openTime) && cur < toMin(ow.closeTime);
  return { open, label: `${fmt(ow.openTime)} - ${fmt(ow.closeTime)} today` };
}

function orderLineItems(order) {
  if (order?.lineItems?.length) return order.lineItems;
  const meal = store.state.meals.find((m) => m.mealId === order?.mealId);
  return meal ? [{ mealId: meal.mealId, quantity: order.quantity || 1 }] : [];
}

function orderPrimaryMeal(order) {
  const first = orderLineItems(order)[0];
  return first ? store.state.meals.find((m) => m.mealId === first.mealId) : null;
}

function renderMiniCartPanel() {
  const cart = store.state.cart;
  const subtotal = store.getCartTotal();
  const deliveryFee = cart.length ? 6 : 0;
  const total = subtotal + deliveryFee;

  return `
    <div class="sticky top-24 rounded-lg border border-background-dark bg-background-card p-4 shadow-premium space-y-4">
      <div class="rounded-lg border border-background-dark bg-background p-4">
        <h2 class="font-display text-2xl text-primary">Cart</h2>
        <p class="text-xs text-secondary mt-1">${cart.length ? `${store.getCartCount()} item(s) selected` : 'Your cart is empty'}</p>
      </div>
      <div class="space-y-3 max-h-[320px] overflow-y-auto pr-1" data-native-scroll>
        ${cart.length === 0 ? `
          <button onclick="window.app.switchView('catalog')" class="w-full rounded-lg border border-dashed border-background-dark bg-background p-5 text-center text-xs text-secondary">
            Browse Menu to add items
          </button>
        ` : cart.map((item) => {
          const meal = store.state.meals.find((m) => m.mealId === item.mealId);
          if (!meal) return '';
          return `
            <div class="flex items-center gap-3 rounded-lg border border-background-dark bg-background p-3">
              <img src="${S(meal.image)}" alt="${S(meal.mealName)}" class="h-12 w-12 rounded-lg object-cover" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-bold text-primary line-clamp-1">${S(meal.mealName)}</p>
                <p class="text-xs text-secondary">Qty ${item.quantity} · ${RM(meal.price * item.quantity)}</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="space-y-2 border-t border-background-dark pt-4 text-sm">
        <div class="flex justify-between text-secondary"><span>Subtotal</span><span>${RM(subtotal)}</span></div>
        <div class="flex justify-between text-secondary"><span>Delivery</span><span>${RM(deliveryFee)}</span></div>
        <div class="flex justify-between text-primary font-bold"><span>Total</span><span>${RM(total)}</span></div>
      </div>
      <button onclick="window.app.switchView('${cart.length ? 'checkout' : 'catalog'}')" class="w-full ${cart.length ? 'button-accent' : 'button-primary'} min-h-11">
        ${cart.length ? 'Go to checkout' : 'Browse Menu'}
      </button>
    </div>
  `;
}

export const customerViews = {
  renderHome(container) {
    const featuredMeals = [...store.state.meals]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);

    const heroMeal = featuredMeals[0] || store.state.meals[0];

    const discountedMeals = store.state.meals
      .filter((meal) => ['Dumpling Packs', 'Sampler Boxes', 'Reseller Cases'].includes(meal.category))
      .slice(0, 3);

    const recentOrders = store.state.orders.slice(0, 3).map((order) => ({
      ...order,
      meal: orderPrimaryMeal(order)
    }));

    const ow = orderWindowInfo();

    container.innerHTML = `
      <div class="space-y-10 md:space-y-14 animate-fade-scroll">
        <!-- Immersive hero -->
        <section data-reveal class="relative overflow-hidden rounded-3xl border border-background-dark shadow-premium bg-primary text-background">
          <img src="${S(heroMeal?.image || '/assets/images/dumplings-plate.png')}" alt="" aria-hidden="true" class="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div class="absolute inset-0 bg-gradient-to-tr from-primary via-primary/90 to-primary/40"></div>
          <div class="relative grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 p-6 md:p-10 lg:p-12 items-center">
            <div class="space-y-6">
              <span class="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-background/90">
                <span class="h-2 w-2 rounded-full ${ow.open ? 'bg-success-light' : 'bg-warning-light'}"></span>
                <span data-i18n="home.eyebrow">Campus meals and dumplings</span>
              </span>
              <h1 class="font-display leading-[0.9] text-6xl md:text-7xl lg:text-8xl text-background">
                Taste the<br><span class="text-accent-light">HotMealBa</span> way
              </h1>
              <p class="text-sm md:text-lg text-background/80 leading-relaxed max-w-xl" data-i18n="home.tagline">
                Order handmade dumplings, noodles, skewers, and reseller bundles with clean checkout and real order tracking.
              </p>
              <div class="flex flex-col sm:flex-row gap-3">
                <button onclick="window.app.switchView('catalog')" class="button-accent min-h-12 text-base px-7"><span data-i18n="home.browse">Browse Menu</span></button>
                <button onclick="window.app.switchView('apply')" class="inline-flex items-center justify-center gap-2 rounded-lg border border-background/30 bg-background/5 px-6 py-3 text-sm font-bold text-background transition-all hover:bg-background/15 active:scale-95 min-h-12"><span data-i18n="home.reseller">Become a reseller</span></button>
              </div>
              <div class="grid grid-cols-3 gap-3 max-w-md pt-2">
                <div class="rounded-xl bg-background/10 px-3 py-3 backdrop-blur-sm">
                  <span class="block font-display text-2xl md:text-3xl text-background">${store.state.orders.length}+</span>
                  <span class="text-[11px] text-background/70" data-i18n="common.orders">orders</span>
                </div>
                <div class="rounded-xl bg-background/10 px-3 py-3 backdrop-blur-sm">
                  <span class="block font-display text-2xl md:text-3xl text-background">${store.state.customers.length}+</span>
                  <span class="text-[11px] text-background/70" data-i18n="common.customers">customers</span>
                </div>
                <div class="rounded-xl bg-background/10 px-3 py-3 backdrop-blur-sm">
                  <span class="block font-display text-2xl md:text-3xl text-background"><span data-i18n="common.live">Live</span></span>
                  <span class="text-[11px] text-background/70" data-i18n="common.tracking">tracking</span>
                </div>
              </div>
            </div>
            <div class="relative hidden lg:block">
              <div class="relative aspect-square rounded-2xl overflow-hidden border border-background/20 shadow-2xl">
                <img src="${S(heroMeal?.image || '/assets/images/dumplings-plate.png')}" alt="${S(heroMeal?.mealName || 'HotMealBa dumplings')}" class="h-full w-full object-cover" />
              </div>
              <div class="absolute -bottom-4 -left-4 rounded-2xl bg-background-card text-primary border border-background-dark px-4 py-3 shadow-premium">
                <span class="block text-[11px] font-bold uppercase text-accent">Starter bundle</span>
                <span class="block font-display text-lg text-primary">48 pcs + 2 sauces</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Status strip -->
        <section data-reveal class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="rounded-2xl border border-background-dark bg-background-card px-5 py-4 shadow-sm flex items-center gap-3">
            <span class="grid h-10 w-10 place-items-center rounded-xl ${ow.open ? 'bg-success/10 text-success-dark' : 'bg-warning/10 text-warning-dark'}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </span>
            <span><span class="block font-bold text-primary text-sm">${ow.open ? 'Orders open' : 'Orders closed'}</span><span class="text-xs text-secondary">${ow.label}</span></span>
          </div>
          <div class="rounded-2xl border border-background-dark bg-background-card px-5 py-4 shadow-sm flex items-center gap-3">
            <span class="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3M3.75 5.25h16.5c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H3.75A1.125 1.125 0 012.625 17.625V6.375c0-.621.504-1.125 1.125-1.125z"/></svg></span>
            <span><span class="block font-bold text-primary text-sm">Payment</span><span class="text-xs text-secondary">Transfer, wallet, or COD</span></span>
          </div>
          <div class="rounded-2xl border border-background-dark bg-background-card px-5 py-4 shadow-sm flex items-center gap-3">
            <span class="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg></span>
            <span><span class="block font-bold text-primary text-sm">Shipment</span><span class="text-xs text-secondary">Packs to your address</span></span>
          </div>
        </section>

        <!-- Featured picks -->
        <section data-reveal>
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
            <div>
              <span class="text-xs font-bold uppercase text-accent">Discounted quick picks</span>
              <h2 class="font-display text-3xl md:text-4xl text-primary" data-i18n="home.featured">Featured picks</h2>
            </div>
            <button onclick="window.app.switchView('catalog')" class="button-ghost min-h-11"><span data-i18n="home.viewMenu">View full Menu</span></button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${discountedMeals.map((meal, index) => `
              <button onclick="window.app.openMealDetails('${meal.mealId}')" class="group relative overflow-hidden text-left rounded-2xl bg-background-card border border-background-dark shadow-premium hover:shadow-premium-hover transition-all min-h-[180px]">
                <div class="aspect-[16/10] overflow-hidden">
                  <img src="${meal.image}" alt="${S(meal.mealName)}" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <span class="absolute top-3 left-3 rounded-full bg-accent text-white text-[11px] font-bold px-2.5 py-1 shadow-accent-glow">Save ${15 - index * 2}%</span>
                <div class="p-4">
                  <span class="block font-display text-xl text-primary leading-tight line-clamp-1">${S(meal.mealName)}</span>
                  <div class="flex items-center justify-between mt-1">
                    <span class="text-xs text-secondary">${S(meal.packSize || meal.category)}</span>
                    <span class="font-bold text-primary">${RM(meal.price)}</span>
                  </div>
                </div>
              </button>
            `).join('')}
          </div>
        </section>

        <!-- Browse by order type (now clickable -> menu) -->
        <section data-reveal>
          <div class="mb-4">
            <span class="text-xs font-bold uppercase text-accent">Menu board</span>
            <h2 class="font-display text-3xl md:text-4xl text-primary" data-i18n="home.browseType">Browse by order type</h2>
          </div>
          <div class="flex flex-wrap gap-2 pb-2">
            ${renderCategoryChips(CATEGORIES, '__none__', 'browseCategory')}
          </div>
        </section>

        <!-- Popular -->
        <section data-reveal>
          <div class="mb-4">
            <span class="text-xs font-bold uppercase text-accent">Best rated</span>
            <h2 class="font-display text-3xl md:text-4xl text-primary" data-i18n="home.popular">Popular menu items</h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${featuredMeals.map((meal) => renderMealCard(meal)).join('')}
          </div>
        </section>

        <!-- Reorder + how it works -->
        <section data-reveal class="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-5">
          <div class="rounded-2xl border border-background-dark bg-background-card p-5 md:p-6 shadow-premium">
            <span class="text-xs font-bold uppercase text-accent">Fast reorder</span>
            <h2 class="font-display text-3xl text-primary mt-1" data-i18n="home.recent">Repeat a recent order</h2>
            <p class="text-sm text-secondary mt-2">Only orders created in this app appear here.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            ${recentOrders.length === 0 ? `
              <div class="md:col-span-3 rounded-2xl border border-background-dark bg-background-card p-5 text-sm text-secondary flex items-center">
                No saved orders yet. Place an order and it will appear here for quick reorder.
              </div>
            ` : recentOrders.map((order) => {
              if (!order.meal) return '';
              return `
                <button onclick="window.app.addToCart('${order.meal.mealId}')" class="text-left rounded-2xl border border-background-dark bg-background-card p-4 hover:border-accent/40 transition-all min-h-[116px]">
                  <span class="flex items-center gap-3">
                    <img src="${order.meal.image}" alt="${S(order.meal.mealName)}" class="w-14 h-14 rounded-lg object-cover border border-background-dark" />
                    <span class="min-w-0">
                      <span class="font-display text-lg text-primary line-clamp-1">${S(order.meal.mealName)}</span>
                      <span class="text-xs text-secondary">${RM(order.meal.price)} - add again</span>
                    </span>
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </section>

        <section data-reveal class="rounded-2xl border border-background-dark bg-background-card p-5 md:p-6 shadow-premium">
          <span class="text-xs font-bold uppercase text-accent" data-i18n="home.how">How it works</span>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            ${[
              ['01', 'Choose Menu', 'Pick dumplings, noodles, sauces, or reseller cases.'],
              ['02', 'Add address', 'Enter delivery details and notes before confirmation.'],
              ['03', 'Confirm payment', 'Select transfer, wallet, or COD.'],
              ['04', 'Track shipment', 'Watch the order move through clear shipment stages.']
            ].map(([num, title, body]) => `
              <div class="rounded-xl border border-background-dark bg-background p-4">
                <span class="text-xs font-bold text-accent">${num}</span>
                <h3 class="font-display text-xl text-primary mt-1">${title}</h3>
                <p class="text-xs text-secondary mt-2 leading-relaxed">${body}</p>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    `;
  },

  renderCatalog(container) {
    const results = dataLoader.queryMeals(catalogFilters);

    container.innerHTML = `
      <div class="animate-fade-scroll space-y-5">
        <!-- Storefront top bar: title, search, sort, category tabs -->
        <section id="catalog-board" class="rounded-2xl border border-background-dark bg-background-card p-5 md:p-6 shadow-premium space-y-5">
          <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <span class="text-xs font-bold uppercase text-accent">Menu</span>
              <h1 class="font-display text-4xl md:text-5xl text-primary" data-i18n="menu.title">HotMealBa order board</h1>
              <p class="text-sm text-secondary mt-2 max-w-xl">Search the Menu, compare prices, and add items without losing your place.</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div class="relative w-full sm:w-72">
                <input id="catalogSearch" value="${S(catalogFilters.search)}" oninput="window.app.catalogSearch(this.value)" data-i18n-ph="menu.search" placeholder="Search dumplings, sauce, noodles..." class="form-input-premium text-sm pl-10 min-h-11" />
                <svg class="w-4 h-4 text-secondary/50 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <select data-catalog-sort onchange="window.app.catalogSort(this.value)" class="form-input-premium text-sm min-h-11 sm:w-44">
                <option value="rating" ${catalogFilters.sortBy === 'rating' ? 'selected' : ''}>Best rated</option>
                <option value="name" ${catalogFilters.sortBy === 'name' ? 'selected' : ''}>A to Z</option>
                <option value="price-asc" ${catalogFilters.sortBy === 'price-asc' ? 'selected' : ''}>Price: low to high</option>
                <option value="price-desc" ${catalogFilters.sortBy === 'price-desc' ? 'selected' : ''}>Price: high to low</option>
              </select>
            </div>
          </div>
          <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" data-native-scroll>
            ${CATEGORIES.map((cat) => {
              const isActive = cat === catalogFilters.category;
              return `
                <button data-catalog-category="${S(cat)}" onclick="window.app.setCatalogCategory('${cat}')" class="${catalogCategoryBaseClass} ${isActive ? catalogCategoryActiveClass : catalogCategoryInactiveClass}">
                  ${cat}
                </button>
              `;
            }).join('')}
          </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
          <main id="catalog-results">
            ${this.catalogResultsHtml(results)}
          </main>
          <aside class="hidden lg:block">
            ${renderMiniCartPanel()}
          </aside>
        </div>
      </div>
    `;
  },

  catalogResultsHtml(results) {
    if (results.items.length === 0) {
      return `
        <div class="rounded-2xl border border-background-dark bg-background-card p-10 text-center shadow-premium">
          <h2 class="font-display text-2xl text-primary" data-i18n="menu.empty">No Menu items found</h2>
          <p class="text-sm text-secondary mt-2">Try another search or category.</p>
        </div>
      `;
    }
    const start = (results.page - 1) * results.limit + 1;
    const end = Math.min(results.page * results.limit, results.total);
    return `
      <div class="flex items-center justify-between mb-3 px-1">
        <span class="text-xs font-bold uppercase text-secondary">Showing ${start}-${end} of ${results.total} item${results.total === 1 ? '' : 's'}</span>
        <span class="text-xs text-secondary">${S(catalogFilters.category)}</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        ${results.items.map((meal) => renderMealCard(meal)).join('')}
      </div>
      ${renderPagination(results.page, results.totalPages, 'catalogPage')}
    `;
  },

  setCatalogCategory(cat, options = {}) {
    catalogFilters.category = CATEGORIES.includes(cat) ? cat : 'All';
    catalogFilters.page = 1;
    if (!options.silent) this.updateCatalogResults({ keepBoardVisible: true });
  },

  catalogSort(sortBy) {
    catalogFilters.sortBy = catalogSortOptions.includes(sortBy) ? sortBy : 'rating';
    catalogFilters.page = 1;
    this.updateCatalogResults({ keepBoardVisible: true });
  },

  // Update ONLY the results region so the search input keeps focus/caret.
  catalogSearch(search) {
    catalogFilters.search = search;
    catalogFilters.page = 1;
    this.updateCatalogResults();
  },

  catalogPage(page) {
    catalogFilters.page = page;
    this.updateCatalogResults({ keepBoardVisible: true });
  },

  updateCatalogControls() {
    document.querySelectorAll('[data-catalog-category]').forEach((button) => {
      const isActive = button.getAttribute('data-catalog-category') === catalogFilters.category;
      button.className = `${catalogCategoryBaseClass} ${isActive ? catalogCategoryActiveClass : catalogCategoryInactiveClass}`;
    });
    const sort = document.querySelector('[data-catalog-sort]');
    if (sort) sort.value = catalogFilters.sortBy;
  },

  updateCatalogResults({ keepBoardVisible = false } = {}) {
    if (store.state.activeView !== 'catalog') return;
    const target = document.getElementById('catalog-results');
    if (target) target.innerHTML = this.catalogResultsHtml(dataLoader.queryMeals(catalogFilters));
    this.updateCatalogControls();
    window.app?.applyTranslations?.();
    window.app?.updateScrollFocus?.();
    if (keepBoardVisible) this.keepCatalogBoardVisible();
  },

  keepCatalogBoardVisible() {
    const board = document.getElementById('catalog-board');
    if (!board) return;
    const headerOffset = 88;
    const boardTop = board.getBoundingClientRect().top;
    if (boardTop < headerOffset || boardTop > window.innerHeight * 0.45) {
      const top = window.scrollY + boardTop - headerOffset;
      if (window.app?.scrollToPosition) window.app.scrollToPosition(top, { immediate: true });
      else window.scrollTo({ top, behavior: 'auto' });
    }
  },

  refreshCatalog() {
    const container = document.getElementById('view-container');
    if (store.state.activeView === 'catalog' && container) {
      const y = window.scrollY;
      this.renderCatalog(container);
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  },

  renderMealDetails(mealId) {
    const meal = store.state.meals.find((m) => m.mealId === mealId);
    if (!meal) return '';
    const reviews = dataLoader.getMealRatings(mealId);
    const tabs = [['details', 'Details'], ['use', 'How to use'], ['ingredients', 'Ingredients']];

    const tabBody = () => {
      if (detailsTab === 'use') {
        return `<p class="text-sm text-secondary leading-relaxed">Steam or pan-fry straight from frozen for 6-8 minutes until piping hot. Serve with the included sauces. Keep frozen below -18&deg;C; do not refreeze once thawed.</p>
          <div class="grid grid-cols-2 gap-3 mt-4">
            <div class="rounded-xl bg-background border border-background-dark p-3"><span class="text-[11px] text-secondary">Pack size</span><span class="block font-bold text-primary">${S(meal.packSize || meal.prepTime + ' pcs')}</span></div>
            <div class="rounded-xl bg-background border border-background-dark p-3"><span class="text-[11px] text-secondary">Freezer life</span><span class="block font-bold text-primary">${S(meal.freezerLife || 'Up to 30 days')}</span></div>
          </div>`;
      }
      if (detailsTab === 'ingredients') {
        return `<div class="flex flex-wrap gap-2">
          ${(meal.ingredients || []).map((ing) => `<span class="bg-background text-secondary text-xs px-3 py-1.5 rounded-full border border-background-dark font-semibold">${S(ing)}</span>`).join('') || '<span class="text-xs text-secondary italic">No ingredient list provided.</span>'}
        </div>`;
      }
      return `<p class="text-sm text-secondary leading-relaxed">${S(meal.description)}</p>
        ${reviews.length ? `<div class="mt-4 space-y-2 max-h-[120px] overflow-y-auto pr-1" data-native-scroll>
          ${reviews.slice(0, 3).map((rev) => `
            <div class="bg-background border border-background-dark rounded-xl p-3">
              <div class="flex items-center justify-between gap-2"><span class="text-xs font-bold text-primary">${S(rev.customerName)}</span><span class="flex">${renderRatingStars(rev.rating)}</span></div>
              <p class="text-xs text-secondary mt-1 leading-relaxed">"${S(rev.review)}"</p>
            </div>`).join('')}
        </div>` : ''}`;
    };

    return `
      <div class="relative bg-background-card rounded-3xl max-w-md w-full mx-4 overflow-hidden border border-background-dark shadow-2xl flex flex-col max-h-[92vh] animate-slide-up">
        <button onclick="window.app.closeMealDetails()" class="absolute top-4 right-4 z-10 bg-background-card/90 backdrop-blur border border-background-dark p-2 rounded-full text-primary hover:text-accent transition-colors shadow-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <div class="p-4 pb-0">
          <span class="block text-center font-display text-xl text-primary mb-3">Product Details</span>
          <div class="aspect-square rounded-2xl overflow-hidden border border-background-dark bg-background">
            <img src="${meal.image}" alt="${S(meal.mealName)}" class="w-full h-full object-cover" />
          </div>
        </div>
        <div class="p-5 overflow-y-auto" data-native-scroll>
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="font-display text-2xl text-primary leading-tight">${S(meal.mealName)}</h2>
              <p class="text-xs text-secondary mt-0.5">${S(meal.category)}</p>
            </div>
            <span class="font-display text-2xl text-primary whitespace-nowrap">${RM(meal.price)}</span>
          </div>
          <div class="flex items-center gap-1.5 mt-2">
            <span class="flex">${renderRatingStars(meal.rating)}</span>
            <span class="text-xs font-bold text-primary">${meal.rating.toFixed(1)}/5</span>
            <span class="text-xs text-secondary">(${reviews.length}+ Review${reviews.length === 1 ? '' : 's'})</span>
          </div>

          <!-- Tabs -->
          <div class="flex items-center gap-5 border-b border-background-dark mt-5">
            ${tabs.map(([key, label]) => `
              <button onclick="window.app.setMealTab('${key}')" class="relative pb-2.5 text-sm font-semibold transition-colors ${detailsTab === key ? 'text-primary' : 'text-secondary hover:text-primary'}">
                ${label}
                ${detailsTab === key ? '<span class="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-accent"></span>' : ''}
              </button>
            `).join('')}
          </div>
          <div class="mt-4">${tabBody()}</div>
        </div>

        <!-- Sticky action bar -->
        <div class="border-t border-background-dark p-4 flex items-center gap-3 bg-background-card">
          <div class="flex items-center gap-2 rounded-full border border-background-dark px-2 py-1.5">
            <button onclick="window.app.setMealQty(${detailsQty - 1})" class="w-8 h-8 rounded-full flex items-center justify-center text-primary text-lg font-bold active:scale-90" aria-label="Decrease">−</button>
            <span class="w-5 text-center text-sm font-bold text-primary">${detailsQty}</span>
            <button onclick="window.app.setMealQty(${detailsQty + 1})" class="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-lg font-bold active:scale-90 shadow-accent-glow" aria-label="Increase">+</button>
          </div>
          <button onclick="window.app.addToCart('${meal.mealId}', ${detailsQty}); window.app.closeMealDetails();" class="flex-grow button-accent min-h-12 text-base"><span data-i18n="cta.addCart">Add to Cart</span></button>
        </div>
      </div>
    `;
  },

  prepMealDetails() {
    detailsTab = 'details';
    detailsQty = 1;
  },

  setMealTab(tab) {
    detailsTab = tab;
    const inner = document.getElementById('modal-content-inner');
    if (inner && store.state.selectedMealId) inner.innerHTML = this.renderMealDetails(store.state.selectedMealId);
  },

  setMealQty(qty) {
    detailsQty = Math.max(1, Math.min(99, qty || 1));
    const inner = document.getElementById('modal-content-inner');
    if (inner && store.state.selectedMealId) inner.innerHTML = this.renderMealDetails(store.state.selectedMealId);
  },

  renderCartDrawer() {
    const drawerContainer = document.getElementById('cart-drawer-items');
    const footerContainer = document.getElementById('cart-drawer-footer');
    if (!drawerContainer || !footerContainer) return;

    const cart = store.state.cart;
    if (cart.length === 0) {
      drawerContainer.innerHTML = `
        <div class="py-24 text-center text-secondary">
          <svg class="w-14 h-14 mx-auto mb-4 text-secondary/25" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-8.25-4.5-8.25 4.5m16.5 0l-8.25 4.5m8.25-4.5v9l-8.25 4.5m0-9l-8.25-4.5m8.25 4.5v9m-8.25-13.5v9l8.25 4.5"/></svg>
          <p class="font-display text-2xl text-primary mb-1">Cart is empty</p>
          <p class="text-xs text-secondary">Add items from the Menu board.</p>
        </div>
      `;
      footerContainer.innerHTML = `<button onclick="window.app.closeCartDrawer(); window.app.switchView('catalog');" class="w-full button-primary min-h-12">Browse Menu</button>`;
      return;
    }

    drawerContainer.innerHTML = cart.map((item) => {
      const meal = store.state.meals.find((m) => m.mealId === item.mealId);
      if (!meal) return '';
      const was = (meal.price * 1.12);
      return `
        <div class="flex items-center gap-3 p-3 bg-background rounded-2xl border border-background-dark shadow-sm">
          <img src="${meal.image}" alt="${S(meal.mealName)}" class="w-16 h-16 rounded-xl object-cover border border-background-dark flex-shrink-0" />
          <div class="flex-grow min-w-0">
            <h4 class="font-display text-base text-primary truncate leading-tight">${S(meal.mealName)}</h4>
            <p class="text-[11px] text-secondary truncate">${S(meal.category)}</p>
            <div class="flex items-baseline gap-1.5 mt-0.5">
              <span class="text-sm font-bold text-primary">${RM(meal.price)}</span>
              <span class="text-[11px] text-secondary/70 line-through">${RM(was)}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button onclick="window.app.updateCartQuantity('${meal.mealId}', ${item.quantity - 1})" class="w-8 h-8 bg-background-card border border-background-dark rounded-full text-primary hover:border-accent/40 transition-all flex items-center justify-center cursor-pointer text-base font-bold active:scale-90" aria-label="Decrease">−</button>
            <span class="text-sm font-bold text-primary w-5 text-center">${item.quantity}</span>
            <button onclick="window.app.updateCartQuantity('${meal.mealId}', ${item.quantity + 1})" class="w-8 h-8 bg-accent text-white rounded-full shadow-accent-glow transition-all flex items-center justify-center cursor-pointer text-base font-bold active:scale-90" aria-label="Increase">+</button>
          </div>
          <button onclick="window.app.removeFromCart('${meal.mealId}')" class="text-secondary/60 hover:text-danger p-1.5 rounded-lg hover:bg-danger/5 transition-colors cursor-pointer flex-shrink-0" aria-label="Remove item">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79"/></svg>
          </button>
        </div>
      `;
    }).join('');

    const subtotal = store.getCartTotal();
    const deliveryFee = 6;
    const total = subtotal + deliveryFee;
    footerContainer.innerHTML = `
      <!-- Payment details card -->
      <div class="rounded-2xl border border-background-dark bg-background p-4 mb-4">
        <h4 class="font-display text-lg text-primary mb-3">Payment Details</h4>
        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between text-secondary"><span data-i18n="common.subtotal">Subtotal</span><span class="text-primary font-medium">${RM(subtotal)}</span></div>
          <div class="flex items-center justify-between text-secondary"><span data-i18n="common.delivery">Delivery</span><span class="text-primary font-medium">${RM(deliveryFee)}</span></div>
          <div class="flex items-center justify-between text-base font-bold text-primary pt-3 border-t border-background-dark"><span data-i18n="common.total">Total</span><span class="font-display">${RM(total)}</span></div>
        </div>
      </div>
      <button onclick="window.app.switchView('checkout'); window.app.closeCartDrawer();" class="w-full button-accent min-h-12 text-base"><span data-i18n="cta.checkout">Go to checkout</span></button>
    `;
  },

  renderCheckout(container) {
    const cart = store.state.cart;
    if (cart.length === 0) {
      container.innerHTML = `
        <div data-reveal class="animate-fade-scroll rounded-2xl border border-background-dark bg-background-card p-10 text-center shadow-premium">
          <h1 class="font-display text-3xl text-primary">Checkout needs a Cart</h1>
          <p class="text-sm text-secondary mt-2 mb-6">Add at least one Menu item before confirming delivery.</p>
          <button onclick="window.app.switchView('catalog')" class="button-primary min-h-11">Explore Menu</button>
        </div>
      `;
      return;
    }

    const subtotal = store.getCartTotal();
    const deliveryFee = 6;
    const total = subtotal + deliveryFee;
    const windows = deliveryWindows();
    const hasAvailableWindow = windows.some((item) => !item.disabled);
    const firstAvailableWindow = windows.find((item) => !item.disabled)?.label;

    container.innerHTML = `
      <div class="animate-fade-scroll grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        <main data-reveal class="rounded-2xl border border-background-dark bg-background-card p-5 md:p-7 shadow-premium">
          <span class="text-xs font-bold uppercase text-accent">Delivery and payment</span>
          <h1 class="font-display text-4xl text-primary mt-1">Confirm your HotMealBa order</h1>
          <p class="text-sm text-secondary mt-2">Shipment will be arranged after payment confirmation.</p>
          <form id="checkoutForm" onsubmit="event.preventDefault(); window.app.submitCheckout(new FormData(this))" class="space-y-5 mt-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="space-y-1 text-xs font-bold text-secondary">Full name<input type="text" name="name" required placeholder="e.g. Nur Aina" class="form-input-premium text-sm min-h-12 font-normal" /></label>
              <label class="space-y-1 text-xs font-bold text-secondary">Phone number<input type="tel" name="phone" inputmode="tel" pattern="[0-9+\\-\\s]*" oninput="window.app.sanitizePhoneInput(this)" required placeholder="e.g. +60 12-345 6789" class="form-input-premium text-sm min-h-12 font-normal" /></label>
            </div>
            <label class="space-y-1 text-xs font-bold text-secondary block">Delivery address<input type="text" name="address" required placeholder="College block, room, street, postcode" class="form-input-premium text-sm min-h-12 font-normal" /></label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="space-y-1 text-xs font-bold text-secondary">Delivery window<select name="deliveryWindow" required class="form-input-premium text-sm min-h-12 font-normal">
                ${windows.map((item) => `<option value="${S(item.label)}" ${item.label === firstAvailableWindow ? 'selected' : ''} ${item.disabled ? 'disabled class="time-option-disabled"' : ''}>${S(item.label)}${item.disabled ? ' · passed' : ''}</option>`).join('')}
              </select></label>
              <label class="space-y-1 text-xs font-bold text-secondary">Payment method<select name="payment" onchange="window.app.togglePaymentQr(this.value)" required class="form-input-premium text-sm min-h-12 font-normal"><option value="bank">Bank transfer</option><option value="wallet">Digital wallet</option><option value="cod">Cash on delivery</option></select></label>
            </div>
            <div id="payment-qr-panel" class="rounded-xl border border-background-dark bg-background p-4 flex flex-col sm:flex-row gap-4 items-center">
              <img src="/assets/images/sample-qr.png" alt="Sample payment QR" class="w-28 h-28 rounded-lg object-contain bg-white border border-background-dark" />
              <div class="text-sm text-secondary">
                <strong class="text-primary block">Payment QR</strong>
                Shown only for bank transfer or digital wallet. Use this sample QR for judging.
              </div>
            </div>
            <label class="space-y-1 text-xs font-bold text-secondary block">Order notes<textarea name="notes" rows="3" placeholder="Campus pickup notes, pack preference, or reseller batch instructions" class="form-input-premium text-sm font-normal resize-y transition-none"></textarea></label>
            <div class="rounded-xl border border-background-dark bg-background p-4 text-sm text-secondary">
              <strong class="text-primary">Payment confirmation:</strong> placing the order saves a real trackable order in this browser.
            </div>
            <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-background-dark">
              <button type="button" onclick="window.app.switchView('catalog')" class="button-ghost min-h-12">Back to Menu</button>
              <button type="submit" class="button-accent min-h-12" ${hasAvailableWindow ? '' : 'disabled'}>Confirm order (${RM(total)})</button>
            </div>
          </form>
        </main>

        <aside data-reveal class="rounded-2xl border border-background-dark bg-background-card p-5 shadow-premium h-fit">
          <h2 class="font-display text-2xl text-primary">Order summary</h2>
          <div class="space-y-3 mt-4 max-h-[280px] overflow-y-auto pr-1">
            ${cart.map((item) => {
              const meal = store.state.meals.find((m) => m.mealId === item.mealId);
              if (!meal) return '';
              return `
                <div class="flex items-center justify-between gap-3 text-sm">
                  <div class="flex items-center gap-3 min-w-0">
                    <img src="${meal.image}" alt="${meal.mealName}" class="w-12 h-12 rounded-lg object-cover border border-background-dark" />
                    <span class="min-w-0">
                      <span class="block font-bold text-primary line-clamp-1">${meal.mealName}</span>
                      <span class="text-xs text-secondary">Qty ${item.quantity}</span>
                    </span>
                  </div>
                  <span class="font-bold text-primary whitespace-nowrap">${RM(meal.price * item.quantity)}</span>
                </div>
              `;
            }).join('')}
          </div>
          <div class="space-y-2 border-t border-background-dark pt-4 mt-4 text-sm">
            <div class="flex justify-between text-secondary"><span>Subtotal</span><span>${RM(subtotal)}</span></div>
            <div class="flex justify-between text-secondary"><span>Cold-chain delivery</span><span>${RM(deliveryFee)}</span></div>
            <div class="flex justify-between text-lg font-bold text-primary pt-3 border-t border-background-dark"><span>Total</span><span class="font-display">${RM(total)}</span></div>
          </div>
        </aside>
      </div>
    `;
  },

  submitCheckout(formData) {
    const address = sanitizeText(formData.get('address'), 180);
    const name = sanitizeText(formData.get('name'), 80);
    const phone = sanitizePhone(formData.get('phone'));
    const payment = sanitizeText(formData.get('payment'), 40);
    const deliveryWindow = sanitizeText(formData.get('deliveryWindow'), 80);
    const notes = sanitizeText(formData.get('notes'), 300);

    if (!address || !name || !phone || !payment || !deliveryWindow) {
      window.app.showFloatingAlert('Please complete delivery and payment details.', 'info');
      return;
    }

    if (!/^\+?[\d\-\s]{7,}$/.test(phone)) {
      window.app.showFloatingAlert('Enter a valid phone number using digits only.', 'info');
      return;
    }

    const order = store.placeOrder({ address, name, phone, payment, window: deliveryWindow, notes, deliveryFee: 6 });
    if (order) window.app.switchView('tracking');
  },

  renderTracking(container) {
    const activeOrder = store.state.activeOrder;
    if (!activeOrder) {
      container.innerHTML = `
        <div data-reveal class="animate-fade-scroll rounded-2xl border border-background-dark bg-background-card p-10 text-center shadow-premium">
          <h1 class="font-display text-3xl text-primary">No active shipment</h1>
          <p class="text-sm text-secondary mt-2 mb-6">Create an order or search an existing order ID.</p>
          <div class="flex flex-col sm:flex-row justify-center gap-3">
            <button onclick="window.app.switchView('catalog')" class="button-primary min-h-11">Browse Menu</button>
            <button onclick="window.app.switchView('track-order')" class="button-ghost min-h-11">Track by ID</button>
          </div>
        </div>
      `;
      return;
    }

    const tracking = store.state.delivery.find((d) => d.orderId === activeOrder.orderId);
    const meal = orderPrimaryMeal(activeOrder);

    container.innerHTML = `
      <div class="animate-fade-scroll grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <main data-reveal class="rounded-2xl border border-background-dark bg-background-card p-5 md:p-7 shadow-premium space-y-7">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-background-dark pb-5">
            <div>
              <span class="text-xs font-bold uppercase text-accent">Live shipment tracking</span>
              <h1 class="font-display text-4xl text-primary">Order #${S(activeOrder.orderId)}</h1>
            </div>
            <div class="text-left md:text-right">
              <span class="block text-xs text-secondary">Estimated arrival</span>
              <span class="font-display text-2xl text-primary">${tracking ? tracking.estimatedTime : '--:--'}</span>
            </div>
          </div>
          ${renderTrackingStepper(activeOrder.status)}
          ${renderLeafletMap(activeOrder.orderId)}
        </main>

        <aside data-reveal class="space-y-5">
          <div class="rounded-2xl border border-background-dark bg-background-card p-5 shadow-premium">
            <h2 class="font-display text-2xl text-primary">Shipment details</h2>
            <div class="text-sm text-secondary space-y-2 mt-4 leading-relaxed">
              <p><strong class="text-primary">Item:</strong> ${meal ? S(meal.mealName) : 'HotMealBa order'}</p>
              <p><strong class="text-primary">Items:</strong> ${orderLineItems(activeOrder).reduce((sum, item) => sum + Number(item.quantity || 0), 0)} item(s)</p>
              <p><strong class="text-primary">Recipient:</strong> ${S(tracking?.details?.name || 'Guest customer')}</p>
              <p><strong class="text-primary">Phone:</strong> ${S(tracking?.details?.phone || 'Not provided')}</p>
              <p><strong class="text-primary">Address:</strong> ${S(tracking?.details?.address || 'Not provided')}</p>
              <p><strong class="text-primary">Payment:</strong> ${S(tracking?.details?.payment || 'Pending confirmation')}</p>
            </div>
          </div>
          ${activeOrder.status === 'delivered' ? `
            <div class="rounded-2xl border border-success/30 bg-success/10 p-5 shadow-premium space-y-4">
              <h3 class="font-display text-2xl text-primary">How was the order?</h3>
              <form onsubmit="event.preventDefault(); window.app.submitRating('${activeOrder.mealId}', this.rating.value, this.review.value)" class="space-y-3">
                <select name="rating" required class="form-input-premium text-sm min-h-11">
                  <option value="5">5 stars - Excellent</option>
                  <option value="4">4 stars - Good</option>
                  <option value="3">3 stars - Okay</option>
                  <option value="2">2 stars - Needs work</option>
                  <option value="1">1 star - Poor</option>
                </select>
                <textarea name="review" rows="3" required placeholder="Share feedback on taste, packing, or delivery." class="form-input-premium text-sm"></textarea>
                <button type="submit" class="button-primary w-full min-h-11">Submit review</button>
              </form>
            </div>
          ` : `
            <div class="rounded-2xl border border-background-dark bg-background-card p-5 shadow-premium">
              <h3 class="font-display text-2xl text-primary">Next update</h3>
              <p class="text-sm text-secondary mt-2">Admins update status and map location manually from the gateway.</p>
            </div>
          `}
        </aside>
      </div>
    `;

    setTimeout(() => {
      if (tracking) mountLeafletTrackingMap(`tracking-map-${activeOrder.orderId}`, tracking);
    }, 80);
  },

  reviewsList() {
    const notes = store.state.ratings
      .filter((rating) => rating.review)
      .slice(0, 12)
      .map((rating) => {
        const meal = store.state.meals.find((item) => item.mealId === rating.mealId);
        const customer = store.state.customers.find((item) => item.customerId === rating.customerId);
        return {
          ...rating,
          mealName: meal?.mealName || 'HotMealBa Menu',
          customerName: customer?.name || 'HotMealBa customer'
        };
      });
    const fallback = [
      { customerName: 'Aina', mealName: 'HotMealBa Dumplings', rating: 5, review: 'Soft skin, warm filling, and the sauce tastes homemade.' },
      { customerName: 'Wei Ling', mealName: 'Noodle Set', rating: 5, review: 'Easy to order, easy to track, and the food arrived exactly on time.' },
      { customerName: 'Farah', mealName: 'Campus Bundle', rating: 4, review: 'The bundle is neat for sharing after class. Love the clear cart.' }
    ];
    return notes.length ? notes : fallback;
  },

  renderNotes(container) {
    const reviews = this.reviewsList();
    noteIndex = ((noteIndex % reviews.length) + reviews.length) % reviews.length;

    // Cards are built ONCE and persist. Advancing only re-positions them
    // (layoutDeck), so the deck never re-creates DOM and never flickers.
    container.innerHTML = `
      <section class="animate-fade-scroll max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6 items-center">
        <div data-reveal class="rounded-2xl border border-background-dark bg-background-card p-5 md:p-7 shadow-premium">
          <span class="text-xs font-bold uppercase text-accent">Customer reviews</span>
          <h1 class="font-display text-4xl md:text-5xl text-primary mt-2" data-i18n="reviews.title">What customers say</h1>
          <p class="text-sm text-secondary mt-3 leading-relaxed">Flick or drag the card sideways to bring the next review forward. New reviews join here after delivered-order feedback.</p>
          <div class="mt-5 flex gap-3">
            <button onclick="window.app.nextReviewNote()" class="button-accent min-h-11"><span data-i18n="reviews.next">Next review</span></button>
            <button onclick="window.app.switchView('catalog')" class="button-ghost min-h-11"><span data-i18n="home.browse">Browse Menu</span></button>
          </div>
          <p class="text-xs text-secondary mt-4" id="review-counter">${noteIndex + 1} / ${reviews.length}</p>
        </div>
        <div class="review-deck" id="review-deck" role="group" aria-label="Customer reviews, swipe to advance">
          ${reviews.map((note, index) => `
            <article class="review-card" data-index="${index}">
              <div class="relative z-[1]">
                <div class="flex items-center justify-between gap-3 border-b border-background-dark/70 pb-4">
                  <div class="min-w-0">
                    <p class="font-display text-2xl text-primary truncate">${S(note.customerName)}</p>
                    <p class="text-xs text-secondary truncate">${S(note.mealName)}</p>
                  </div>
                  <span class="flex flex-shrink-0">${renderRatingStars(note.rating)}</span>
                </div>
                <p class="mt-6 text-xl md:text-2xl leading-relaxed text-primary">"${S(note.review)}"</p>
                <p class="mt-6 text-[11px] uppercase tracking-wide text-secondary/70 font-bold">Swipe / flick to see more</p>
              </div>
              <span class="review-gloss"></span>
            </article>
          `).join('')}
        </div>
      </section>
    `;

    // Mount synchronously - the cards exist as soon as innerHTML is set, so we do
    // not depend on requestAnimationFrame (which is throttled in background tabs).
    this.mountReviewDeck();
  },

  layoutDeck(snapCard = null) {
    const cards = this._reviewCards || [];
    const n = cards.length;
    if (!n) return;
    const settle = 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease';
    cards.forEach((card, i) => {
      const offset = (i - noteIndex + n) % n;
      const depth = Math.min(offset, 4);
      const scale = 1 - depth * 0.05;
      const ty = depth * 18;
      const rot = offset === 0 ? 0 : (offset % 2 ? 2.6 : -2.6);
      // The card being snapped to the rear jumps without animating, so it does
      // not visibly fly back across the screen after a flick.
      card.style.transition = card === snapCard ? 'none' : settle;
      card.style.transform = `translateY(${ty}px) scale(${scale}) rotate(${rot}deg)`;
      card.style.opacity = offset <= 3 ? (offset === 0 ? '1' : '0.9') : '0';
      card.style.zIndex = `${50 - offset}`;
      card.style.pointerEvents = offset === 0 ? 'auto' : 'none';
      card.style.cursor = offset === 0 ? 'grab' : 'default';
      card.classList.toggle('is-top', offset === 0);
    });
    if (snapCard) requestAnimationFrame(() => { snapCard.style.transition = settle; });
    const counter = document.getElementById('review-counter');
    if (counter) counter.textContent = `${noteIndex + 1} / ${n}`;
  },

  advanceReview(snapCard = null) {
    const n = (this._reviewCards || []).length;
    if (!n) return;
    noteIndex = (noteIndex + 1) % n;
    this.layoutDeck(snapCard);
  },

  mountReviewDeck() {
    const deck = document.getElementById('review-deck');
    if (!deck) return;
    this._reviewCards = Array.from(deck.querySelectorAll('.review-card'));
    this.layoutDeck();
    if (deck.dataset.bound === '1') return;
    deck.dataset.bound = '1';

    let startX = 0, startY = 0, dx = 0, dragging = false, locked = false, front = null;

    const onDown = (e) => {
      front = this._reviewCards[noteIndex];
      if (!front) return;
      dragging = true; locked = false; dx = 0;
      startX = e.clientX; startY = e.clientY;
      front.style.transition = 'none';
      deck.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging || !front) return;
      dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!locked) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        locked = Math.abs(dx) >= Math.abs(dy);
        if (!locked) { dragging = false; this.layoutDeck(); return; }
      }
      front.style.transform = `translateX(${dx}px) rotate(${dx * 0.05}deg)`;
      front.style.opacity = `${Math.max(0.45, 1 - Math.abs(dx) / 620)}`;
    };
    const finish = () => {
      if (!dragging || !front) return;
      dragging = false;
      const moved = Math.abs(dx);
      const flicked = front;
      if (moved < 6) {
        this.layoutDeck();                       // a tap: nothing to do
      } else if (moved > 90) {
        const dir = dx > 0 ? 1 : -1;
        flicked.style.transition = 'transform 0.34s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.34s ease';
        flicked.style.transform = `translateX(${dir * 680}px) rotate(${dir * 16}deg)`;
        flicked.style.opacity = '0';
        setTimeout(() => this.advanceReview(flicked), 320);  // snap flicked card to rear
      } else {
        this.layoutDeck();                       // not far enough: spring back
      }
      dx = 0;
    };

    deck.addEventListener('pointerdown', onDown);
    deck.addEventListener('pointermove', onMove);
    deck.addEventListener('pointerup', finish);
    deck.addEventListener('pointercancel', finish);
  },

  renderApplyJob(container) {
    container.innerHTML = `
      <div class="animate-fade-scroll space-y-6">
        <section data-reveal class="rounded-2xl border border-background-dark bg-primary p-6 md:p-8 text-background shadow-premium">
          <span class="text-xs font-bold uppercase text-background/70">Student reseller program</span>
          <h1 class="font-display text-4xl md:text-6xl text-background leading-none mt-2">Earn with frozen dumpling orders</h1>
          <p class="text-sm md:text-base text-background/75 max-w-2xl mt-4">Collect orders from classmates, submit batches through HotMealBa, and let the kitchen handle fulfillment.</p>
        </section>
        <div class="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
          <aside data-reveal class="space-y-4">
            ${[
              ['Flexible income', 'Sell around your class schedule with simple weekly batches.'],
              ['No kitchen needed', 'You collect orders; HotMealBa prepares and ships for you.'],
              ['Campus network', 'Offer sampler boxes, sauces, and party trays to friends and clubs.'],
              ['Clear margins', 'Reseller cases are designed for repeatable student-side revenue.']
            ].map(([title, body]) => `
              <div class="rounded-2xl border border-background-dark bg-background-card p-5 shadow-premium">
                <h2 class="font-display text-2xl text-primary">${title}</h2>
                <p class="text-sm text-secondary mt-2 leading-relaxed">${body}</p>
              </div>
            `).join('')}
          </aside>
          <main data-reveal class="rounded-2xl border border-background-dark bg-background-card p-5 md:p-7 shadow-premium">
            <h2 class="font-display text-3xl text-primary">Student reseller application</h2>
            <form id="applyJobForm" onsubmit="event.preventDefault(); window.app.submitApplication(new FormData(this))" class="space-y-4 mt-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label class="space-y-1 text-xs font-bold text-secondary">Full name<input type="text" name="fullName" required placeholder="e.g. Ahmad bin Abdullah" class="form-input-premium text-sm min-h-12 font-normal" /></label>
                <label class="space-y-1 text-xs font-bold text-secondary">Student ID<input type="text" name="studentId" required placeholder="e.g. A21CS1234" class="form-input-premium text-sm min-h-12 font-normal" /></label>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label class="space-y-1 text-xs font-bold text-secondary">University<input type="text" name="university" required placeholder="e.g. Universiti Teknologi Malaysia" class="form-input-premium text-sm min-h-12 font-normal" /></label>
                <label class="space-y-1 text-xs font-bold text-secondary">Faculty / department<input type="text" name="faculty" required placeholder="e.g. Faculty of Computing" class="form-input-premium text-sm min-h-12 font-normal" /></label>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label class="space-y-1 text-xs font-bold text-secondary">Email<input type="email" name="email" required placeholder="student@university.edu" class="form-input-premium text-sm min-h-12 font-normal" /></label>
                <label class="space-y-1 text-xs font-bold text-secondary">Phone<input type="tel" name="phone" inputmode="tel" pattern="[0-9+\\-\\s]*" oninput="window.app.sanitizePhoneInput(this)" required placeholder="+60 12-345 6789" class="form-input-premium text-sm min-h-12 font-normal" /></label>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label class="space-y-1 text-xs font-bold text-secondary">Expected weekly orders<input type="number" name="weeklyOrders" min="1" required placeholder="e.g. 25" class="form-input-premium text-sm min-h-12 font-normal" /></label>
                <label class="space-y-1 text-xs font-bold text-secondary">Preferred area<input type="text" name="area" required placeholder="Campus, hostel, or city area" class="form-input-premium text-sm min-h-12 font-normal" /></label>
              </div>
              <label class="space-y-1 text-xs font-bold text-secondary block">Campus selling plan<textarea name="motivation" rows="4" required placeholder="Tell us how you will collect orders, promote packs, and manage pickup or delivery." class="form-input-premium text-sm font-normal"></textarea></label>
              <label class="flex items-start gap-3 cursor-pointer rounded-xl bg-background border border-background-dark p-4">
                <input type="checkbox" name="agree" required class="accent-accent mt-1" />
                <span class="text-xs text-secondary leading-relaxed">I confirm that I am a registered student and agree to the reseller program terms.</span>
              </label>
              <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-background-dark">
                <button type="button" onclick="window.app.switchView('home')" class="button-ghost min-h-12">Cancel</button>
                <button type="submit" class="button-accent min-h-12">Submit application</button>
              </div>
            </form>
          </main>
        </div>
      </div>
    `;
  },

  submitApplication(formData) {
    const application = {
      fullName: sanitizeText(formData.get('fullName'), 80),
      studentId: sanitizeText(formData.get('studentId'), 40),
      university: sanitizeText(formData.get('university'), 120),
      faculty: sanitizeText(formData.get('faculty'), 120),
      email: sanitizeText(formData.get('email'), 120),
      phone: sanitizePhone(formData.get('phone')),
      weeklyOrders: sanitizeText(formData.get('weeklyOrders'), 8),
      area: sanitizeText(formData.get('area'), 120),
      motivation: sanitizeText(formData.get('motivation'), 360),
      submittedAt: new Date().toISOString()
    };
    if (!application.phone || !/^\+?[\d\-\s]{7,}$/.test(application.phone)) {
      window.app.showFloatingAlert('Enter a valid phone number using digits only.', 'info');
      return;
    }
    const apps = JSON.parse(localStorage.getItem('hotmealba_applications') || '[]');
    apps.push(application);
    localStorage.setItem('hotmealba_applications', JSON.stringify(apps));
    window.app.showFloatingAlert('Application submitted. The reseller team will contact you soon.', 'success');
    window.app.switchView('home');
  },

  renderTrackOrder(container) {
    const recentOrders = store.state.orders.slice(0, 8).map((order) => ({
      ...order,
      meal: orderPrimaryMeal(order)
    }));

    let resultHtml = '';
    if (trackOrderResult) {
      if (trackOrderResult.order) {
        const { order, tracking, meal, customer } = trackOrderResult;
        resultHtml = `
          <div data-reveal class="rounded-2xl border border-background-dark bg-background-card p-5 md:p-7 shadow-premium space-y-6 animate-slide-up">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-background-dark pb-5">
              <div>
                <span class="text-xs font-bold uppercase text-accent">Order found</span>
                <h2 class="font-display text-3xl text-primary">#${order.orderId}</h2>
              </div>
              <span class="px-3 py-1.5 rounded-lg text-xs font-bold border ${statusColors[order.status] || 'bg-background text-secondary border-background-dark'}">${statusLabels[order.status] || order.status}</span>
            </div>
            ${renderTrackingStepper(order.status)}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-background-dark pt-4">
              <div class="rounded-xl bg-background border border-background-dark p-4 text-sm text-secondary space-y-2">
                <h3 class="font-display text-xl text-primary">Order details</h3>
                <p><strong class="text-primary">Item:</strong> ${meal ? S(meal.mealName) : 'N/A'}</p>
                <p><strong class="text-primary">Quantity:</strong> ${order.quantity}</p>
                <p><strong class="text-primary">Amount:</strong> ${RM(order.amount)}</p>
                <p><strong class="text-primary">Date:</strong> ${new Date(order.orderDate).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div class="rounded-xl bg-background border border-background-dark p-4 text-sm text-secondary space-y-2">
                <h3 class="font-display text-xl text-primary">Shipment</h3>
                <p><strong class="text-primary">Customer:</strong> ${S(customer ? customer.name : tracking?.details?.name || 'Guest')}</p>
                <p><strong class="text-primary">ETA:</strong> ${tracking ? tracking.estimatedTime : 'N/A'}</p>
                <p><strong class="text-primary">Courier:</strong> ${tracking ? tracking.driverName : 'N/A'}</p>
                <p><strong class="text-primary">Contact:</strong> ${tracking ? tracking.driverPhone : 'N/A'}</p>
              </div>
            </div>
          </div>
        `;
      } else {
        resultHtml = `
          <div data-reveal class="rounded-2xl border border-background-dark bg-background-card p-10 text-center shadow-premium">
            <h2 class="font-display text-3xl text-primary">Order not found</h2>
            <p class="text-sm text-secondary mt-2">No order matches "${S(trackOrderResult.query)}". Check the order ID and try again.</p>
          </div>
        `;
      }
    } else {
      resultHtml = `
        <div data-reveal class="rounded-2xl border border-background-dark bg-background-card p-5 shadow-premium">
          <h2 class="font-display text-2xl text-primary mb-4">Recent actual orders</h2>
          <div class="space-y-3">
            ${recentOrders.length === 0 ? `
              <div class="rounded-xl border border-background-dark bg-background p-5 text-sm text-secondary">
                No orders have been saved yet. Place an order, then search the order number or tracking number here.
              </div>
            ` : recentOrders.map((order) => `
              <button onclick="window.app.trackOrderLookup('${order.orderId}')" class="w-full flex items-center justify-between gap-3 p-3 bg-background rounded-xl border border-background-dark hover:border-accent/40 transition-all text-left min-h-[72px]">
                <span class="flex items-center gap-3 min-w-0">
                  ${order.meal ? `<img src="${S(order.meal.image)}" alt="${S(order.meal.mealName)}" class="w-12 h-12 rounded-lg object-cover border border-background-dark" />` : ''}
                  <span class="min-w-0">
                    <span class="block font-bold text-primary">${S(order.orderId)}</span>
                    <span class="block text-xs text-secondary line-clamp-1">${order.meal ? S(order.meal.mealName) : 'HotMealBa order'} - ${RM(order.amount)}</span>
                  </span>
                </span>
                <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold border whitespace-nowrap ${statusColors[order.status] || 'bg-background text-secondary border-background-dark'}">${statusLabels[order.status] || order.status}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <section class="animate-fade-scroll max-w-4xl mx-auto space-y-5">
        <div data-reveal class="rounded-2xl border border-background-dark bg-background-card p-5 md:p-7 shadow-premium text-center">
          <span class="text-xs font-bold uppercase text-accent">Order lookup</span>
          <h1 class="font-display text-4xl md:text-5xl text-primary mt-1">Track your HotMealBa order</h1>
          <p class="text-sm text-secondary mt-2">Enter an order ID or tracking number from a saved order.</p>
          <form onsubmit="event.preventDefault(); window.app.trackOrderLookup(this.orderId.value)" class="mt-5 flex flex-col sm:flex-row gap-3">
            <input type="text" name="orderId" id="trackOrderInput" placeholder="Enter Order ID, e.g. HMB-..." class="form-input-premium text-sm min-h-12 flex-grow" value="${trackOrderResult ? S(trackOrderResult.query) : ''}" />
            <button type="submit" class="button-accent min-h-12 whitespace-nowrap">Track order</button>
          </form>
        </div>
        ${resultHtml}
      </section>
    `;
  },

  trackOrderLookup(query) {
    const q = sanitizeOrderId(query);
    if (!q) {
      window.app.showFloatingAlert('Enter an order ID to track.', 'info');
      return;
    }
    const order = store.state.orders.find((o) => {
      const orderId = o.orderId.toLowerCase();
      const trackingId = String(o.trackingId || '').toLowerCase();
      const lookup = q.toLowerCase();
      return orderId === lookup || trackingId === lookup || orderId.endsWith(lookup) || trackingId.endsWith(lookup);
    });
    const tracking = order ? store.state.delivery.find((d) => d.orderId === order.orderId) : null;
    const meal = order ? orderPrimaryMeal(order) : null;
    const customer = order ? store.state.customers.find((c) => c.customerId === order.customerId) : null;
    trackOrderResult = { query: q, order, tracking, meal, customer };
    if (order) store.setState({ activeOrder: order });
    const container = document.getElementById('view-container');
    if (store.state.activeView === 'track-order' && container) this.renderTrackOrder(container);
  },

  nextReviewNote() {
    // If the deck is mounted, advance by re-laying-out (no rebuild = no flicker).
    if (this._reviewCards && this._reviewCards.length && store.state.activeView === 'notes' && document.getElementById('review-deck')) {
      this.advanceReview();
      return;
    }
    const noteCount = Math.max(1, this.reviewsList().length);
    noteIndex = (noteIndex + 1) % noteCount;
    const container = document.getElementById('view-container');
    if (store.state.activeView === 'notes' && container) this.renderNotes(container);
  }
};

window.app = window.app || {};
window.app.setCatalogCategory = customerViews.setCatalogCategory.bind(customerViews);
window.app.catalogSort = customerViews.catalogSort.bind(customerViews);
window.app.catalogSearch = customerViews.catalogSearch.bind(customerViews);
window.app.catalogPage = customerViews.catalogPage.bind(customerViews);
window.app.submitCheckout = customerViews.submitCheckout.bind(customerViews);
window.app.submitApplication = customerViews.submitApplication.bind(customerViews);
window.app.trackOrderLookup = customerViews.trackOrderLookup.bind(customerViews);
window.app.nextReviewNote = customerViews.nextReviewNote.bind(customerViews);
window.app.setMealTab = customerViews.setMealTab.bind(customerViews);
window.app.setMealQty = customerViews.setMealQty.bind(customerViews);
