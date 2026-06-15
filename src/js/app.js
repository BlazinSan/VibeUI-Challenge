// app.js - HotMealBa shell, routing, and global UI behaviors

import Lenis from 'lenis';
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
  'admin-orders': '/admin/orders'
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
  '/admin/orders': 'admin-orders'
};

const translations = {
  en: {
    'nav.home': 'Home', 'nav.menu': 'Menu', 'nav.notes': 'Reviews',
    'nav.track': 'Track Order', 'nav.reseller': 'Reseller', 'nav.admin': 'Admin Gateway',
    'home.eyebrow': 'Campus meals and dumplings',
    'home.tagline': 'Order handmade dumplings, noodles, skewers, and reseller bundles with clean checkout and real order tracking.',
    'home.browse': 'Browse Menu', 'home.reseller': 'Become a reseller',
    'home.featured': 'Featured picks', 'home.popular': 'Popular menu items',
    'home.browseType': 'Browse by order type', 'home.how': 'How it works',
    'home.viewMenu': 'View full Menu', 'home.recent': 'Repeat a recent order',
    'cta.addCart': 'Add to Cart', 'cta.checkout': 'Go to checkout', 'cta.viewCart': 'View cart',
    'menu.title': 'HotMealBa order board',
    'menu.search': 'Search dumplings, sauce, noodles...',
    'menu.empty': 'No Menu items found',
    'reviews.title': 'What customers say', 'reviews.next': 'Next review',
    'common.subtotal': 'Subtotal', 'common.delivery': 'Delivery', 'common.total': 'Total',
    'common.orders': 'orders', 'common.customers': 'customers', 'common.live': 'Live', 'common.tracking': 'tracking'
  },
  zh: {
    'nav.home': '首页', 'nav.menu': '菜单', 'nav.notes': '评价',
    'nav.track': '订单追踪', 'nav.reseller': '代理', 'nav.admin': '管理员',
    'home.eyebrow': '校园美食与饺子',
    'home.tagline': '订购手工饺子、面条、串烧和代理套餐，结账简单，订单实时追踪。',
    'home.browse': '浏览菜单', 'home.reseller': '成为代理',
    'home.featured': '精选推荐', 'home.popular': '热门菜品',
    'home.browseType': '按类型浏览', 'home.how': '下单流程',
    'home.viewMenu': '查看完整菜单', 'home.recent': '再次下单',
    'cta.addCart': '加入购物车', 'cta.checkout': '去结账', 'cta.viewCart': '查看购物车',
    'menu.title': 'HotMealBa 点餐板',
    'menu.search': '搜索饺子、酱料、面条…',
    'menu.empty': '未找到菜品',
    'reviews.title': '顾客评价', 'reviews.next': '下一条评价',
    'common.subtotal': '小计', 'common.delivery': '配送', 'common.total': '总计',
    'common.orders': '订单', 'common.customers': '顾客', 'common.live': '实时', 'common.tracking': '追踪'
  },
  ms: {
    'nav.home': 'Laman', 'nav.menu': 'Menu', 'nav.notes': 'Ulasan',
    'nav.track': 'Jejak Pesanan', 'nav.reseller': 'Penjual', 'nav.admin': 'Admin',
    'home.eyebrow': 'Hidangan kampus dan ladu',
    'home.tagline': 'Pesan ladu buatan tangan, mi, sate, dan pakej penjual dengan pembayaran mudah dan penjejakan pesanan sebenar.',
    'home.browse': 'Lihat Menu', 'home.reseller': 'Jadi penjual',
    'home.featured': 'Pilihan utama', 'home.popular': 'Menu popular',
    'home.browseType': 'Cari ikut jenis', 'home.how': 'Cara pesanan',
    'home.viewMenu': 'Lihat Menu penuh', 'home.recent': 'Pesan semula',
    'cta.addCart': 'Tambah ke Troli', 'cta.checkout': 'Ke pembayaran', 'cta.viewCart': 'Lihat troli',
    'menu.title': 'Papan pesanan HotMealBa',
    'menu.search': 'Cari ladu, sos, mi...',
    'menu.empty': 'Tiada item Menu dijumpai',
    'reviews.title': 'Kata pelanggan', 'reviews.next': 'Ulasan seterusnya',
    'common.subtotal': 'Subjumlah', 'common.delivery': 'Penghantaran', 'common.total': 'Jumlah',
    'common.orders': 'pesanan', 'common.customers': 'pelanggan', 'common.live': 'Langsung', 'common.tracking': 'penjejakan'
  },
  ar: {
    'nav.home': 'الرئيسية', 'nav.menu': 'القائمة', 'nav.notes': 'المراجعات',
    'nav.track': 'تتبع الطلب', 'nav.reseller': 'موزع', 'nav.admin': 'الإدارة',
    'home.eyebrow': 'وجبات الحرم الجامعي والزلابية',
    'home.tagline': 'اطلب الزلابية المصنوعة يدويًا والنودلز والأسياخ وحزم الموزعين مع دفع سهل وتتبع حقيقي للطلب.',
    'home.browse': 'تصفح القائمة', 'home.reseller': 'كن موزعًا',
    'home.featured': 'مختارات مميزة', 'home.popular': 'أصناف شائعة',
    'home.browseType': 'تصفح حسب النوع', 'home.how': 'كيف تطلب',
    'home.viewMenu': 'عرض القائمة كاملة', 'home.recent': 'إعادة طلب سابق',
    'cta.addCart': 'أضف إلى السلة', 'cta.checkout': 'إتمام الطلب', 'cta.viewCart': 'عرض السلة',
    'menu.title': 'لوحة طلبات HotMealBa',
    'menu.search': 'ابحث عن زلابية، صلصة، نودلز...',
    'menu.empty': 'لا توجد أصناف',
    'reviews.title': 'آراء العملاء', 'reviews.next': 'المراجعة التالية',
    'common.subtotal': 'المجموع الفرعي', 'common.delivery': 'التوصيل', 'common.total': 'الإجمالي',
    'common.orders': 'طلبات', 'common.customers': 'عملاء', 'common.live': 'مباشر', 'common.tracking': 'تتبع'
  }
};

