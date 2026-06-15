// cards.js - UI renderer for catalog cards, rating widgets, and category chips

export function renderRatingStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.4;
  let html = '';
  
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      html += `<svg class="w-4 h-4 text-accent fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
    } else if (i === fullStars + 1 && hasHalf) {
      html += `<svg class="w-4 h-4 text-accent fill-current" viewBox="0 0 20 20">
        <defs>
          <linearGradient id="halfStar">
            <stop offset="50%" stop-color="#8B5B1F"/>
            <stop offset="50%" stop-color="#E7DDCF"/>
          </linearGradient>
        </defs>
        <path fill="url(#halfStar)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>`;
    } else {
      html += `<svg class="w-4 h-4 text-secondary/30 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
    }
  }
  return html;
}

export function renderMealCard(meal) {
  const badge = meal.badge || (meal.category === 'Reseller Cases' ? 'Reseller case' : 'Freezer-ready');
  const packSize = meal.packSize || `${meal.prepTime} pcs`;
  const margin = meal.resellerMargin ? `Margin RM ${Number(meal.resellerMargin).toFixed(2)}` : meal.freezerLife || 'Up to 30 days';

  return `
    <div class="group bg-background-card rounded-lg overflow-hidden border border-background-dark shadow-premium hover:shadow-premium-hover transition-all duration-300 animate-slide-up flex flex-col h-full min-h-[390px]">
      <!-- Image container -->
      <div class="relative overflow-hidden cursor-pointer aspect-[4/3] bg-background" onclick="window.app.openMealDetails('${meal.mealId}')">
        <img 
          src="${meal.image}" 
          alt="${meal.mealName}" 
          loading="lazy"
          class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          onerror="this.src='https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&auto=format&fit=crop&q=80'"
        />
        <div class="absolute top-3 left-3 bg-background-card/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-primary shadow-sm border border-background-dark">
          ${badge}
        </div>
        <div class="absolute bottom-3 right-3 bg-primary/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-background flex items-center gap-1">
          <svg class="w-3 h-3 text-accent fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
          ${meal.rating.toFixed(1)}
        </div>
      </div>

      <!-- Info container -->
      <div class="p-4 flex flex-col flex-grow">
        <div class="flex-grow">
          <span class="text-[11px] font-bold text-accent uppercase">${meal.category}</span>
          <h3 class="font-display text-xl text-primary mt-1 group-hover:text-accent transition-colors cursor-pointer line-clamp-2 leading-tight min-h-[56px]" onclick="window.app.openMealDetails('${meal.mealId}')">
            ${meal.mealName}
          </h3>
          <p class="text-secondary text-xs line-clamp-2 mt-2 mb-3 leading-relaxed min-h-[40px]">
            ${meal.description}
          </p>
          <div class="grid grid-cols-2 gap-2 text-[11px] mb-3">
            <span class="rounded-lg border border-background-dark bg-background px-2.5 py-2 text-secondary">
              <strong class="block text-primary">${packSize}</strong>
              Pack size
            </span>
            <span class="rounded-lg border border-background-dark bg-background px-2.5 py-2 text-secondary">
              <strong class="block text-primary">${margin}</strong>
              Seller note
            </span>
          </div>
        </div>
        
        <div class="flex items-center justify-between pt-3 border-t border-background-dark mt-auto">
          <div>
            <span class="text-xs text-secondary block">Price</span>
            <span class="text-xl font-bold text-primary font-display">RM ${meal.price.toFixed(2)}</span>
          </div>
          <button 
            class="bg-accent hover:bg-accent-dark text-white min-w-11 h-11 rounded-lg shadow-accent-glow hover:shadow-none transition-all flex items-center justify-center cursor-pointer active:scale-95"
            onclick="event.stopPropagation(); window.app.addToCart('${meal.mealId}')"
            aria-label="Add ${meal.mealName} to basket"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderCategoryChips(categories, activeCategory, onSelectCallbackName) {
  return categories.map(cat => {
    const isActive = cat === activeCategory;
    const bgClass = isActive 
      ? 'bg-primary text-background shadow-md border-primary' 
      : 'bg-background-card hover:bg-white text-secondary border border-background-dark';
    return `
      <button 
        onclick="window.app.${onSelectCallbackName}('${cat}')"
        class="px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 min-h-11 ${bgClass}"
      >
        ${cat}
      </button>
    `;
  }).join('');
}
