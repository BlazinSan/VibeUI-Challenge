// charts.js - Premium lightweight HTML5 Canvas revenue charts (zero external dependencies)

export function renderRevenueChart(canvasId, timelineData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Handle high-density displays (retina screens)
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Configuration
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const values = timelineData.map(d => d.amount);
  const labels = timelineData.map(d => d.label);
  const maxVal = Math.max(...values, 100) * 1.1; // Add 10% headroom

  // Draw Grid Lines and Labels
  const gridCount = 4;
  ctx.strokeStyle = 'rgba(114, 106, 96, 0.16)';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#726A60';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= gridCount; i++) {
    const val = (maxVal / gridCount) * i;
    const y = padding.top + graphHeight - (val / maxVal) * graphHeight;
    
    // Grid line
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    // Axis label
    ctx.fillText(`RM ${Math.round(val)}`, padding.left - 10, y);
  }

  // Draw X-Axis Labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const pointCount = timelineData.length;
  const stepX = graphWidth / (pointCount - 1);

  labels.forEach((label, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + graphHeight + 10;
    ctx.fillText(label, x, y);
  });

  // Draw Gradient area under line
  const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + graphHeight);
  grad.addColorStop(0, 'rgba(139, 91, 31, 0.25)');
  grad.addColorStop(1, 'rgba(139, 91, 31, 0.00)');

  ctx.beginPath();
  timelineData.forEach((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + graphHeight - (d.amount / maxVal) * graphHeight;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      // Draw curve
      const prevX = padding.left + (i - 1) * stepX;
      const prevY = padding.top + graphHeight - (timelineData[i - 1].amount / maxVal) * graphHeight;
      const cpX1 = prevX + stepX / 2;
      const cpY1 = prevY;
      const cpX2 = prevX + stepX / 2;
      const cpY2 = y;
      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y);
    }
  });

  // Close path for fill
  const lastX = padding.left + (pointCount - 1) * stepX;
  ctx.lineTo(lastX, padding.top + graphHeight);
  ctx.lineTo(padding.left, padding.top + graphHeight);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw Smooth Line
  ctx.beginPath();
  timelineData.forEach((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + graphHeight - (d.amount / maxVal) * graphHeight;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      const prevX = padding.left + (i - 1) * stepX;
      const prevY = padding.top + graphHeight - (timelineData[i - 1].amount / maxVal) * graphHeight;
      const cpX1 = prevX + stepX / 2;
      const cpY1 = prevY;
      const cpX2 = prevX + stepX / 2;
      const cpY2 = y;
      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y);
    }
  });

  ctx.strokeStyle = '#8B5B1F';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Draw Points & Tooltips
  timelineData.forEach((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + graphHeight - (d.amount / maxVal) * graphHeight;

    // Outer circle
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#8B5B1F';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Value text above active point
    ctx.fillStyle = '#151412';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`RM ${Math.round(d.amount)}`, x, y - 12);
  });
}
