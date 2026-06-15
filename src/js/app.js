// app.js - HotMealBa shell, routing, and global UI behaviors

import { store, escapeHtml } from './store.js';
import { customerViews } from './views/customer.js';
import { adminViews } from './views/admin.js';

const routeToPath = {
  home: '/home',
  catalog: '/menu',
  notes: '/notes',
  checkout: '/checkout',
  tracking: '/tracking',
  apply: '/reseller',
  'track-order': '/track',
  'admin-login': '/admin',
  'admin-dash': '/admin',
  'admin-orders': '/admin/orders',
  'admin-customers': '/admin/customers'
};

const pathToRoute = {
  '/': 'home',
  '/home': 'home',
  '/menu': 'catalog',
  '/cart': 'cart',
  '/notes': 'notes',
  '/checkout': 'checkout',
  '/tracking': 'tracking',
  '/track': 'track-order',
  '/reseller': 'apply',
  '/admin': 'admin-dash',
  '/admin/orders': 'admin-orders',
  '/admin/customers': 'admin-customers'
};

const translations = {
  en: {
    'nav.home': 'Home',
    'nav.menu': 'Menu',
    'nav.notes': 'Reviews',
    'nav.track': 'Track Order',
    'nav.reseller': 'Reseller',
    'nav.admin': 'Admin Gateway'
  },
  zh: {
    'nav.home': '首页',
    'nav.menu': '菜单',
    'nav.notes': '评价',
    'nav.track': '订单追踪',
    'nav.reseller': '代理',
    'nav.admin': '管理员'
  },
  ms: {
    'nav.home': 'Laman',
    'nav.menu': 'Menu',
    'nav.notes': 'Ulasan',
    'nav.track': 'Jejak Pesanan',
    'nav.reseller': 'Penjual',
    'nav.admin': 'Admin'
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.menu': 'القائمة',
    'nav.notes': 'المراجعات',
    'nav.track': 'تتبع الطلب',
    'nav.reseller': 'موزع',
    'nav.admin': 'الإدارة'
  }
};

class App {
  constructor() {
    this.viewContainer = null;
    this.navHeader = null;
    this.navMobile = null;
    this.sidebarAdmin = null;
    this.cartDrawer = null;
    this.detailsModal = null;
    this.isRendering = false;
  }

  async start() {
    this.viewContainer = document.getElementById('view-container');
    this.navHeader = document.getElementById('nav-header');
    this.navMobile = document.getElementById('nav-mobile');
    this.sidebarAdmin = document.getElementById('sidebar-admin');
    this.cartDrawer = document.getElementById('cart-drawer');
    this.detailsModal = document.getElementById('details-modal');

    store.subscribe((state) => this.render(state));
    await store.init();

    this.installHistoryRouting();
    this.installSmoothScroll();
    this.installCanvasBackground();

    this.applyDocumentChrome(store.state);
    const initialView = this.viewFromLocation();
    this.switchView(initialView, { push: false, preserveScroll: true });
    if (initialView === 'cart') {
      this.switchView('home', { push: false });
      setTimeout(() => this.openCartDrawer(), 100);
    }
  }

