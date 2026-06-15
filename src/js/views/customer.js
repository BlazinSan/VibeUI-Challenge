// customer.js - Customer screens for Dumpling Desk

import { store } from '../store.js';
import { dataLoader } from '../data-loader.js';
import { renderMealCard, renderCategoryChips, renderRatingStars } from '../components/cards.js';
import { renderPagination } from '../components/table.js';
import { renderTrackingStepper, renderMockMap } from '../components/tracking.js';

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
  cooking: 'Frozen packs prepared',
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

let trackOrderResult = null;

function orderLineItems(order) {
  if (order?.lineItems?.length) return order.lineItems;
  const meal = store.state.meals.find((m) => m.mealId === order?.mealId);
  return meal ? [{ mealId: meal.mealId, quantity: order.quantity || 1 }] : [];
}

function orderPrimaryMeal(order) {
  const first = orderLineItems(order)[0];
  return first ? store.state.meals.find((m) => m.mealId === first.mealId) : null;
}

export const customerViews = {
  renderHome(container) {
    const featuredMeals = [...store.state.meals]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);

    const discountedMeals = store.state.meals
      .filter((meal) => ['Dumpling Packs', 'Sampler Boxes', 'Reseller Cases'].includes(meal.category))
      .slice(0, 3);

    const recentOrders = store.state.orders.slice(0, 3).map((order) => ({
      ...order,
      meal: orderPrimaryMeal(order)
    }));

    container.innerHTML = `
      <div class="space-y-10 animate-fade-scroll">
        <section class="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5 items-stretch">
          <div class="bg-background-card border border-background-dark rounded-lg shadow-premium p-5 md:p-7 flex flex-col gap-6">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div class="rounded-lg border border-background-dark bg-background px-4 py-3">
                <span class="block font-bold text-primary">Orders open</span>
                <span class="text-secondary">10 AM - 6 PM today</span>
              </div>
              <div class="rounded-lg border border-background-dark bg-background px-4 py-3">
                <span class="block font-bold text-primary">Payment</span>
                <span class="text-secondary">Transfer, wallet, or COD</span>
              </div>
              <div class="rounded-lg border border-background-dark bg-background px-4 py-3">
                <span class="block font-bold text-primary">Shipment</span>
                <span class="text-secondary">Frozen packs to your address</span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6 items-end">
              <div class="space-y-5">
                <span class="text-xs font-bold uppercase text-accent">Campus frozen dumpling orders</span>
                <h1 class="font-display text-5xl md:text-6xl lg:text-7xl leading-none text-primary">
                  Dumpling Desk
                </h1>
                <p class="text-sm md:text-base text-secondary leading-relaxed max-w-2xl">
                  Stock your freezer, collect campus orders, or build a student side income with ready-to-ship dumpling packs.
                </p>
                <div class="flex flex-col sm:flex-row gap-3">
                  <button onclick="window.app.switchView('catalog')" class="button-accent min-h-12">Order packs</button>
                  <button onclick="window.app.switchView('apply')" class="button-ghost min-h-12">Become a reseller</button>
                </div>
              </div>
              <div class="relative min-h-[220px] rounded-lg overflow-hidden border border-background-dark bg-background">
                <img src="https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=900&auto=format&fit=crop&q=85" alt="Frozen dumpling tray" class="absolute inset-0 h-full w-full object-cover" />
                <div class="absolute left-3 bottom-3 rounded-lg bg-background-card/95 border border-background-dark px-3 py-2 text-xs shadow-premium">
                  <span class="block font-bold text-primary">Starter bundle</span>
                  <span class="text-secondary">48 pcs + 2 sauces</span>
                </div>
              </div>
            </div>
          </div>

          <aside class="grid grid-cols-1 gap-4">
            <div class="rounded-lg border border-background-dark bg-primary p-5 text-background shadow-premium">
              <span class="text-xs uppercase text-background/70">Today only</span>
              <h2 class="font-display text-3xl text-background mt-1">15% off campus bundles</h2>
              <p class="text-sm text-background/70 mt-2">Discounted packs are ready above the fold so ordering starts quickly.</p>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="rounded-lg border border-background-dark bg-background-card p-4">
                <span class="font-display text-2xl text-primary">${store.state.orders.length}+</span>
                <span class="block text-[11px] text-secondary">orders</span>
              </div>
              <div class="rounded-lg border border-background-dark bg-background-card p-4">
                <span class="font-display text-2xl text-primary">${store.state.customers.length}+</span>
                <span class="block text-[11px] text-secondary">customers</span>
              </div>
              <div class="rounded-lg border border-background-dark bg-background-card p-4">
                <span class="font-display text-2xl text-primary">Live</span>
                <span class="block text-[11px] text-secondary">tracking</span>
              </div>
            </div>
          </aside>
        </section>

        <section class="section-reveal" style="animation-delay:80ms">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
            <div>
              <span class="text-xs font-bold uppercase text-accent">Discounted quick picks</span>
              <h2 class="font-display text-3xl md:text-4xl text-primary">Featured freezer packs</h2>
            </div>
            <button onclick="window.app.switchView('catalog')" class="button-ghost min-h-11">View all packs</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${discountedMeals.map((meal, index) => `
              <button onclick="window.app.addToCart('${meal.mealId}')" class="group min-h-[148px] text-left rounded-lg bg-background-card border border-background-dark p-4 shadow-premium hover:shadow-premium-hover transition-all flex gap-4">
                <img src="${meal.image}" alt="${meal.mealName}" class="w-24 h-24 rounded-lg object-cover border border-background-dark flex-shrink-0" />
                <span class="min-w-0 flex flex-col justify-between">
                  <span>
                    <span class="text-[11px] font-bold text-accent uppercase">Save ${15 - index * 2}%</span>
                    <span class="block font-display text-xl text-primary leading-tight line-clamp-2">${meal.mealName}</span>
                    <span class="block text-xs text-secondary mt-1">${meal.packSize || meal.category}</span>
                  </span>
                  <span class="font-bold text-primary">${RM(meal.price)}</span>
                </span>
              </button>
            `).join('')}
          </div>
        </section>

        <section class="section-reveal" style="animation-delay:140ms">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <span class="text-xs font-bold uppercase text-accent">Menu board</span>
              <h2 class="font-display text-3xl md:text-4xl text-primary">Browse by order type</h2>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 pb-2">
            ${renderCategoryChips(CATEGORIES, 'All', 'setCatalogCategory')}
          </div>
        </section>

        <section class="section-reveal" style="animation-delay:200ms">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
            <div>
              <span class="text-xs font-bold uppercase text-accent">Best rated</span>
              <h2 class="font-display text-3xl md:text-4xl text-primary">Popular dumpling packs</h2>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${featuredMeals.map((meal) => renderMealCard(meal)).join('')}
          </div>
        </section>

        <section class="section-reveal grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-5" style="animation-delay:260ms">
          <div class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium">
            <span class="text-xs font-bold uppercase text-accent">Fast reorder</span>
            <h2 class="font-display text-3xl text-primary mt-1">Repeat a recent pack</h2>
            <p class="text-sm text-secondary mt-2">Recent simulated orders stay one tap away for quick-pick ordering.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            ${recentOrders.map((order) => {
              if (!order.meal) return '';
              return `
                <button onclick="window.app.addToCart('${order.meal.mealId}')" class="text-left rounded-lg border border-background-dark bg-background-card p-4 hover:border-accent/40 transition-all min-h-[116px]">
                  <span class="flex items-center gap-3">
                    <img src="${order.meal.image}" alt="${order.meal.mealName}" class="w-14 h-14 rounded-lg object-cover border border-background-dark" />
                    <span class="min-w-0">
                      <span class="font-display text-lg text-primary line-clamp-1">${order.meal.mealName}</span>
                      <span class="text-xs text-secondary">${RM(order.meal.price)} - add again</span>
                    </span>
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </section>

        <section class="section-reveal rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium" style="animation-delay:320ms">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            ${[
              ['01', 'Choose packs', 'Pick frozen packs, sauces, or reseller cases.'],
              ['02', 'Add address', 'Enter delivery details and notes before confirmation.'],
              ['03', 'Confirm payment', 'Select transfer, wallet, or COD simulation.'],
              ['04', 'Track shipment', 'Watch the order move through clear shipment stages.']
            ].map(([num, title, body]) => `
              <div class="rounded-lg border border-background-dark bg-background p-4">
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
      <div class="animate-fade-scroll space-y-6">
        <section class="rounded-lg border border-background-dark bg-background-card p-5 md:p-6 shadow-premium">
          <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <span class="text-xs font-bold uppercase text-accent">Pack menu</span>
              <h1 class="font-display text-4xl md:text-5xl text-primary">Frozen dumpling board</h1>
              <p class="text-sm text-secondary mt-2 max-w-2xl">Search packs, compare prices, and add items without losing your place.</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div class="rounded-lg bg-background border border-background-dark px-3 py-2"><strong class="text-primary">${results.total}</strong><span class="block text-secondary">visible</span></div>
              <div class="rounded-lg bg-background border border-background-dark px-3 py-2"><strong class="text-primary">${store.state.orders.length}</strong><span class="block text-secondary">orders</span></div>
              <div class="rounded-lg bg-background border border-background-dark px-3 py-2"><strong class="text-primary">50</strong><span class="block text-secondary">packs</span></div>
              <div class="rounded-lg bg-background border border-background-dark px-3 py-2"><strong class="text-primary">RM</strong><span class="block text-secondary">pricing</span></div>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          <aside class="space-y-4">
            <div class="rounded-lg border border-background-dark bg-background-card p-4 shadow-premium space-y-4">
              <div>
                <label for="catalogSearch" class="text-xs font-bold uppercase text-secondary">Search</label>
                <div class="relative mt-2">
                  <input id="catalogSearch" value="${catalogFilters.search}" oninput="window.app.catalogSearch(this.value)" placeholder="Search dumplings, sauce, case..." class="form-input-premium text-sm pl-10 min-h-11" />
                  <svg class="w-4 h-4 text-secondary/50 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
              </div>
              <div>
                <span class="text-xs font-bold uppercase text-secondary">Category</span>
                <div class="mt-2 grid grid-cols-2 lg:grid-cols-1 gap-2">
                  ${CATEGORIES.map((cat) => {
                    const isActive = cat === catalogFilters.category;
                    return `
                      <button onclick="window.app.setCatalogCategory('${cat}')" class="min-h-10 text-left px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${isActive ? 'bg-primary text-background border-primary' : 'bg-background text-secondary border-background-dark hover:border-accent/40'}">
                        ${cat}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
              <div>
                <label class="text-xs font-bold uppercase text-secondary">Sort</label>
                <select onchange="window.app.catalogSort(this.value)" class="form-input-premium text-sm mt-2 min-h-11">
                  <option value="rating" ${catalogFilters.sortBy === 'rating' ? 'selected' : ''}>Best rated</option>
                  <option value="name" ${catalogFilters.sortBy === 'name' ? 'selected' : ''}>A to Z</option>
                  <option value="price-asc" ${catalogFilters.sortBy === 'price-asc' ? 'selected' : ''}>Price: low to high</option>
                  <option value="price-desc" ${catalogFilters.sortBy === 'price-desc' ? 'selected' : ''}>Price: high to low</option>
                </select>
              </div>
            </div>
          </aside>

          <main>
            ${results.items.length === 0 ? `
              <div class="rounded-lg border border-background-dark bg-background-card p-10 text-center shadow-premium">
                <h2 class="font-display text-2xl text-primary">No packs found</h2>
                <p class="text-sm text-secondary mt-2">Try another search or category.</p>
              </div>
            ` : `
              <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                ${results.items.map((meal) => renderMealCard(meal)).join('')}
              </div>
              ${renderPagination(results.page, results.totalPages, 'catalogPage')}
            `}
          </main>
        </div>
      </div>
    `;
  },

  setCatalogCategory(cat) {
    catalogFilters.category = cat;
    catalogFilters.page = 1;
    this.refreshCatalog();
  },

  catalogSort(sortBy) {
    catalogFilters.sortBy = sortBy;
    catalogFilters.page = 1;
    this.refreshCatalog();
  },

  catalogSearch(search) {
    catalogFilters.search = search;
    catalogFilters.page = 1;
    this.refreshCatalog();
  },

  catalogPage(page) {
    catalogFilters.page = page;
    this.refreshCatalog();
  },

  refreshCatalog() {
    const container = document.getElementById('view-container');
    if (store.state.activeView === 'catalog' && container) this.renderCatalog(container);
  },

  renderMealDetails(mealId) {
    const meal = store.state.meals.find((m) => m.mealId === mealId);
    if (!meal) return '';
    const reviews = dataLoader.getMealRatings(mealId);

    return `
      <div class="relative bg-background-card rounded-lg max-w-4xl w-full mx-4 overflow-hidden border border-background-dark shadow-2xl flex flex-col md:flex-row max-h-[90vh] animate-slide-up">
        <div class="w-full md:w-1/2 aspect-video md:aspect-auto bg-background">
          <img src="${meal.image}" alt="${meal.mealName}" class="w-full h-full object-cover" />
        </div>
        <div class="w-full md:w-1/2 p-5 md:p-7 overflow-y-auto">
          <button onclick="window.app.closeMealDetails()" class="absolute top-4 right-4 bg-background-card border border-background-dark p-2 rounded-lg text-primary hover:text-accent transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div class="pr-8">
            <span class="text-xs font-bold uppercase text-accent">${meal.category}</span>
            <h2 class="font-display text-3xl text-primary mt-1">${meal.mealName}</h2>
            <div class="flex items-center gap-2 mt-2">
              <div class="flex">${renderRatingStars(meal.rating)}</div>
              <span class="text-xs font-bold text-primary">${meal.rating.toFixed(1)}</span>
              <span class="text-xs text-secondary">(${reviews.length} reviews)</span>
            </div>
          </div>
          <p class="text-sm text-secondary leading-relaxed mt-5">${meal.description}</p>
          <div class="grid grid-cols-2 gap-3 my-5">
            <div class="rounded-lg bg-background border border-background-dark p-3">
              <span class="text-[11px] text-secondary">Pack size</span>
              <span class="block font-bold text-primary">${meal.packSize || `${meal.prepTime} pcs`}</span>
            </div>
            <div class="rounded-lg bg-background border border-background-dark p-3">
              <span class="text-[11px] text-secondary">Freezer life</span>
              <span class="block font-bold text-primary">${meal.freezerLife || 'Up to 30 days'}</span>
            </div>
          </div>
          <div>
            <h3 class="text-xs font-bold uppercase text-secondary mb-2">Filling and notes</h3>
            <div class="flex flex-wrap gap-2">
              ${meal.ingredients.map((ing) => `<span class="bg-background text-secondary text-xs px-3 py-1 rounded-lg border border-background-dark font-semibold">${ing}</span>`).join('')}
            </div>
          </div>
          <div class="space-y-3 mt-5">
            <h3 class="text-xs font-bold uppercase text-secondary">Student feedback</h3>
            <div class="space-y-3 max-h-[150px] overflow-y-auto pr-1">
              ${reviews.length === 0 ? `<p class="text-xs text-secondary italic">No reviews yet.</p>` : reviews.slice(0, 3).map((rev) => `
                <div class="bg-background border border-background-dark rounded-lg p-3">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-bold text-primary">${rev.customerName}</span>
                    <span class="flex">${renderRatingStars(rev.rating)}</span>
                  </div>
                  <p class="text-xs text-secondary mt-1 leading-relaxed">"${rev.review}"</p>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="flex items-center justify-between border-t border-background-dark pt-5 mt-6">
            <div>
              <span class="text-xs text-secondary">Unit price</span>
              <span class="block font-display text-2xl text-primary">${RM(meal.price)}</span>
            </div>
            <button onclick="window.app.addToCart('${meal.mealId}'); window.app.closeMealDetails();" class="button-accent min-h-11">Add to basket</button>
          </div>
        </div>
      </div>
    `;
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
          <p class="font-display text-2xl text-primary mb-1">Basket is empty</p>
          <p class="text-xs text-secondary">Add frozen packs from the menu board.</p>
        </div>
      `;
      footerContainer.innerHTML = `<button onclick="window.app.closeCartDrawer(); window.app.switchView('catalog');" class="w-full button-primary min-h-12">Browse packs</button>`;
      return;
    }

    drawerContainer.innerHTML = cart.map((item) => {
      const meal = store.state.meals.find((m) => m.mealId === item.mealId);
      if (!meal) return '';
      return `
        <div class="flex items-center gap-3 p-3 bg-background rounded-lg border border-background-dark">
          <img src="${meal.image}" alt="${meal.mealName}" class="w-16 h-16 rounded-lg object-cover border border-background-dark" />
          <div class="flex-grow min-w-0">
            <h4 class="font-display text-lg text-primary truncate">${meal.mealName}</h4>
            <span class="text-xs text-secondary block mb-2">${RM(meal.price)}</span>
            <div class="flex items-center gap-3">
              <button onclick="window.app.updateCartQuantity('${meal.mealId}', ${item.quantity - 1})" class="w-9 h-9 bg-background-card border border-background-dark rounded-lg text-primary hover:border-accent/40 transition-all flex items-center justify-center cursor-pointer text-base font-bold active:scale-90">-</button>
              <span class="text-sm font-bold text-primary w-5 text-center">${item.quantity}</span>
              <button onclick="window.app.updateCartQuantity('${meal.mealId}', ${item.quantity + 1})" class="w-9 h-9 bg-background-card border border-background-dark rounded-lg text-primary hover:border-accent/40 transition-all flex items-center justify-center cursor-pointer text-base font-bold active:scale-90">+</button>
            </div>
          </div>
          <button onclick="window.app.removeFromCart('${meal.mealId}')" class="text-secondary hover:text-danger p-2 rounded-lg hover:bg-danger/5 transition-colors cursor-pointer" aria-label="Remove item">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79"/></svg>
          </button>
        </div>
      `;
    }).join('');

    const subtotal = store.getCartTotal();
    const deliveryFee = 6;
    const total = subtotal + deliveryFee;
    footerContainer.innerHTML = `
      <div class="space-y-2.5 mb-5 text-sm">
        <div class="flex items-center justify-between text-secondary"><span>Subtotal</span><span>${RM(subtotal)}</span></div>
        <div class="flex items-center justify-between text-secondary"><span>Cold-chain delivery</span><span>${RM(deliveryFee)}</span></div>
        <div class="flex items-center justify-between text-base font-bold text-primary pt-3 border-t border-background-dark"><span>Total</span><span class="font-display">${RM(total)}</span></div>
      </div>
      <button onclick="window.app.switchView('checkout'); window.app.closeCartDrawer();" class="w-full button-accent min-h-12">Proceed to checkout</button>
    `;
  },

  renderCheckout(container) {
    const cart = store.state.cart;
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="animate-fade-scroll rounded-lg border border-background-dark bg-background-card p-10 text-center shadow-premium">
          <h1 class="font-display text-3xl text-primary">Checkout needs a basket</h1>
          <p class="text-sm text-secondary mt-2 mb-6">Add at least one dumpling pack before confirming delivery.</p>
          <button onclick="window.app.switchView('catalog')" class="button-primary min-h-11">Explore packs</button>
        </div>
      `;
      return;
    }

    const subtotal = store.getCartTotal();
    const deliveryFee = 6;
    const total = subtotal + deliveryFee;

    container.innerHTML = `
      <div class="animate-fade-scroll grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        <main class="rounded-lg border border-background-dark bg-background-card p-5 md:p-7 shadow-premium">
          <span class="text-xs font-bold uppercase text-accent">Delivery and payment</span>
          <h1 class="font-display text-4xl text-primary mt-1">Confirm your frozen pack order</h1>
          <p class="text-sm text-secondary mt-2">Shipment will be arranged after payment confirmation.</p>
          <form id="checkoutForm" onsubmit="event.preventDefault(); window.app.submitCheckout(new FormData(this))" class="space-y-5 mt-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="space-y-1 text-xs font-bold text-secondary">Full name<input type="text" name="name" required placeholder="e.g. Nur Aina" class="form-input-premium text-sm min-h-12 font-normal" /></label>
              <label class="space-y-1 text-xs font-bold text-secondary">Phone number<input type="tel" name="phone" required placeholder="e.g. +60 12-345 6789" class="form-input-premium text-sm min-h-12 font-normal" /></label>
            </div>
            <label class="space-y-1 text-xs font-bold text-secondary block">Delivery address<input type="text" name="address" required placeholder="College block, room, street, postcode" class="form-input-premium text-sm min-h-12 font-normal" /></label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="space-y-1 text-xs font-bold text-secondary">Delivery window<select name="deliveryWindow" required class="form-input-premium text-sm min-h-12 font-normal"><option>Today, 4 PM - 7 PM</option><option>Tomorrow, 10 AM - 1 PM</option><option>Tomorrow, 2 PM - 6 PM</option></select></label>
              <label class="space-y-1 text-xs font-bold text-secondary">Payment method<select name="payment" required class="form-input-premium text-sm min-h-12 font-normal"><option value="bank">Bank transfer</option><option value="wallet">Digital wallet</option><option value="cod">Cash on delivery</option></select></label>
            </div>
            <label class="space-y-1 text-xs font-bold text-secondary block">Order notes<textarea name="notes" rows="4" placeholder="Campus pickup notes, freezer pack preference, or reseller batch instructions" class="form-input-premium text-sm font-normal"></textarea></label>
            <div class="rounded-lg border border-background-dark bg-background p-4 text-sm text-secondary">
              <strong class="text-primary">Payment confirmation:</strong> this frontend simulates payment review and immediately creates a trackable order for judging.
            </div>
            <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-background-dark">
              <button type="button" onclick="window.app.switchView('catalog')" class="button-ghost min-h-12">Back to menu</button>
              <button type="submit" class="button-accent min-h-12">Confirm order (${RM(total)})</button>
            </div>
          </form>
        </main>

        <aside class="rounded-lg border border-background-dark bg-background-card p-5 shadow-premium h-fit">
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
    const address = formData.get('address')?.trim();
    const name = formData.get('name')?.trim();
    const phone = formData.get('phone')?.trim();
    const payment = formData.get('payment');
    const deliveryWindow = formData.get('deliveryWindow');
    const notes = formData.get('notes')?.trim();

    if (!address || !name || !phone || !payment) {
      window.app.showFloatingAlert('Please complete delivery and payment details.', 'info');
      return;
    }

    store.placeOrder({ address, name, phone, payment, window: deliveryWindow, notes, deliveryFee: 6 });
  },

  renderTracking(container) {
    const activeOrder = store.state.activeOrder;
    if (!activeOrder) {
      container.innerHTML = `
        <div class="animate-fade-scroll rounded-lg border border-background-dark bg-background-card p-10 text-center shadow-premium">
          <h1 class="font-display text-3xl text-primary">No active shipment</h1>
          <p class="text-sm text-secondary mt-2 mb-6">Create an order or search an existing order ID.</p>
          <div class="flex flex-col sm:flex-row justify-center gap-3">
            <button onclick="window.app.switchView('catalog')" class="button-primary min-h-11">Order packs</button>
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
        <main class="rounded-lg border border-background-dark bg-background-card p-5 md:p-7 shadow-premium space-y-7">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-background-dark pb-5">
            <div>
              <span class="text-xs font-bold uppercase text-accent">Live shipment tracking</span>
              <h1 class="font-display text-4xl text-primary">Order #${activeOrder.orderId.substring(4) || activeOrder.orderId}</h1>
            </div>
            <div class="text-left md:text-right">
              <span class="block text-xs text-secondary">Estimated arrival</span>
              <span class="font-display text-2xl text-primary">${tracking ? tracking.estimatedTime : '--:--'}</span>
            </div>
          </div>
          ${renderTrackingStepper(activeOrder.status)}
          ${renderMockMap(activeOrder.status)}
        </main>

        <aside class="space-y-5">
          <div class="rounded-lg border border-background-dark bg-background-card p-5 shadow-premium">
            <h2 class="font-display text-2xl text-primary">Shipment details</h2>
            <div class="text-sm text-secondary space-y-2 mt-4 leading-relaxed">
              <p><strong class="text-primary">Pack:</strong> ${meal ? meal.mealName : 'Frozen dumpling order'}</p>
              <p><strong class="text-primary">Items:</strong> ${orderLineItems(activeOrder).reduce((sum, item) => sum + Number(item.quantity || 0), 0)} pack(s)</p>
              <p><strong class="text-primary">Recipient:</strong> ${tracking?.details?.name || 'Guest customer'}</p>
              <p><strong class="text-primary">Phone:</strong> ${tracking?.details?.phone || 'Not provided'}</p>
              <p><strong class="text-primary">Address:</strong> ${tracking?.details?.address || 'Not provided'}</p>
              <p><strong class="text-primary">Payment:</strong> ${tracking?.details?.payment || 'Simulated confirmation'}</p>
            </div>
          </div>
          ${activeOrder.status === 'delivered' ? `
            <div class="rounded-lg border border-success/30 bg-success/10 p-5 shadow-premium space-y-4">
              <h3 class="font-display text-2xl text-primary">How was the pack?</h3>
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
            <div class="rounded-lg border border-background-dark bg-background-card p-5 shadow-premium">
              <h3 class="font-display text-2xl text-primary">Next update</h3>
              <p class="text-sm text-secondary mt-2">This simulation advances every 15 seconds after checkout.</p>
            </div>
          `}
        </aside>
      </div>
    `;
  },

  renderApplyJob(container) {
    container.innerHTML = `
      <div class="animate-fade-scroll space-y-6">
        <section class="rounded-lg border border-background-dark bg-primary p-6 md:p-8 text-background shadow-premium">
          <span class="text-xs font-bold uppercase text-background/70">Student reseller program</span>
          <h1 class="font-display text-4xl md:text-6xl text-background leading-none mt-2">Earn with frozen dumpling orders</h1>
          <p class="text-sm md:text-base text-background/75 max-w-2xl mt-4">Collect orders from classmates, submit batches through Dumpling Desk, and let the supplier handle frozen pack fulfillment.</p>
        </section>
        <div class="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
          <aside class="space-y-4">
            ${[
              ['Flexible income', 'Sell around your class schedule with simple weekly batches.'],
              ['No kitchen needed', 'You collect orders; frozen packs are prepared and shipped for you.'],
              ['Campus network', 'Offer sampler boxes, sauces, and party trays to friends and clubs.'],
              ['Clear margins', 'Reseller cases are designed for repeatable student-side revenue.']
            ].map(([title, body]) => `
              <div class="rounded-lg border border-background-dark bg-background-card p-5 shadow-premium">
                <h2 class="font-display text-2xl text-primary">${title}</h2>
                <p class="text-sm text-secondary mt-2 leading-relaxed">${body}</p>
              </div>
            `).join('')}
          </aside>
          <main class="rounded-lg border border-background-dark bg-background-card p-5 md:p-7 shadow-premium">
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
                <label class="space-y-1 text-xs font-bold text-secondary">Phone<input type="tel" name="phone" required placeholder="+60 12-345 6789" class="form-input-premium text-sm min-h-12 font-normal" /></label>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label class="space-y-1 text-xs font-bold text-secondary">Expected weekly orders<input type="number" name="weeklyOrders" min="1" required placeholder="e.g. 25" class="form-input-premium text-sm min-h-12 font-normal" /></label>
                <label class="space-y-1 text-xs font-bold text-secondary">Preferred area<input type="text" name="area" required placeholder="Campus, hostel, or city area" class="form-input-premium text-sm min-h-12 font-normal" /></label>
              </div>
              <label class="space-y-1 text-xs font-bold text-secondary block">Campus selling plan<textarea name="motivation" rows="4" required placeholder="Tell us how you will collect orders, promote packs, and manage pickup or delivery." class="form-input-premium text-sm font-normal"></textarea></label>
              <label class="flex items-start gap-3 cursor-pointer rounded-lg bg-background border border-background-dark p-4">
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
      fullName: formData.get('fullName'),
      studentId: formData.get('studentId'),
      university: formData.get('university'),
      faculty: formData.get('faculty'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      weeklyOrders: formData.get('weeklyOrders'),
      area: formData.get('area'),
      motivation: formData.get('motivation'),
      submittedAt: new Date().toISOString()
    };
    const apps = JSON.parse(localStorage.getItem('dumplingdesk_applications') || '[]');
    apps.push(application);
    localStorage.setItem('dumplingdesk_applications', JSON.stringify(apps));
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
          <div class="rounded-lg border border-background-dark bg-background-card p-5 md:p-7 shadow-premium space-y-6 animate-slide-up">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-background-dark pb-5">
              <div>
                <span class="text-xs font-bold uppercase text-accent">Order found</span>
                <h2 class="font-display text-3xl text-primary">#${order.orderId}</h2>
              </div>
              <span class="px-3 py-1.5 rounded-lg text-xs font-bold border ${statusColors[order.status] || 'bg-background text-secondary border-background-dark'}">${statusLabels[order.status] || order.status}</span>
            </div>
            ${renderTrackingStepper(order.status)}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-background-dark pt-4">
              <div class="rounded-lg bg-background border border-background-dark p-4 text-sm text-secondary space-y-2">
                <h3 class="font-display text-xl text-primary">Order details</h3>
                <p><strong class="text-primary">Pack:</strong> ${meal ? meal.mealName : 'N/A'}</p>
                <p><strong class="text-primary">Quantity:</strong> ${order.quantity}</p>
                <p><strong class="text-primary">Amount:</strong> ${RM(order.amount)}</p>
                <p><strong class="text-primary">Date:</strong> ${new Date(order.orderDate).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div class="rounded-lg bg-background border border-background-dark p-4 text-sm text-secondary space-y-2">
                <h3 class="font-display text-xl text-primary">Shipment</h3>
                <p><strong class="text-primary">Customer:</strong> ${customer ? customer.name : 'Guest'}</p>
                <p><strong class="text-primary">ETA:</strong> ${tracking ? tracking.estimatedTime : 'N/A'}</p>
                <p><strong class="text-primary">Courier:</strong> ${tracking ? tracking.driverName : 'N/A'}</p>
                <p><strong class="text-primary">Contact:</strong> ${tracking ? tracking.driverPhone : 'N/A'}</p>
              </div>
            </div>
          </div>
        `;
      } else {
        resultHtml = `
          <div class="rounded-lg border border-background-dark bg-background-card p-10 text-center shadow-premium">
            <h2 class="font-display text-3xl text-primary">Order not found</h2>
            <p class="text-sm text-secondary mt-2">No order matches "${trackOrderResult.query}". Check the order ID and try again.</p>
          </div>
        `;
      }
    } else {
      resultHtml = `
        <div class="rounded-lg border border-background-dark bg-background-card p-5 shadow-premium">
          <h2 class="font-display text-2xl text-primary mb-4">Recent simulated orders</h2>
          <div class="space-y-3">
            ${recentOrders.map((order) => `
              <button onclick="window.app.trackOrderLookup('${order.orderId}')" class="w-full flex items-center justify-between gap-3 p-3 bg-background rounded-lg border border-background-dark hover:border-accent/40 transition-all text-left min-h-[72px]">
                <span class="flex items-center gap-3 min-w-0">
                  ${order.meal ? `<img src="${order.meal.image}" alt="${order.meal.mealName}" class="w-12 h-12 rounded-lg object-cover border border-background-dark" />` : ''}
                  <span class="min-w-0">
                    <span class="block font-bold text-primary">${order.orderId}</span>
                    <span class="block text-xs text-secondary line-clamp-1">${order.meal ? order.meal.mealName : 'Frozen pack'} - ${RM(order.amount)}</span>
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
        <div class="rounded-lg border border-background-dark bg-background-card p-5 md:p-7 shadow-premium text-center">
          <span class="text-xs font-bold uppercase text-accent">Order lookup</span>
          <h1 class="font-display text-4xl md:text-5xl text-primary mt-1">Track your dumpling shipment</h1>
          <p class="text-sm text-secondary mt-2">Enter an order ID or choose a recent simulated order.</p>
          <form onsubmit="event.preventDefault(); window.app.trackOrderLookup(this.orderId.value)" class="mt-5 flex flex-col sm:flex-row gap-3">
            <input type="text" name="orderId" id="trackOrderInput" placeholder="Enter Order ID, e.g. ord_1234" class="form-input-premium text-sm min-h-12 flex-grow" value="${trackOrderResult ? trackOrderResult.query : ''}" />
            <button type="submit" class="button-accent min-h-12 whitespace-nowrap">Track order</button>
          </form>
        </div>
        ${resultHtml}
      </section>
    `;
  },

  trackOrderLookup(query) {
    const q = query.trim();
    if (!q) {
      window.app.showFloatingAlert('Enter an order ID to track.', 'info');
      return;
    }
    const order = store.state.orders.find((o) => o.orderId.toLowerCase() === q.toLowerCase());
    const tracking = order ? store.state.delivery.find((d) => d.orderId === order.orderId) : null;
    const meal = order ? orderPrimaryMeal(order) : null;
    const customer = order ? store.state.customers.find((c) => c.customerId === order.customerId) : null;
    trackOrderResult = { query: q, order, tracking, meal, customer };
    const container = document.getElementById('view-container');
    if (store.state.activeView === 'track-order' && container) this.renderTrackOrder(container);
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
