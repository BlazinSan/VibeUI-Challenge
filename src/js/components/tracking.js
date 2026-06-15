// tracking.js - Custom interactive maps and stepper timeline for Order tracking screen

export function renderTrackingStepper(status) {
  const steps = [
    { key: 'received', label: 'Order received', desc: 'Your pack request is in the order queue.' },
    { key: 'preparing', label: 'Payment confirmed', desc: 'Payment or COD confirmation is logged.' },
    { key: 'cooking', label: 'Packing frozen packs', desc: 'Dumplings and sauces are being packed for shipment.' },
    { key: 'out_for_delivery', label: 'Out for shipment', desc: 'Courier is carrying the frozen pack order.' },
    { key: 'delivered', label: 'Delivered', desc: 'Frozen packs have reached the address.' }
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

export function renderMockMap(status) {
  // SVG coordinates for animation based on statuses
  // Warehouse (Fixed): (50, 150)
  // Delivery Point (Fixed): (350, 50)
  let driverX = 50;
  let driverY = 150;
  let progressPct = 0;

  if (status === 'preparing') {
    progressPct = 5;
  } else if (status === 'cooking') {
    progressPct = 15;
  } else if (status === 'out_for_delivery') {
    progressPct = 60;
  } else if (status === 'delivered') {
    progressPct = 100;
  }

  // Linear path extrapolation
  driverX = 50 + (300 * progressPct) / 100;
  driverY = 150 - (100 * progressPct) / 100;

  return `
    <div class="relative w-full aspect-[2/1] bg-[#E7DDCF] rounded-lg overflow-hidden border border-background-dark shadow-premium min-h-[220px]">
      <svg class="w-full h-full" viewBox="0 0 400 200">
        <!-- Grid Gridlines -->
        <defs>
          <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(114, 106, 96, 0.12)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mapGrid)"/>
        
        <!-- Streets/Roads -->
        <path d="M 50 150 L 120 150 L 120 90 L 250 90 L 250 50 L 350 50" fill="none" stroke="#FFFAF2" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 50 150 L 120 150 L 120 90 L 250 90 L 250 50 L 350 50" fill="none" stroke="#D8CCBC" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Cross street details -->
        <path d="M 120 190 L 120 150" fill="none" stroke="#FFFAF2" stroke-width="12" stroke-linecap="round"/>
        <path d="M 120 190 L 120 150" fill="none" stroke="#D8CCBC" stroke-width="8" stroke-linecap="round"/>
        <path d="M 250 10 L 250 50" fill="none" stroke="#FFFAF2" stroke-width="12" stroke-linecap="round"/>
        <path d="M 250 10 L 250 50" fill="none" stroke="#D8CCBC" stroke-width="8" stroke-linecap="round"/>

        <!-- Route trace line -->
        <path d="M 50 150 L 120 150 L 120 90 L 250 90 L 250 50 L 350 50" fill="none" stroke="#8B5B1F" stroke-width="3" stroke-dasharray="8 4" stroke-linecap="round" class="opacity-70"/>

        <!-- Restaurant Node (Start) -->
        <circle cx="50" cy="150" r="10" fill="#151412" stroke="#FFFAF2" stroke-width="2.5"/>
        <text x="50" y="172" fill="#151412" font-family="Oswald, sans-serif" font-size="8" font-weight="bold" text-anchor="middle">Pack Hub</text>
        
        <!-- Customer Node (Destination) -->
        <circle cx="350" cy="50" r="10" fill="#5E7463" stroke="#FFFAF2" stroke-width="2.5"/>
        <text x="350" y="32" fill="#405344" font-family="Oswald, sans-serif" font-size="8" font-weight="bold" text-anchor="middle">Address</text>

        <!-- Dynamic Delivery Driver Icon Node -->
        ${status !== 'delivered' ? `
          <g transform="translate(${driverX}, ${driverY})" class="transition-all duration-1000 ease-in-out">
            <!-- Ripple Pulse -->
            <circle cx="0" cy="0" r="14" fill="#8B5B1F" class="opacity-20">
              <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
            </circle>
            <!-- Pin -->
            <circle cx="0" cy="0" r="7" fill="#8B5B1F" stroke="#FFFAF2" stroke-width="1.5"/>
            <!-- Tiny Bike/Driver Indicator -->
            <circle cx="0" cy="0" r="2.5" fill="#FFFFFF"/>
          </g>
        ` : ''}
      </svg>
      
      <!-- Overlay Driver Info -->
      <div class="absolute bottom-4 left-4 bg-background-card/95 backdrop-blur-md px-3.5 py-2 rounded-lg border border-background-dark shadow-md flex items-center gap-3">
        <div class="w-7 h-7 bg-accent/10 rounded-full flex items-center justify-center text-accent">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
          </svg>
        </div>
        <div>
          <h5 class="text-[10px] text-secondary font-medium uppercase">Courier</h5>
          <p class="text-xs font-bold text-primary">${status === 'delivered' ? 'Arrived' : 'Campus courier en route'}</p>
        </div>
      </div>
    </div>
  `;
}