class App {
  constructor() {
    this.viewContainer = null;
    this.navHeader = null;
    this.navMobile = null;
    this.sidebarAdmin = null;
    this.cartDrawer = null;
    this.cartBackdrop = null;
    this.detailsModal = null;
    this.isRendering = false;
    this.isPullRefreshing = false;
  }

  async start() {
    this.viewContainer = document.getElementById('view-container');
    this.navHeader = document.getElementById('nav-header');
    this.navMobile = document.getElementById('nav-mobile');
    this.sidebarAdmin = document.getElementById('sidebar-admin');
    this.cartDrawer = document.getElementById('cart-drawer');
    this.cartBackdrop = document.getElementById('cart-backdrop');
    this.detailsModal = document.getElementById('details-modal');

    store.subscribe((state) => this.render(state));
    await store.init();

    this.installHistoryRouting();
    this.installSmoothScroll();
    this.installScrollReveal();
    this.installScrollFocus();
    this.installCanvasBackground();
    this.installPullToRefresh();

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

    if (!preserveScroll) {
      if (this.lenis) this.lenis.scrollTo(0, { immediate: false });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  setLanguage(language) {
    store.setLanguage(language);
  }

  // Jump to the Menu pre-filtered to a category (used by home category chips).
  browseCategory(category) {
    customerViews.setCatalogCategory(category, { silent: true });
    this.switchView('catalog');
  }

  toggleTheme() {
    this.playThemeCurtain(store.state.theme === 'dark' ? 'light' : 'dark');
  }

  scrollToPosition(top, options = {}) {
    if (this.lenis) this.lenis.scrollTo(top, { immediate: Boolean(options.immediate) });
    else window.scrollTo({ top, behavior: options.immediate ? 'auto' : 'smooth' });
  }

  // Cycle through the supported languages - used by the compact mobile button.
  cycleLanguage() {
    const langs = ['en', 'zh', 'ms', 'ar'];
    const next = langs[(langs.indexOf(store.state.language) + 1) % langs.length];
    store.setLanguage(next);
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
    customerViews.prepMealDetails();
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
    this.cartBackdrop?.classList.remove('hidden');
    customerViews.renderCartDrawer();
  }

  closeCartDrawer() {
    this.cartDrawer.classList.add('translate-x-full');
    this.cartBackdrop?.classList.add('hidden');
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
    contentWrapper.classList.remove('w-full', 'px-6', 'md:px-10', 'max-w-7xl', 'max-w-[96rem]', 'xl:px-10');
    contentWrapper.classList.add(state.activeView === 'home' ? 'max-w-[96rem]' : 'max-w-7xl', 'px-4', 'md:px-8');
    if (state.activeView === 'home') contentWrapper.classList.add('xl:px-10');
    mainBody.classList.remove('lg:pl-64', 'lg:pl-24', 'pt-6');
    mainBody.classList.add('pt-24', 'lg:pl-24');

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
        default:
          customerViews.renderHome(this.viewContainer);
      }
    }

    if (state.selectedMealId) this.renderModalContent(state.selectedMealId);
    if (!this.cartDrawer.classList.contains('translate-x-full')) customerViews.renderCartDrawer();

    // Translate freshly-rendered content and arm desktop scroll-reveal.
    this.applyTranslations();
    this.markScrollFocusItems();
    this.observeReveals();
    this.updateScrollFocus?.();
    this.isRendering = false;
  }

