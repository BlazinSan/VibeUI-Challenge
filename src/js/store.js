// store.js - Unified client-side state for HotMealBa

const CART_KEY = 'hotmealba_cart';
const ORDER_KEY = 'hotmealba_orders';
const DELIVERY_KEY = 'hotmealba_delivery';
const MEALS_KEY = 'hotmealba_meals';
const CUSTOMERS_KEY = 'hotmealba_customers';
const RATINGS_KEY = 'hotmealba_ratings';
const THEME_KEY = 'hotmealba_theme';
const LANG_KEY = 'hotmealba_lang';
const ADMIN_KEY = 'hotmealba_admin_unlocked';
const ORDERWINDOW_KEY = 'hotmealba_order_window';

const BRAND_IMAGES = [
  '/assets/images/dumplings-plate.png',
  '/assets/images/dumpling-bowl.png',
  '/assets/images/chicken-skewers.png',
  '/assets/images/noodle-plate.png'
];

const HUB_LOCATION = {
  lat: 1.5588,
  lng: 103.6376,
  label: 'HotMealBa Kitchen'
};

export function sanitizeText(value, maxLength = 180) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizePhone(value) {
  return String(value ?? '')
    .replace(/[^\d+\-\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24);
}

export function sanitizeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function sanitizeOrderId(value) {
  return String(value ?? '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .trim()
    .slice(0, 36);
}

function sanitizeImageValue(value, fallback = BRAND_IMAGES[0]) {
  const text = String(value ?? '').trim();
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(text) && text.length < 2_200_000) {
    return text;
  }
  return sanitizeText(text, 300) || fallback;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function readJSON(key, fallback) {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

class AppStore {
  constructor() {
    this.state = {
      activeView: 'home',
      meals: [],
      customers: [],
      orders: [],
      delivery: [],
      ratings: [],
      cart: [],
      activeOrder: null,
      selectedMealId: null,
      adminSelectedCustomerId: null,
      adminUnlocked: sessionStorage.getItem(ADMIN_KEY) === '1',
      pendingAdminView: 'admin-dash',
      theme: localStorage.getItem(THEME_KEY) || 'light',
      language: localStorage.getItem(LANG_KEY) || 'en',
      orderWindow: readJSON(ORDERWINDOW_KEY, { openTime: '10:00', closeTime: '18:00' })
    };

    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((item) => item !== listener);
    };
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  notify() {
    for (const listener of this.listeners) listener(this.state);
  }

  async init() {
    try {
      const fetchJSON = async (filename) => {
        const res = await fetch(`/data/${filename}`);
        if (!res.ok) throw new Error(`Failed to load ${filename}`);
        return await res.json();
      };

      const [baseMeals, customers, ratings] = await Promise.all([
        fetchJSON('meals.json'),
        fetchJSON('customers.json'),
        fetchJSON('ratings.json')
      ]);

      const editedMeals = readJSON(MEALS_KEY, null);
      const savedCustomers = readJSON(CUSTOMERS_KEY, []);
      const savedRatings = readJSON(RATINGS_KEY, []);
      const orders = readJSON(ORDER_KEY, []);
      const delivery = readJSON(DELIVERY_KEY, []);
      const cachedCart = readJSON(CART_KEY, readJSON('dumplingdesk_cart', []));

      this.state.meals = editedMeals || this.applyBrandImages(baseMeals);
      this.state.customers = [...savedCustomers, ...customers];
      this.state.orders = orders;
      this.state.delivery = delivery;
      this.state.ratings = [...savedRatings, ...ratings];
      this.state.cart = Array.isArray(cachedCart) ? cachedCart : [];
      this.state.activeOrder = orders[0] || null;
      this.notify();
    } catch (err) {
      console.error('Error loading HotMealBa datasets:', err);
    }
  }

  applyBrandImages(meals) {
    return meals.map((meal, index) => ({
      ...meal,
      image: BRAND_IMAGES[index % BRAND_IMAGES.length],
      mealName: meal.mealName
        .replace(/Dumpling Desk/gi, 'HotMealBa')
        .replace(/Dumpling/gi, 'HotMealBa Dumpling')
    }));
  }

  setTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, nextTheme);
    this.setState({ theme: nextTheme });
  }

  setLanguage(language) {
    const nextLanguage = ['en', 'zh', 'ms', 'ar'].includes(language) ? language : 'en';
    localStorage.setItem(LANG_KEY, nextLanguage);
    this.setState({ language: nextLanguage });
  }

  setOrderWindow(openTime, closeTime) {
    const valid = (t) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(String(t || ''));
    const orderWindow = {
      openTime: valid(openTime) ? openTime : this.state.orderWindow.openTime,
      closeTime: valid(closeTime) ? closeTime : this.state.orderWindow.closeTime
    };
    writeJSON(ORDERWINDOW_KEY, orderWindow);
    this.setState({ orderWindow });
  }

  unlockAdmin(password) {
    if (sanitizeText(password, 40) !== 'HotMealBa') return false;
    sessionStorage.setItem(ADMIN_KEY, '1');
    this.setState({ adminUnlocked: true });
    return true;
  }

  lockAdmin() {
    sessionStorage.removeItem(ADMIN_KEY);
    this.setState({ adminUnlocked: false, activeView: 'home' });
  }

  addToCart(mealId, qty = 1) {
    const meal = this.state.meals.find((item) => item.mealId === mealId);
    if (!meal) return;

    const cart = [...this.state.cart];
    const existingIndex = cart.findIndex((item) => item.mealId === mealId);
    const safeQty = Math.max(1, Math.min(99, sanitizeNumber(qty, 1)));

    if (existingIndex > -1) {
      cart[existingIndex].quantity = Math.min(99, cart[existingIndex].quantity + safeQty);
    } else {
      cart.push({ mealId, quantity: safeQty });
    }

    this.saveCart(cart);
  }

  removeFromCart(mealId) {
    this.saveCart(this.state.cart.filter((item) => item.mealId !== mealId));
  }

  updateCartQuantity(mealId, quantity) {
    const safeQty = Math.floor(sanitizeNumber(quantity, 0));
    if (safeQty <= 0) {
      this.removeFromCart(mealId);
      return;
    }
    this.saveCart(this.state.cart.map((item) => (
      item.mealId === mealId ? { ...item, quantity: Math.min(99, safeQty) } : item
    )));
  }

  clearCart() {
    this.saveCart([]);
  }

  saveCart(cart) {
    this.state.cart = cart;
    writeJSON(CART_KEY, cart);
    this.notify();
  }

  getCartTotal() {
    return this.state.cart.reduce((sum, item) => {
      const meal = this.state.meals.find((m) => m.mealId === item.mealId);
      return sum + (meal ? meal.price * item.quantity : 0);
    }, 0);
  }

  getCartCount() {
    return this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  placeOrder(addressDetails) {
    const lineItems = this.state.cart
      .map((item) => ({ ...item }))
      .filter((item) => this.state.meals.some((meal) => meal.mealId === item.mealId));

    if (lineItems.length === 0) return null;

    const now = new Date();
    const orderId = `HMB-${now.getTime().toString(36).toUpperCase()}-${randomId(100, 999)}`;
    const trackingId = `TRK-${randomId(1000, 9999)}-${now.getFullYear()}`;
    const deliveryFee = sanitizeNumber(addressDetails.deliveryFee, 6);
    const subtotal = this.getCartTotal();
    const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);
    const phone = sanitizePhone(addressDetails.phone);
    const customerId = `guest_${phone.replace(/\D/g, '').slice(-6) || randomId(100000, 999999)}`;
    const guestCustomer = {
      customerId,
      name: sanitizeText(addressDetails.name, 80),
      email: sanitizeText(addressDetails.email || '', 120),
      phone,
      location: sanitizeText(addressDetails.address, 180),
      joinDate: now.toISOString()
    };

    const newOrder = {
      orderId,
      trackingId,
      customerId,
      mealId: lineItems[0].mealId,
      lineItems,
      quantity: totalQuantity,
      amount: parseFloat((subtotal + deliveryFee).toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      deliveryFee,
      status: 'received',
      orderDate: now.toISOString()
    };

    const newTracking = {
      trackingId,
      orderId,
      status: 'received',
      estimatedTime: new Date(Date.now() + 45 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      driverName: 'HotMealBa Runner',
      driverPhone: '+60 11-2702 3015',
      hub: HUB_LOCATION,
      location: { ...HUB_LOCATION },
      destination: {
        lat: 1.5625,
        lng: 103.6408,
        label: sanitizeText(addressDetails.address, 180) || 'Customer address'
      },
      details: {
        name: guestCustomer.name,
        phone,
        address: sanitizeText(addressDetails.address, 180),
        payment: sanitizeText(addressDetails.payment, 40),
        window: sanitizeText(addressDetails.window, 80),
        notes: sanitizeText(addressDetails.notes, 300),
        deliveryFee
      }
    };

    const customers = [guestCustomer, ...this.state.customers.filter((item) => item.customerId !== customerId)];
    const orders = [newOrder, ...this.state.orders];
    const delivery = [newTracking, ...this.state.delivery];

    this.state.customers = customers;
    this.state.orders = orders;
    this.state.delivery = delivery;
    this.state.activeOrder = newOrder;
    writeJSON(CUSTOMERS_KEY, customers.filter((item) => item.customerId.startsWith('guest_')));
    this.saveOrders(orders, delivery);
    this.clearCart();
    this.setState({ activeView: 'tracking', activeOrder: newOrder });
    return newOrder;
  }

  saveOrders(orders = this.state.orders, delivery = this.state.delivery) {
    writeJSON(ORDER_KEY, orders);
    writeJSON(DELIVERY_KEY, delivery);
  }

  updateOrderStatus(orderId, status) {
    const safeStatus = sanitizeText(status, 40);
    const orders = this.state.orders.map((order) => (
      order.orderId === orderId ? { ...order, status: safeStatus } : order
    ));
    const delivery = this.state.delivery.map((item) => (
      item.orderId === orderId ? { ...item, status: safeStatus } : item
    ));
    const activeOrder = this.state.activeOrder?.orderId === orderId
      ? { ...this.state.activeOrder, status: safeStatus }
      : this.state.activeOrder;

    this.saveOrders(orders, delivery);
    this.setState({ orders, delivery, activeOrder });
  }

  updateTrackingLocation(orderId, lat, lng, label = '') {
    const safeLat = sanitizeNumber(lat, null);
    const safeLng = sanitizeNumber(lng, null);
    if (safeLat === null || safeLng === null) return false;

    const delivery = this.state.delivery.map((item) => (
      item.orderId === orderId
        ? { ...item, location: { lat: safeLat, lng: safeLng, label: sanitizeText(label, 80) || 'Manual update' } }
        : item
    ));

    this.saveOrders(this.state.orders, delivery);
    this.setState({ delivery });
    return true;
  }

  // Resolve a Google Maps short/full plus code OR a Google Maps link/coords
  // into {lat, lng}. Returns null if nothing usable is found.
  resolveLocationInput(raw) {
    const text = decodeURIComponent(String(raw || '').trim());
    if (!text) return null;

    // 1) Plain "lat, lng" or a maps URL containing coordinates.
    const coord = text.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/)            // .../@1.55,103.63
      || text.match(/[?&](?:q|ll|destination)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/)
      || text.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/)
      || text.match(/^\s*(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
    if (coord) {
      const lat = Number(coord[1]); const lng = Number(coord[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }

    // 2) Open Location Code (Google plus code). Full codes (8 chars before the
    //    "+") decode directly; short codes (e.g. "6PM7+QF") are recovered using
    //    the HotMealBa hub as the reference location.
    const plus = text.match(/\b([23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,})\b/i);
    if (plus) {
      const code = plus[1].toUpperCase();
      const before = code.indexOf('+');
      const decoded = before >= 8
        ? decodeOpenLocationCode(code)
        : recoverOpenLocationCode(code, HUB_LOCATION.lat, HUB_LOCATION.lng);
      if (decoded) return decoded;
    }
    return null;
  }

  updateTrackingFromInput(orderId, raw) {
    const point = this.resolveLocationInput(raw);
    if (!point) return false;
    return this.updateTrackingLocation(orderId, point.lat, point.lng, 'Manual update');
  }

  setOrderPhoto(orderId, dataUrl) {
    if (!orderId || !dataUrl) return false;
    const orders = this.state.orders.map((order) => (
      order.orderId === orderId ? { ...order, photo: dataUrl } : order
    ));
    this.saveOrders(orders, this.state.delivery);
    this.setState({ orders });
    return true;
  }

  upsertMeal(formData) {
    const rawId = sanitizeText(formData.get('mealId'), 40);
    const mealId = rawId || `meal_${randomId(10000, 99999)}`;
    const current = this.state.meals.find((meal) => meal.mealId === mealId);
    const image = sanitizeImageValue(formData.get('image'), current?.image || BRAND_IMAGES[0]);
    const meal = {
      ...(current || {}),
      mealId,
      mealName: sanitizeText(formData.get('mealName'), 90) || 'HotMealBa Menu Item',
      category: sanitizeText(formData.get('category'), 60) || 'Dumpling Packs',
      price: Math.max(0, sanitizeNumber(formData.get('price'), current?.price || 0)),
      image,
      packSize: sanitizeText(formData.get('packSize'), 80) || current?.packSize || '12 pcs',
      description: sanitizeText(formData.get('description'), 220) || current?.description || 'Fresh HotMealBa menu item.',
      rating: sanitizeNumber(formData.get('rating'), current?.rating || 4.8),
      prepTime: sanitizeNumber(formData.get('prepTime'), current?.prepTime || 15),
      ingredients: sanitizeText(formData.get('ingredients'), 180)
        .split(',')
        .map((item) => sanitizeText(item, 40))
        .filter(Boolean)
    };

    const meals = current
      ? this.state.meals.map((item) => (item.mealId === mealId ? meal : item))
      : [meal, ...this.state.meals];

    writeJSON(MEALS_KEY, meals);
    this.setState({ meals });
    return mealId;
  }

  deleteMeal(mealId) {
    const meals = this.state.meals.filter((meal) => meal.mealId !== mealId);
    writeJSON(MEALS_KEY, meals);
    this.setState({ meals });
  }

  addReview(mealId, rating, reviewText) {
    const safeRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    const newRating = {
      ratingId: `rate_${randomId(9100, 9999)}`,
      customerId: 'cust_001',
      mealId,
      rating: safeRating,
      review: sanitizeText(reviewText, 220)
    };

    const ratings = [newRating, ...this.state.ratings];
    const mealReviews = ratings.filter((item) => item.mealId === mealId);
    const avg = parseFloat((mealReviews.reduce((sum, item) => sum + item.rating, 0) / mealReviews.length).toFixed(1));
    const meals = this.state.meals.map((meal) => (
      meal.mealId === mealId ? { ...meal, rating: avg } : meal
    ));

    writeJSON(RATINGS_KEY, ratings.filter((item) => item.ratingId.startsWith('rate_')));
    writeJSON(MEALS_KEY, meals);
    this.setState({ ratings, meals });
  }
}

function randomId(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Decode a full Open Location Code (plus code) to its centre {lat, lng}.
// Pair-only decoding (10 digits) gives ~14m accuracy, which is plenty for a
// map pin. Short codes without an area prefix can't be resolved standalone.
function decodeOpenLocationCode(codeRaw) {
  const ALPHABET = '23456789CFGHJMPQRVWX';
  let code = String(codeRaw).replace(/\s+/g, '').toUpperCase().replace('+', '').replace(/0+$/, '');
  if (code.length < 8) return null; // need an area code, not just a local short code
  const digits = code.slice(0, 10);
  let lat = -90, lng = -180, place = 20, lastPlace = 20;
  for (let i = 0; i + 1 < digits.length; i += 2) {
    const dLat = ALPHABET.indexOf(digits[i]);
    const dLng = ALPHABET.indexOf(digits[i + 1]);
    if (dLat < 0 || dLng < 0) return null;
    lat += dLat * place;
    lng += dLng * place;
    lastPlace = place;
    place /= 20;
  }
  return { lat: lat + lastPlace / 2, lng: lng + lastPlace / 2 };
}

// Encode lat/lng to a 10-digit plus code (pairs only) - used for short-code recovery.
function encodeOpenLocationCode(lat, lng) {
  const ALPHABET = '23456789CFGHJMPQRVWX';
  let latVal = Math.min(180, Math.max(0, lat + 90));
  let lngVal = ((lng + 180) % 360 + 360) % 360;
  let latPlace = 20, lngPlace = 20, code = '';
  for (let i = 0; i < 5; i++) {
    const dLat = Math.min(19, Math.floor(latVal / latPlace));
    latVal -= dLat * latPlace; latPlace /= 20;
    const dLng = Math.min(19, Math.floor(lngVal / lngPlace));
    lngVal -= dLng * lngPlace; lngPlace /= 20;
    code += ALPHABET[dLat] + ALPHABET[dLng];
  }
  return code.slice(0, 8) + '+' + code.slice(8);
}

// Recover a short plus code (e.g. "6PM7+QF") into {lat,lng} near a reference point.
function recoverOpenLocationCode(shortCode, refLat, refLng) {
  const code = String(shortCode).toUpperCase().replace(/\s+/g, '');
  const plusPos = code.indexOf('+');
  const padding = 8 - plusPos;
  if (padding <= 0) return decodeOpenLocationCode(code);
  const resolution = Math.pow(20, 2 - padding / 2);
  const refPrefix = encodeOpenLocationCode(refLat, refLng).replace('+', '').slice(0, padding);
  const decoded = decodeOpenLocationCode(refPrefix + code);
  if (!decoded) return null;
  let { lat, lng } = decoded;
  const half = resolution / 2;
  if (lat > refLat + half) lat -= resolution; else if (lat < refLat - half) lat += resolution;
  if (lng > refLng + half) lng -= resolution; else if (lng < refLng - half) lng += resolution;
  return { lat, lng };
}

export const store = new AppStore();
window.store = store;
