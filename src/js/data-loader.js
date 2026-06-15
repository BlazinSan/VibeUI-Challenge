// data-loader.js - High performance local querying engine for static datasets

import { store } from './store.js';

export const dataLoader = {
  // Query meals catalog with multiple parameters
  queryMeals({ search = '', category = 'All', sortBy = 'name', page = 1, limit = 12 } = {}) {
    let list = [...store.state.meals];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(m => 
        m.mealName.toLowerCase().includes(q) || 
        m.category.toLowerCase().includes(q) ||
        (m.packSize && m.packSize.toLowerCase().includes(q)) ||
        (m.badge && m.badge.toLowerCase().includes(q)) ||
        (m.freezerLife && m.freezerLife.toLowerCase().includes(q)) ||
        (m.ingredients && m.ingredients.some(i => i.toLowerCase().includes(q)))
      );
    }

    // Category filter
    if (category !== 'All') {
      list = list.filter(m => m.category === category);
    }

    // Sort order
    if (sortBy === 'name') {
      list.sort((a, b) => a.mealName.localeCompare(b.mealName));
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    // Paginated results
    const total = list.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages
    };
  },

  // Query order records (Admin context with 300+ items)
  queryOrders({ search = '', status = 'All', page = 1, limit = 15 } = {}) {
    let list = [...store.state.orders];

    // Search filter (Order ID or Customer ID / Name lookup)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(o => {
        const cust = store.state.customers.find(c => c.customerId === o.customerId);
        const custName = cust ? cust.name.toLowerCase() : '';
        const trackingId = String(o.trackingId || '').toLowerCase();
        return o.orderId.toLowerCase().includes(q) || trackingId.includes(q) || custName.includes(q);
      });
    }

    // Status filter
    if (status !== 'All') {
      list = list.filter(o => o.status === status);
    }

    // Sort: newest first
    list.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    const total = list.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit).map(o => {
      const customer = store.state.customers.find(c => c.customerId === o.customerId);
      const meal = store.state.meals.find(m => m.mealId === o.mealId);
      const tracking = store.state.delivery.find(d => d.orderId === o.orderId);
      return {
        ...o,
        customerName: customer ? customer.name : 'Guest User',
        mealName: meal ? meal.mealName : 'Menu item',
        estimatedTime: tracking ? tracking.estimatedTime : '--:--'
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages
    };
  },

  // Query customer details (Admin context with 250+ items)
  queryCustomers({ search = '', page = 1, limit = 15 } = {}) {
    let list = [...store.state.customers];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q) || 
        c.phone.includes(q) ||
        c.location.toLowerCase().includes(q)
      );
    }

    // Sort: alphabetically
    list.sort((a, b) => a.name.localeCompare(b.name));

    const total = list.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit).map(c => {
      // Aggregate purchase histories
      const customerOrders = store.state.orders.filter(o => o.customerId === c.customerId);
      const totalSpend = customerOrders.reduce((sum, o) => sum + o.amount, 0);
      return {
        ...c,
        orderCount: customerOrders.length,
        totalSpend: parseFloat(totalSpend.toFixed(2))
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages
    };
  },

  // Get ratings matching a meal ID
  getMealRatings(mealId) {
    return store.state.ratings
      .filter(r => r.mealId === mealId)
      .map(r => {
        const customer = store.state.customers.find(c => c.customerId === r.customerId);
        return {
          ...r,
          customerName: customer ? customer.name : 'Anonymous Reviewer'
        };
      });
  },

  // Fetch admin summary statistics
  getAdminMetrics() {
    const orders = store.state.orders;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
    const activeOrders = orders.filter(o => o.status !== 'delivered').length;
    
    // Average rating
    const ratings = store.state.ratings;
    const avgRating = ratings.length > 0 
      ? parseFloat((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2))
      : 0;

    // Popular meals ranking
    const mealQuantities = {};
    orders.forEach(o => {
      const items = o.lineItems?.length ? o.lineItems : [{ mealId: o.mealId, quantity: o.quantity }];
      items.forEach((item) => {
        mealQuantities[item.mealId] = (mealQuantities[item.mealId] || 0) + Number(item.quantity || 0);
      });
    });

    const popularMeals = Object.entries(mealQuantities)
      .map(([mealId, quantity]) => {
        const meal = store.state.meals.find(m => m.mealId === mealId);
        return {
          mealId,
          quantity,
          mealName: meal ? meal.mealName : 'Unknown Meal',
          price: meal ? meal.price : 0,
          category: meal ? meal.category : 'N/A'
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Sales by date logic (last 7 days aggregate)
    const salesTimeline = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      salesTimeline[key] = { label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }), amount: 0 };
    }

    orders.forEach(o => {
      const dateKey = o.orderDate.split('T')[0];
      if (salesTimeline[dateKey]) {
        salesTimeline[dateKey].amount += o.amount;
      }
    });

    return {
      kpis: {
        totalOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        activeOrders,
        avgRating
      },
      popularMeals,
      revenueChart: Object.values(salesTimeline)
    };
  }
};
