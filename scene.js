// Step 4: a click changes the beam's speed. Motes are now bigger and more plentiful.
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const hint = document.getElementById('hint');

let w = 0, h = 0, dpr = 1;
let wallLayer = null;
let angle = -0.5;
let lastTime = null;
// speeds to cycle through on each click (radians per second)
const SPEEDS = [0.8, 1.6, 3.0, 0.3];
let speedIndex = 0;
let speed = SPEEDS[0];      // the current, smoothly changing speed
const HALF = 0.16;
const TAU = Math.PI * 2;

// dust motes live in 0..1 space so they survive resizing
const motes = [];
for (let i = 0; i < 220; i++) {
  motes.push({
    x: Math.random(), y: Math.random(),
    vx: (Math.random() - 0.5) * 0.02,
    vy: -0.01 - Math.random() * 0.025,
    size: 1.4 + Math.random() * 2.4,
    phase: Math.random() * TAU,
    wob: 0.005 + Math.random() * 0.012
  });
}

// a click or tap moves to the next speed
function nextSpeed() {
  speedIndex = (speedIndex + 1) % SPEEDS.length;
  hint.textContent = 'beam speed ' + (speedIndex + 1) + ' of ' + SPEEDS.length + ' - click again';
}
canvas.addEventListener('pointerdown', nextSpeed);
window.addEventListener('keydown', function (e) {
  if (e.key === ' ' || e.key === 'Enter') nextSpeed();
});

function resize() {
  dpr = window.devicePixelRatio || 1;
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
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

function drawBeam(cx, cy, a, strength) {
  const len = Math.hypot(w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = strength;
  ctx.translate(cx, cy);
  ctx.rotate(a);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, len * 0.8);
  g.addColorStop(0, 'rgba(255,214,130,0.7)');
  g.addColorStop(0.5, 'rgba(255,170,80,0.35)');
  g.addColorStop(1, 'rgba(255,150,60,0.12)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, len, -HALF, HALF);
  ctx.closePath();
  ctx.fill();
  const g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, len * 0.8);
  g2.addColorStop(0, 'rgba(255,240,200,0.5)');
  g2.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, len, -HALF * 0.35, HALF * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function angDiff(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function lightAt(x, y, cx, cy) {
  const a = Math.atan2(y - cy, x - cx);
  const front = Math.max(0, 1 - Math.abs(angDiff(a, angle)) / (HALF * 1.3));
  const back = Math.max(0, 1 - Math.abs(angDiff(a, angle + Math.PI)) / (HALF * 1.3)) * 0.45;
  return Math.max(front, back);
}

function updateMotes(dt, t) {
  for (const m of motes) {
    m.x += (m.vx + Math.sin(t / 1200 + m.phase) * m.wob) * dt;
    m.y += m.vy * dt;
    if (m.x < -0.02) m.x += 1.04;
    if (m.x > 1.02) m.x -= 1.04;
    if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
  }
}

// motes are faintly visible in the dark and sparkle when the beam finds them
function drawMotes(cx, cy) {
  for (const m of motes) {
    const x = m.x * w, y = m.y * h;
    const k = lightAt(x, y, cx, cy);
    const alpha = 0.18 + k * 0.82;
    const s = m.size * (1 + k * 0.7);
    if (k > 0.05) {
      ctx.fillStyle = 'rgba(255,210,140,' + (k * 0.25) + ')';
      ctx.beginPath();
      ctx.arc(x, y, s * 3.2, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,236,190,' + alpha + ')';
    ctx.beginPath();
    ctx.arc(x, y, s, 0, TAU);
    ctx.fill();
  }
}

function drawLens(cx, cy, r, a) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(cx + r * 0.06, cy + r * 0.08, r * 1.08, 0, TAU);
  ctx.fill();

  const brass = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  brass.addColorStop(0, '#e8c36a');
  brass.addColorStop(0.5, '#8a6420');
  brass.addColorStop(1, '#c79a40');
  ctx.fillStyle = brass;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#1b130a';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, TAU);
  ctx.fill();

  const glows = [1, 0.25, 0.5, 0.25];
  for (let i = 0; i < 4; i++) {
    const pa = a + i * Math.PI / 2;
    const gl = glows[i];
    const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 0.8);
    g.addColorStop(0, 'rgba(255,' + Math.round(200 + 50 * gl) + ',' + Math.round(100 + 100 * gl) + ',' + (0.3 + 0.7 * gl) + ')');
    g.addColorStop(1, 'rgba(200,120,30,' + (0.2 + 0.6 * gl) + ')');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r * 0.78, pa - 0.65, pa + 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,55,10,0.55)';
    ctx.lineWidth = r * 0.02;
    for (const k of [0.35, 0.5, 0.65]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * k, pa - 0.65, pa + 0.65);
      ctx.stroke();
    }
    ctx.strokeStyle = '#b88a30';
    ctx.lineWidth = r * 0.05;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(pa + Math.PI / 4) * r * 0.82, cy + Math.sin(pa + Math.PI / 4) * r * 0.82);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,250,220,0.85)';
  ctx.beginPath();
  ctx.arc(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.09, 0, TAU);
  ctx.fill();

  ctx.fillStyle = brass;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.14, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = '#4a3410';
  ctx.lineWidth = r * 0.04;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const b = i * Math.PI / 6;
    ctx.fillStyle = '#5a4012';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(b) * r * 0.91, cy + Math.sin(b) * r * 0.91, r * 0.025, 0, TAU);
    ctx.fill();
  }
}

function frame(t) {
  if (lastTime === null) lastTime = t;
  const dt = Math.min(0.1, (t - lastTime) / 1000);
  lastTime = t;
  // ease toward the chosen speed so a click feels smooth, not jerky
  speed += (SPEEDS[speedIndex] - speed) * Math.min(1, dt * 3);
  angle = (angle + speed * dt) % TAU;
  updateMotes(dt, t);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(wallLayer, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.2;
  drawBeam(cx, cy, angle, 1);
  drawBeam(cx, cy, angle + Math.PI, 0.45);
  drawMotes(cx, cy);
  drawVignette();
  drawLens(cx, cy, r, angle);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);
