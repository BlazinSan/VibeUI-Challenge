// tracking.js - Tracking stepper and Leaflet/OpenStreetMap rendering

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function renderTrackingStepper(status) {
  const steps = [
    { key: 'received', label: 'Order received', desc: 'Your order request is in the queue.' },
    { key: 'preparing', label: 'Payment confirmed', desc: 'Payment or COD confirmation is logged.' },
    { key: 'cooking', label: 'Packing order', desc: 'Meals, dumplings, and sauces are being packed.' },
    { key: 'out_for_delivery', label: 'Out for shipment', desc: 'Courier is carrying the HotMealBa order.' },
    { key: 'delivered', label: 'Delivered', desc: 'The order has reached the address.' }
  ];

  const statusIndices = {
    'received': 0,
    'preparing': 1,
    'cooking': 2,
    'out_for_delivery': 3,
    'delivered': 4
  };

  const currentIndex = statusIndices[status] !== undefined ? statusIndices[status] : 0;

  let stepperHtml = '';

  steps.forEach((step, idx) => {
    const isCompleted = idx < currentIndex;
    const isActive = idx === currentIndex;
    
    // Classes
    let circleColor = 'border-background-dark bg-background-card text-secondary/50';
    let lineClass = 'bg-background-dark';
    let labelClass = 'text-secondary';
    let ringClass = '';

    if (isCompleted) {
      circleColor = 'bg-success border-success text-white';
      lineClass = 'bg-success';
      labelClass = 'text-primary font-medium';
    } else if (isActive) {
      circleColor = 'bg-accent border-accent text-white shadow-accent-glow';
      lineClass = 'bg-background-dark';
      labelClass = 'text-accent font-semibold';
      ringClass = 'map-pulse';
    }

    stepperHtml += `
      <div class="flex-1 relative flex flex-col items-center">
        <!-- Connecting Line -->
        ${idx < steps.length - 1 ? `
          <div class="absolute top-5 left-1/2 w-full h-1 -translate-y-1/2 z-0">
            <div class="h-full w-full ${lineClass} transition-all duration-500"></div>
          </div>
        ` : ''}
        
        <!-- Step Circle -->
        <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center relative z-10 transition-all duration-500 ${circleColor} ${ringClass}">
          ${isCompleted ? `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
            </svg>
          ` : `
            <span class="text-xs font-semibold">${idx + 1}</span>
          `}
        </div>

        <!-- Step Label (desktop) -->
        <div class="mt-3 text-center hidden md:block px-2">
          <div class="text-sm ${labelClass}">${step.label}</div>
          <div class="text-[10px] text-secondary mt-0.5 max-w-[120px] mx-auto leading-snug">${step.desc}</div>
        </div>
      </div>
    `;
  });

  // Mobile active step description
  const activeStep = steps[currentIndex];
  
  return `
    <div>
      <div class="flex items-center justify-between w-full relative mb-6">
        ${stepperHtml}
      </div>
      <!-- Mobile Info Panel -->
      <div class="md:hidden glass-card rounded-lg p-4 border border-accent/10 mt-4 text-center">
        <h4 class="text-accent text-sm font-semibold mb-1">${activeStep.label}</h4>
        <p class="text-charcoal-light text-xs">${activeStep.desc}</p>
      </div>
    </div>
  `;
}

export function renderLeafletMap(orderId) {
  return `
    <div class="relative w-full aspect-[2/1] rounded-lg overflow-hidden border border-background-dark shadow-premium min-h-[260px]">
      <div id="tracking-map-${orderId}" class="h-full w-full bg-background" data-native-scroll></div>
      <div class="absolute bottom-4 left-4 bg-background-card/95 backdrop-blur-md px-3.5 py-2 rounded-lg border border-background-dark shadow-md flex items-center gap-3">
        <div class="w-7 h-7 bg-accent/10 rounded-full flex items-center justify-center text-accent">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
          </svg>
        </div>
        <div>
          <h5 class="text-[10px] text-secondary font-medium uppercase">OpenStreetMap</h5>
          <p class="text-xs font-bold text-primary">Location updated by admin</p>
        </div>
      </div>
    </div>
  `;
}

export function mountLeafletTrackingMap(containerId, tracking) {
  const el = document.getElementById(containerId);
  if (!el || el.dataset.mounted === '1') return;
  el.dataset.mounted = '1';

  const hub = tracking?.hub || { lat: 1.5588, lng: 103.6376, label: 'HotMealBa Kitchen' };
  const destination = tracking?.destination || { lat: 1.5625, lng: 103.6408, label: 'Customer address' };
  const current = tracking?.location || hub;

  const map = L.map(el, {
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const pin = (label, color) => L.divIcon({
    className: '',
    html: `<span style="display:grid;place-items:center;width:30px;height:30px;border-radius:999px;background:${color};color:white;border:3px solid white;box-shadow:0 8px 18px rgba(0,0,0,.22);font-size:12px;font-weight:800">${label}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  L.marker([hub.lat, hub.lng], { icon: pin('H', '#1E2A4E') }).addTo(map).bindPopup(hub.label || 'HotMealBa Kitchen');
  L.marker([destination.lat, destination.lng], { icon: pin('A', '#367F65') }).addTo(map).bindPopup(destination.label || 'Customer address');
  L.marker([current.lat, current.lng], { icon: pin('●', '#E7613B') }).addTo(map).bindPopup(current.label || 'Current order location');

  const route = L.polyline([
    [hub.lat, hub.lng],
    [current.lat, current.lng],
    [destination.lat, destination.lng]
  ], {
    color: '#E7613B',
    weight: 4,
    opacity: 0.75,
    dashArray: '8 8'
  }).addTo(map);

  const bounds = route.getBounds().pad(0.35);
  map.fitBounds(bounds.isValid() ? bounds : L.latLngBounds([[hub.lat, hub.lng], [destination.lat, destination.lng]]), {
    maxZoom: 15
  });

  setTimeout(() => map.invalidateSize(), 80);
}
