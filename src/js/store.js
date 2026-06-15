// store.js - Unified Client-Side State management

class AppStore {
  constructor() {
    this.state = {
      activeView: 'home', // 'home' | 'catalog' | 'checkout' | 'tracking' | 'apply' | 'track-order' | 'admin-dash' | 'admin-orders' | 'admin-customers'
      meals: [],
      customers: [],
      orders: [],
      delivery: [],
      ratings: [],
      cart: [], // [{ mealId, quantity }]
      activeOrder: null, // Order currently being tracked by customer
      selectedMealId: null, // For details modal
      adminSelectedCustomerId: null, // Admin details view drawer
      orderStatusTimers: {} // Dynamic simulated status updates
    };
    
    this.listeners = [];
  }

  // Register UI updates
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Dispatch state updates
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // Load JSON datasets into state memory
  async init() {
    try {
      const fetchJSON = async (filename) => {
        const res = await fetch(`/data/${filename}`);
        if (!res.ok) throw new Error(`Failed to load ${filename}`);
        return await res.json();
      };

      const [meals, customers, orders, delivery, ratings] = await Promise.all([
        fetchJSON('meals.json'),
        fetchJSON('customers.json'),
        fetchJSON('orders.json'),
        fetchJSON('delivery.json'),
        fetchJSON('ratings.json')
      ]);

      this.state.meals = meals;
      this.state.customers = customers;
      this.state.orders = orders;
      this.state.delivery = delivery;
      this.state.ratings = ratings;

      // Load cart from LocalStorage if present
      const cachedCart = localStorage.getItem('dumplingdesk_cart') || localStorage.getItem('hotmeal_cart');
      if (cachedCart) {
        this.state.cart = JSON.parse(cachedCart);
      }

      this.notify();
    } catch (err) {
      console.error("Error loading JSON datasets:", err);
    }
  }

  // --- Cart Actions ---
  addToCart(mealId, qty = 1) {
    const cart = [...this.state.cart];
    const existingIndex = cart.findIndex(item => item.mealId === mealId);
    
    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({ mealId, quantity: qty });
    }

    this.saveCart(cart);
  }

  removeFromCart(mealId) {
    const cart = this.state.cart.filter(item => item.mealId !== mealId);
    this.saveCart(cart);
  }

  updateCartQuantity(mealId, quantity) {
    if (quantity <= 0) {
      this.removeFromCart(mealId);
      return;
    }
    const cart = this.state.cart.map(item => 
      item.mealId === mealId ? { ...item, quantity } : item
    );
    this.saveCart(cart);
  }

  clearCart() {
    this.saveCart([]);
  }

  saveCart(cart) {
    this.state.cart = cart;
    localStorage.setItem('dumplingdesk_cart', JSON.stringify(cart));
    this.notify();
  }

  getCartTotal() {
    return this.state.cart.reduce((sum, item) => {
      const meal = this.state.meals.find(m => m.mealId === item.mealId);
      return sum + (meal ? meal.price * item.quantity : 0);
    }, 0);
  }

  getCartCount() {
    return this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  // --- Checkout and Simulated Order Tracking ---
  placeOrder(addressDetails) {
    const orderId = `ord_${randomId(1000, 9999)}`;
    const trackingId = `track_${randomId(8000, 9999)}`;
    const lineItems = this.state.cart.map(item => ({ ...item }));
    const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = this.getCartTotal();
    const deliveryFee = Number(addressDetails.deliveryFee || 0);
    
    // Create new order record
    const newOrder = {
      orderId,
      customerId: 'cust_001', // Standard guest customer ID
      mealId: lineItems[0].mealId, // Main item reference for existing admin queries
      lineItems,
      quantity: totalQuantity,
      amount: parseFloat((subtotal + deliveryFee).toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      deliveryFee,
      status: 'received',
      orderDate: new Date().toISOString()
    };

    // Create delivery tracking record
    const newTracking = {
      trackingId,
      orderId,
      status: 'received',
      estimatedTime: new Date(Date.now() + 45 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      driverName: 'Campus Cold Courier',
      driverPhone: '+60 12-778 4520',
      details: addressDetails
    };

    // Update memory cache
    this.state.orders.unshift(newOrder);
    this.state.delivery.unshift(newTracking);
    
    // Set active customer order being tracked
    this.state.activeOrder = newOrder;
    this.clearCart();
    this.setState({ activeView: 'tracking' });

    // Start simulation timer
    this.startOrderSimulation(orderId);
  }

  startOrderSimulation(orderId) {
    if (this.state.orderStatusTimers[orderId]) {
      clearInterval(this.state.orderStatusTimers[orderId]);
    }

    const statuses = ['received', 'preparing', 'cooking', 'out_for_delivery', 'delivered'];
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= statuses.length) {
        clearInterval(timer);
        delete this.state.orderStatusTimers[orderId];
        return;
      }
      
      const newStatus = statuses[currentStep];
      this.updateOrderStatus(orderId, newStatus);
    }, 15000); // Step every 15 seconds for demonstration

    this.state.orderStatusTimers[orderId] = timer;
  }

  updateOrderStatus(orderId, status) {
    const orders = this.state.orders.map(o => 
      o.orderId === orderId ? { ...o, status } : o
    );
    const delivery = this.state.delivery.map(d => 
      d.orderId === orderId ? { ...d, status } : d
    );
    
    // Check if updating currently tracked order
    let activeOrder = this.state.activeOrder;
    if (activeOrder && activeOrder.orderId === orderId) {
      activeOrder = { ...activeOrder, status };
    }

    this.setState({ orders, delivery, activeOrder });
  }

  // --- Admin operations ---
  deleteMeal(mealId) {
    const meals = this.state.meals.filter(m => m.mealId !== mealId);
    this.setState({ meals });
  }

  addReview(mealId, rating, reviewText) {
    const newRating = {
      ratingId: `rate_${randomId(9100, 9999)}`,
      customerId: 'cust_001',
      mealId,
      rating: parseInt(rating),
      review: reviewText
    };
    
    // Recalculating meal rating average
    const mealReviews = this.state.ratings.filter(r => r.mealId === mealId).concat(newRating);
    const avg = parseFloat((mealReviews.reduce((sum, r) => sum + r.rating, 0) / mealReviews.length).toFixed(1));

    const meals = this.state.meals.map(m => 
      m.mealId === mealId ? { ...m, rating: avg } : m
    );

    const ratings = [newRating, ...this.state.ratings];
    this.setState({ ratings, meals });
  }
}

function randomId(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const store = new AppStore();
window.store = store; // For console debugging if necessary