  viewFromLocation() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    return pathToRoute[path] || 'home';
  }

  installHistoryRouting() {
    window.addEventListener('popstate', () => {
      const view = this.viewFromLocation();
      if (view === 'cart') {
        this.switchView('home', { push: false, preserveScroll: true });
        this.openCartDrawer();
      } else {
        this.switchView(view, { push: false, preserveScroll: true });
      }
    });
  }

  switchView(view, options = {}) {
    const { push = true, preserveScroll = false } = options;
    let nextView = view;

    if (view === 'cart') {
      this.openCartDrawer();
      if (push) history.pushState({ view: 'cart' }, '', '/cart');
      return;
    }

    if (view.startsWith('admin-') && !store.state.adminUnlocked) {
      store.setState({ pendingAdminView: view, activeView: 'admin-login' });
      if (push) history.pushState({ view: 'admin-login' }, '', '/admin');
      return;
    }

    if (!routeToPath[nextView]) nextView = 'home';
    store.setState({ activeView: nextView });
    this.closeCartDrawer();

    if (push) {
      const path = routeToPath[nextView] || '/home';
      if (window.location.pathname !== path) history.pushState({ view: nextView }, '', path);
    }

    if (!preserveScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setLanguage(language) {
    store.setLanguage(language);
  }

  toggleTheme() {
    store.setTheme(store.state.theme === 'dark' ? 'light' : 'dark');
  }

  submitAdminPassword(formData) {
    if (!store.unlockAdmin(formData.get('password'))) {
      this.showFloatingAlert('Wrong password. Use the HotMealBa admin password.', 'info');
      return;
    }
    this.showFloatingAlert('Admin gateway unlocked.', 'success');
    this.switchView(store.state.pendingAdminView || 'admin-dash');
  }

  logoutAdmin() {
    store.lockAdmin();
    this.switchView('home');
  }

  openMealDetails(mealId) {
    store.setState({ selectedMealId: mealId });
    this.detailsModal.classList.remove('hidden');
    this.detailsModal.classList.add('flex');
    this.renderModalContent(mealId);
  }

  closeMealDetails() {
    store.setState({ selectedMealId: null });
    this.detailsModal.classList.add('hidden');
    this.detailsModal.classList.remove('flex');
  }

  renderModalContent(mealId) {
    const modalInner = document.getElementById('modal-content-inner');
    if (modalInner) modalInner.innerHTML = customerViews.renderMealDetails(mealId);
  }

  openCartDrawer() {
    this.cartDrawer.classList.remove('translate-x-full');
    customerViews.renderCartDrawer();
  }

  closeCartDrawer() {
    this.cartDrawer.classList.add('translate-x-full');
  }

  addToCart(mealId, qty = 1) {
    store.addToCart(mealId, qty);
    this.openCartDrawer();
  }

  removeFromCart(mealId) {
    store.removeFromCart(mealId);
  }

  updateCartQuantity(mealId, quantity) {
    store.updateCartQuantity(mealId, quantity);
  }

  submitRating(mealId, rating, reviewText) {
    store.addReview(mealId, rating, reviewText);
    store.setState({ activeOrder: null });
    this.showFloatingAlert('Thank you. Your review is saved.', 'success');
    this.switchView('notes');
  }

  sanitizePhoneInput(input) {
    input.value = input.value.replace(/[^\d+\-\s]/g, '');
  }

  togglePaymentQr(value) {
    const qr = document.getElementById('payment-qr-panel');
    if (!qr) return;
    qr.classList.toggle('hidden', !['bank', 'wallet'].includes(value));
  }

  showFloatingAlert(msg, type = 'info') {
    const alertBox = document.createElement('div');
    alertBox.className = `fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 px-5 py-3.5 rounded-lg shadow-xl border animate-slide-up flex items-center gap-3 text-xs font-semibold ${
      type === 'success'
        ? 'bg-success text-white border-success-dark'
        : 'bg-primary text-background border-primary-dark'
    }`;
    alertBox.textContent = escapeHtml(msg);
    document.body.appendChild(alertBox);
    setTimeout(() => {
      alertBox.classList.add('opacity-0');
      setTimeout(() => alertBox.remove(), 300);
    }, 3200);
  }

  render(state) {
    if (this.isRendering) return;
    this.isRendering = true;
    this.applyDocumentChrome(state);

    const contentWrapper = document.getElementById('content-wrapper');
    const mainBody = document.getElementById('main-body');

    this.navHeader.classList.remove('hidden');
    this.navMobile.classList.remove('hidden');
    this.sidebarAdmin.classList.add('hidden');
    this.sidebarAdmin.classList.remove('flex');
    contentWrapper.classList.remove('w-full', 'px-6', 'md:px-10');
    contentWrapper.classList.add('max-w-7xl', 'px-4', 'md:px-8');
    mainBody.classList.remove('lg:pl-64', 'pt-6');
    mainBody.classList.add('pt-24');

    this.updateHeaderCartBadge(store.getCartCount());
    this.updateHeaderActiveLinks(state.activeView);

    if (this.viewContainer) {
      this.viewContainer.innerHTML = '';
      switch (state.activeView) {
        case 'home':
          customerViews.renderHome(this.viewContainer);
          break;
        case 'catalog':
          customerViews.renderCatalog(this.viewContainer);
          break;
        case 'notes':
          customerViews.renderNotes(this.viewContainer);
          break;
        case 'checkout':
          customerViews.renderCheckout(this.viewContainer);
          break;
        case 'tracking':
          customerViews.renderTracking(this.viewContainer);
          break;
        case 'admin-login':
          adminViews.renderLogin(this.viewContainer);
          break;
        case 'admin-dash':
          adminViews.renderDashboard(this.viewContainer);
          break;
        case 'admin-orders':
          adminViews.renderOrders(this.viewContainer);
          break;
        case 'apply':
          customerViews.renderApplyJob(this.viewContainer);
          break;
        case 'track-order':
          customerViews.renderTrackOrder(this.viewContainer);
          break;
        case 'admin-customers':
          adminViews.renderCustomers(this.viewContainer);
          break;
        default:
          customerViews.renderHome(this.viewContainer);
      }
    }

    if (state.selectedMealId) this.renderModalContent(state.selectedMealId);
    if (!this.cartDrawer.classList.contains('translate-x-full')) customerViews.renderCartDrawer();
    this.isRendering = false;
  }

  applyDocumentChrome(state) {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';

    const langSelect = document.getElementById('language-toggle');
    if (langSelect) langSelect.value = state.language;

    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      node.textContent = translations[state.language]?.[key] || translations.en[key] || node.textContent;
    });

    this.drawDumplingCanvas();
  }

  updateHeaderActiveLinks(activeView) {
    const routeGroup = activeView === 'tracking' ? 'track-order' : activeView;
    document.querySelectorAll('[data-route]').forEach((link) => {
      const route = link.getAttribute('data-route');
      const isActive = route === routeGroup;
      link.classList.toggle('is-active', isActive);
      link.classList.toggle('text-accent', isActive);
      link.classList.toggle('font-semibold', isActive);
      link.classList.toggle('text-secondary-light', !isActive);
    });
  }

  updateHeaderCartBadge(count) {
    document.querySelectorAll('.cart-count-badge').forEach((badge) => {
      if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    });
  }

  installCanvasBackground() {
    window.addEventListener('resize', () => this.drawDumplingCanvas());
    this.drawDumplingCanvas();
  }

  drawDumplingCanvas() {
    const canvas = document.getElementById('dumpling-bg-canvas');
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const isDark = store.state.theme === 'dark';
    ctx.strokeStyle = isDark ? 'rgba(244,130,95,0.28)' : 'rgba(30,42,78,0.16)';
    ctx.fillStyle = isDark ? 'rgba(244,130,95,0.07)' : 'rgba(231,97,59,0.06)';
    const gap = 150;
    for (let y = -40; y < window.innerHeight + 80; y += gap) {
      for (let x = -30; x < window.innerWidth + 80; x += gap) {
        ctx.save();
        ctx.translate(x + ((y / gap) % 2) * 52, y);
        ctx.rotate(-0.18);
        ctx.beginPath();
        ctx.moveTo(0, 46);
        ctx.quadraticCurveTo(42, -18, 84, 46);
        ctx.quadraticCurveTo(42, 68, 0, 46);
        ctx.fill();
        ctx.stroke();
        for (let i = 1; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(16 * i, 42);
          ctx.quadraticCurveTo(18 * i, 22, 26 * i, 18);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  installSmoothScroll() {
    let velocity = 0;
    let frame = 0;
    const step = () => {
      window.scrollBy(0, velocity * 0.16);
      velocity *= 0.68;
      if (Math.abs(velocity) > 0.45) {
        frame = requestAnimationFrame(step);
      } else {
        frame = 0;
        velocity = 0;
      }
    };

    window.addEventListener('wheel', (event) => {
      const target = event.target;
      if (
        event.ctrlKey ||
        target.closest('input, textarea, select, [data-native-scroll], .leaflet-container')
      ) return;
      event.preventDefault();
      velocity += event.deltaY;
      velocity = Math.max(Math.min(velocity, 220), -220);
      if (!frame) frame = requestAnimationFrame(step);
    }, { passive: false });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  window.app = window.app || {};
  Object.assign(window.app, app);

  window.app.switchView = app.switchView.bind(app);
  window.app.openMealDetails = app.openMealDetails.bind(app);
  window.app.closeMealDetails = app.closeMealDetails.bind(app);
  window.app.openCartDrawer = app.openCartDrawer.bind(app);
  window.app.closeCartDrawer = app.closeCartDrawer.bind(app);
  window.app.addToCart = app.addToCart.bind(app);
  window.app.removeFromCart = app.removeFromCart.bind(app);
  window.app.updateCartQuantity = app.updateCartQuantity.bind(app);
  window.app.submitRating = app.submitRating.bind(app);
  window.app.toggleTheme = app.toggleTheme.bind(app);
  window.app.setLanguage = app.setLanguage.bind(app);
  window.app.submitAdminPassword = app.submitAdminPassword.bind(app);
  window.app.logoutAdmin = app.logoutAdmin.bind(app);
  window.app.sanitizePhoneInput = app.sanitizePhoneInput.bind(app);
  window.app.togglePaymentQr = app.togglePaymentQr.bind(app);
  window.app.showFloatingAlert = app.showFloatingAlert.bind(app);

  app.start();
});
