// Step 1: a dim study wall and a brass lens. No beam yet, that's step 2!
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

function draw() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // wall: dark warm gradient
  const wall = ctx.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, '#2a1f19');
  wall.addColorStop(1, '#1a120e');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h);

  // wooden panel stripes, so it feels like a study
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  const gap = Math.max(60, w / 14);
  for (let x = gap / 2; x < w; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // a dark vignette around the edges
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  drawLens(w / 2, h / 2, Math.min(w, h) * 0.22);
}

// the brass lens: rings of metal around a glassy amber centre
function drawLens(cx, cy, r) {
  // soft shadow on the wall
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(cx + r * 0.06, cy + r * 0.08, r * 1.08, 0, Math.PI * 2);
  ctx.fill();

  // outer brass ring
  const brass = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  brass.addColorStop(0, '#e8c36a');
  brass.addColorStop(0.5, '#8a6420');
  brass.addColorStop(1, '#c79a40');
  ctx.fillStyle = brass;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // inner groove
  ctx.strokeStyle = '#4a3410';
  ctx.lineWidth = r * 0.04;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();

  // bolts around the rim
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    ctx.fillStyle = '#5a4012';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.91, cy + Math.sin(a) * r * 0.91, r * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  // glass: amber glow with concentric lens rings
  const glass = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.05, cx, cy, r * 0.78);
  glass.addColorStop(0, '#fff2c0');
  glass.addColorStop(0.5, '#e9a93a');
  glass.addColorStop(1, '#8a5412');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,230,160,0.35)';
  ctx.lineWidth = r * 0.02;
  for (const k of [0.62, 0.46, 0.3, 0.16]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * k, 0, Math.PI * 2);
    ctx.stroke();
  }

  // little highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.3, cy - r * 0.35, r * 0.12, r * 0.06, -0.7, 0, Math.PI * 2);
  ctx.fill();
}

window.addEventListener('resize', draw);
draw();
