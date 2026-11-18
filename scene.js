// Step 2: the warm beam sweeps around the wall!
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

let w = 0, h = 0, dpr = 1;
let wallLayer = null; // the wall is drawn once and reused (cheaper)
let angle = 0;        // where the beam points, in radians
let lastTime = null;
const SPEED = 0.6;    // radians per second (a slow sweep)

function resize() {
  dpr = window.devicePixelRatio || 1;
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  // paint the static wall into an offscreen canvas
  wallLayer = document.createElement('canvas');
  wallLayer.width = canvas.width;
  wallLayer.height = canvas.height;
  const c = wallLayer.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawWall(c);
}

function drawWall(c) {
  const wall = c.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, '#2a1f19');
  wall.addColorStop(1, '#1a120e');
  c.fillStyle = wall;
  c.fillRect(0, 0, w, h);

  // wooden panel stripes, so it feels like a study
  c.strokeStyle = 'rgba(0,0,0,0.25)';
  c.lineWidth = 2;
  const gap = Math.max(60, w / 14);
  for (let x = gap / 2; x < w; x += gap) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, h);
    c.stroke();
  }
}

function drawVignette() {
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

// the beam: a soft cone of warm light that starts at the lens
function drawBeam(cx, cy, a) {
  const len = Math.hypot(w, h);
  const half = 0.2; // half-width of the cone, in radians
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(cx, cy);
  ctx.rotate(a);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, len);
  g.addColorStop(0, 'rgba(255,214,130,0.55)');
  g.addColorStop(0.5, 'rgba(255,180,90,0.22)');
  g.addColorStop(1, 'rgba(255,160,70,0.05)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, len, -half, half);
  ctx.closePath();
  ctx.fill();
  // a brighter, thinner core in the middle
  const g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, len);
  g2.addColorStop(0, 'rgba(255,240,200,0.4)');
  g2.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, len, -half * 0.35, half * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// the brass lens: rings of metal around a glassy amber centre
function drawLens(cx, cy, r) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(cx + r * 0.06, cy + r * 0.08, r * 1.08, 0, Math.PI * 2);
  ctx.fill();

  const brass = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  brass.addColorStop(0, '#e8c36a');
  brass.addColorStop(0.5, '#8a6420');
  brass.addColorStop(1, '#c79a40');
  ctx.fillStyle = brass;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#4a3410';
  ctx.lineWidth = r * 0.04;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    ctx.fillStyle = '#5a4012';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.91, cy + Math.sin(a) * r * 0.91, r * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

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

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.3, cy - r * 0.35, r * 0.12, r * 0.06, -0.7, 0, Math.PI * 2);
  ctx.fill();
}

// every frame: wall, beam, vignette, lens on top
function frame(t) {
  if (lastTime === null) lastTime = t;
  const dt = Math.min(0.1, (t - lastTime) / 1000); // clamp so a hidden tab doesn't jump
  lastTime = t;
  angle = (angle + SPEED * dt) % (Math.PI * 2);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(wallLayer, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.22;
  drawBeam(cx, cy, angle);
  drawVignette();
  drawLens(cx, cy, r);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);