  applyTranslations(root = document) {
    const lang = store.state.language;
    root.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      const value = translations[lang]?.[key] || translations.en[key];
      if (value) node.textContent = value;
    });
    root.querySelectorAll('[data-i18n-ph]').forEach((node) => {
      const key = node.getAttribute('data-i18n-ph');
      const value = translations[lang]?.[key] || translations.en[key];
      if (value) node.setAttribute('placeholder', value);
    });
  }

  applyDocumentChrome(state) {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';

    const langSelect = document.getElementById('language-toggle');
    if (langSelect) langSelect.value = state.language;

    // Sync the compact mobile language badge.
    const langBadge = document.getElementById('mobile-lang-badge');
    if (langBadge) langBadge.textContent = { en: 'EN', zh: '中', ms: 'BM', ar: 'ع' }[state.language] || 'EN';

    // Sync the mobile theme icon (sun in dark mode = "switch to light", moon in light mode).
    const isDark = state.theme === 'dark';
    document.querySelector('.theme-mobile-sun')?.classList.toggle('hidden', !isDark);
    document.querySelector('.theme-mobile-moon')?.classList.toggle('hidden', isDark);

    this.applyTranslations();
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

  async refreshCurrentView() {
    const activeView = store.state.activeView;
    const selectedMealId = store.state.selectedMealId;
    await store.init();
    store.setState({ activeView, selectedMealId });
  }

  installPullToRefresh() {
    const indicator = document.getElementById('pull-refresh-indicator');
    if (!indicator) return;
    let startY = 0;
    let distance = 0;
    let pulling = false;
    const threshold = 74;

    const reset = () => {
      distance = 0;
      pulling = false;
      indicator.classList.remove('is-visible', 'is-ready', 'is-refreshing');
      indicator.style.setProperty('--pull-distance', '0px');
      indicator.querySelector('.pull-refresh-text').textContent = 'Pull to refresh';
    };

    window.addEventListener('touchstart', (event) => {
      if (this.isPullRefreshing || window.matchMedia('(min-width: 768px)').matches) return;
      const target = event.target;
      if (
        window.scrollY > 1 ||
        target.closest('input, textarea, select, button, [data-native-scroll], #cart-drawer, #details-modal')
      ) return;
      startY = event.touches[0].clientY;
      pulling = true;
    }, { passive: true });

    window.addEventListener('touchmove', (event) => {
      if (!pulling || this.isPullRefreshing) return;
      const dy = event.touches[0].clientY - startY;
      if (dy <= 0) return;
      distance = Math.min(118, dy * 0.58);
      indicator.style.setProperty('--pull-distance', `${distance}px`);
      indicator.classList.add('is-visible');
      indicator.classList.toggle('is-ready', distance >= threshold);
      indicator.querySelector('.pull-refresh-text').textContent = distance >= threshold ? 'Release to refresh' : 'Pull to refresh';
      if (dy > 8) event.preventDefault();
    }, { passive: false });

    window.addEventListener('touchend', async () => {
      if (!pulling) return;
      if (distance < threshold) {
        reset();
        return;
      }
      this.isPullRefreshing = true;
      indicator.classList.add('is-refreshing');
      indicator.querySelector('.pull-refresh-text').textContent = 'Refreshing';
      try {
        await this.refreshCurrentView();
      } finally {
        setTimeout(() => {
          this.isPullRefreshing = false;
          reset();
        }, 420);
      }
    }, { passive: true });

    window.addEventListener('touchcancel', reset, { passive: true });
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
    // Respect users who prefer reduced motion - leave native scrolling intact.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Lenis momentum scrolling: a short, smooth glide that settles quickly.
    this.lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });

    const raf = (time) => {
      this.lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Keep inner scroll regions native - exclude them from Lenis now and on
    // every re-render (the view container's innerHTML is rebuilt on navigation).
    this.excludeNativeScroll();
    const observer = new MutationObserver(() => this.excludeNativeScroll());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Mark inner scroll regions so Lenis leaves their native scrolling alone.
  excludeNativeScroll() {
    document
      .querySelectorAll('[data-native-scroll], .leaflet-container')
      .forEach((el) => el.setAttribute('data-lenis-prevent', ''));
  }

  // Radial theme flash modeled after Captain's Food Hub.
  playThemeCurtain(nextTheme) {
    const swap = () => store.setTheme(nextTheme);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      swap();
      return;
    }
    const root = document.documentElement;
    const scrollY = window.scrollY;
    const trigger = document.querySelector('[aria-label="Toggle light or dark mode"]:hover')
      || (document.activeElement?.matches?.('[aria-label="Toggle light or dark mode"]') ? document.activeElement : null);
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      root.style.setProperty('--theme-origin-x', `${Math.round(rect.left + rect.width / 2)}px`);
      root.style.setProperty('--theme-origin-y', `${Math.round(rect.top + rect.height / 2)}px`);
    } else {
      root.style.removeProperty('--theme-origin-x');
      root.style.removeProperty('--theme-origin-y');
    }

    root.classList.remove('theme-flip');
    void root.offsetWidth;
    root.classList.add('theme-flip');
    swap();

    const keepScroll = () => window.scrollTo(0, scrollY);
    setTimeout(keepScroll, 0);
    requestAnimationFrame(keepScroll);
    setTimeout(keepScroll, 80);
    setTimeout(keepScroll, 260);
    setTimeout(keepScroll, 700);
    setTimeout(() => root.classList.remove('theme-flip'), 650);
  }

  // Desktop-only fade/slide-in as sections enter the viewport.
  installScrollReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          this.revealObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
  }

  observeReveals() {
    if (!this.revealObserver) return;
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    document.querySelectorAll('[data-reveal]').forEach((node) => {
      if (!isDesktop) {
        node.classList.add('is-revealed'); // no hiding on phone/tablet
        return;
      }
      if (!node.classList.contains('is-revealed')) this.revealObserver.observe(node);
    });
  }

  markScrollFocusItems() {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    document.querySelectorAll('[data-scroll-focus]').forEach((node) => {
      if (!node.hasAttribute('data-reveal')) node.removeAttribute('data-scroll-focus');
    });
    if (!isDesktop) return;
    document.querySelectorAll('[data-reveal]').forEach((node) => {
      node.setAttribute('data-scroll-focus', '');
    });
  }

  installScrollFocus() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      const nodes = document.querySelectorAll('[data-scroll-focus]');
      if (!isDesktop) {
        nodes.forEach((node) => {
          node.style.removeProperty('--focus-opacity');
          node.style.removeProperty('--focus-scale');
          node.style.removeProperty('--focus-saturate');
          node.classList.remove('is-scroll-centered');
        });
        return;
      }

      const viewportCenter = window.innerHeight / 2;
      const focusRange = Math.max(260, window.innerHeight * 0.58);
      nodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const nodeCenter = rect.top + rect.height / 2;
        const proximity = Math.max(0, 1 - Math.abs(nodeCenter - viewportCenter) / focusRange);
        node.style.setProperty('--focus-opacity', (0.62 + proximity * 0.38).toFixed(3));
        node.style.setProperty('--focus-scale', (0.965 + proximity * 0.045).toFixed(3));
        node.style.setProperty('--focus-saturate', (0.9 + proximity * 0.12).toFixed(3));
        node.classList.toggle('is-scroll-centered', proximity > 0.82);
      });
    };
    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    this.updateScrollFocus = requestUpdate;
    if (window.app) window.app.updateScrollFocus = requestUpdate;
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
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
  window.app.cycleLanguage = app.cycleLanguage.bind(app);
  window.app.browseCategory = app.browseCategory.bind(app);
  window.app.setLanguage = app.setLanguage.bind(app);
  window.app.applyTranslations = app.applyTranslations.bind(app);
  window.app.scrollToPosition = app.scrollToPosition.bind(app);
  window.app.submitAdminPassword = app.submitAdminPassword.bind(app);
  window.app.logoutAdmin = app.logoutAdmin.bind(app);
  window.app.sanitizePhoneInput = app.sanitizePhoneInput.bind(app);
  window.app.togglePaymentQr = app.togglePaymentQr.bind(app);
  window.app.showFloatingAlert = app.showFloatingAlert.bind(app);

  app.start();
});
