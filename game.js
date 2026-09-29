'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

// ── Power-ups ─────────────────────────────────────────────────────────────────
const SPEED_BOOST_TIME = 5;                 // duración del boost de velocidad (s)
const SPEED_MULT       = 2;                 // multiplicador de empuje y velocidad tope
const SHIELD_TIME      = 5;                 // duración del escudo (s)
const SHIELD_COLOR     = '125, 255, 159';   // color del escudo (verde)
const DROP_CHANCE      = [0, 0.05, 0.10, 0.15];  // prob. de soltarlo al destruir, por tamaño

// ── Triple shot ───────────────────────────────────────────────────────────────
const TRIPLE_TIME   = 5;              // duración del disparo triple (s)
const TRIPLE_SPREAD = Math.PI / 12;   // desviación de las balas laterales (±15°)

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skins de la nave ──────────────────────────────────────────────────────────
const SKIN_KEY = 'asteroids.skin';

// Cada skin define color, color con boost, llama y uno o varios polígonos
// (coordenadas de la nave: nariz en +x). Puramente cosmético.
const SKINS = [
  {
    name: 'CLÁSICA',
    color: '#ffffff',
    boostColor: '#7df9ff',
    flameColor: 'rgba(255, 130, 0, 0.85)',
    flameOffset: -8,
    shapes: [
      [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    ],
  },
  {
    name: 'NEÓN',
    color: '#7df9ff',
    boostColor: '#ff5edb',
    flameColor: 'rgba(255, 94, 219, 0.85)',
    flameOffset: -9,
    shapes: [
      [[22, 0], [-6, -4], [-2, -10], [-14, -8], [-9, 0], [-14, 8], [-2, 10], [-6, 4]],
    ],
  },
  {
    name: 'FÓSFORO',
    color: '#39ff14',
    boostColor: '#d0ff00',
    flameColor: 'rgba(208, 255, 0, 0.85)',
    flameOffset: -10,
    shapes: [
      [[18, 0], [-10, -10], [-5, 0], [-10, 10]],
      [[2, -3], [-4, -14], [-1, -8]],
      [[2, 3], [-4, 14], [-1, 8]],
    ],
  },
  {
    name: 'SOLAR',
    color: '#ff9f43',
    boostColor: '#ffe08a',
    flameColor: 'rgba(255, 224, 138, 0.85)',
    flameOffset: -11,
    shapes: [
      [[21, 0], [-4, -12], [-11, -5], [-8, 0], [-11, 5], [-4, 12]],
    ],
  },
];

function loadSkin() {
  try {
    const i = parseInt(localStorage.getItem(SKIN_KEY), 10);
    if (Number.isInteger(i) && i >= 0 && i < SKINS.length) return i;
  } catch (e) { /* localStorage no disponible */ }
  return 0;
}

function saveSkin(i) {
  try { localStorage.setItem(SKIN_KEY, String(i)); } catch (e) { /* ignorar */ }
}

let skinIndex  = loadSkin();
let skinNotice = 0;   // s restantes mostrando el nombre de la skin

function cycleSkin() {
  skinIndex  = (skinIndex + 1) % SKINS.length;
  skinNotice = 1.5;
  saveSkin(skinIndex);
}

// Traza todos los polígonos de una skin; el llamador fija estilo y transform
function strokeSkin(skin) {
  ctx.beginPath();
  for (const poly of skin.shapes) {
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++)
      ctx.lineTo(poly[i][0], poly[i][1]);
    ctx.closePath();
  }
  ctx.stroke();
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;   // s restantes del power-up «velocidad»
    this.tripleShot    = 0;   // s restantes del disparo triple
    this.shield        = 0;   // s restantes del power-up «escudo»
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;
    if (this.tripleShot    > 0) this.tripleShot    -= dt;
    if (this.shield        > 0) this.shield        -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260 * (this.speedBoost > 0 ? SPEED_MULT : 1);  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot > 0) {
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[skinIndex];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = this.tripleShot > 0 ? '#ff9de2'
                    : this.speedBoost > 0 ? skin.boostColor
                    : skin.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta según la skin activa
    strokeSkin(skin);

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      const fx = skin.flameOffset;
      ctx.beginPath();
      ctx.moveTo(fx, -4);
      ctx.lineTo(fx - rand(6, 14), 0);
      ctx.lineTo(fx,  4);
      ctx.strokeStyle = skin.flameColor;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawShield() {
    const pulse = 1 + Math.sin(performance.now() / 120) * 0.06;
    const ratio = this.shield / SHIELD_TIME;
    // Parpadea cuando está a punto de agotarse
    const alpha = this.shield < 1.5 && Math.floor(this.shield * 6) % 2 === 0 ? 0.2 : 0.55;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = `rgba(${SHIELD_COLOR}, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 26 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(${SHIELD_COLOR}, ${(alpha * ratio).toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 31 * pulse, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-ups ─────────────────────────────────────────────────────────────────
const POWERUP_TYPES = ['speed', 'shield'];

class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.type = POWERUP_TYPES[randInt(0, POWERUP_TYPES.length - 1)];
    const angle = rand(0, Math.PI * 2);
    const speed = rand(15, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 12;
    this.ttl   = 12;              // desaparece solo
    this.phase = rand(0, Math.PI * 2);
    this.dead  = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.phase += dt * 6;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const pulse = 1 + Math.sin(this.phase) * 0.12;
    // Parpadea cuando está a punto de desaparecer
    const alpha = this.ttl < 3 && Math.floor(this.ttl * 5) % 2 === 0 ? 0.15 : 0.7;
    const isShield = this.type === 'shield';

    ctx.save();
    ctx.translate(this.x, this.y);

    // Anillo pulsante
    ctx.strokeStyle = isShield
      ? `rgba(${SHIELD_COLOR}, ${alpha})`
      : `rgba(125, 249, 255, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.scale(pulse, pulse);

    if (isShield) {
      // Escudo
      ctx.strokeStyle = `rgba(${SHIELD_COLOR}, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(7, -5);
      ctx.lineTo(7, 2);
      ctx.quadraticCurveTo(7, 8, 0, 10);
      ctx.quadraticCurveTo(-7, 8, -7, 2);
      ctx.lineTo(-7, -5);
      ctx.closePath();
      ctx.stroke();
    } else {
      // Rayo (relámpago)
      ctx.fillStyle = `rgba(255, 210, 63, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo( -2, -9);
      ctx.lineTo(  5, -9);
      ctx.lineTo(  1, -1);
      ctx.lineTo(  6, -1);
      ctx.lineTo( -4,  9);
      ctx.lineTo( -1,  1);
      ctx.lineTo( -6,  1);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Cambio de skin (cosmético, disponible en cualquier estado)
  if (pressed('KeyC')) cycleSkin();
  if (skinNotice > 0) skinNotice -= dt;

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  // Activar disparo triple
  if (pressed('ShiftLeft') || pressed('ShiftRight')) {
    ship.tripleShot = TRIPLE_TIME;
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);

  // Nave vs power-up
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.type === 'shield') ship.shield = SHIELD_TIME;
      else                     ship.speedBoost = SPEED_BOOST_TIME;
      explode(p.x, p.y, 8);
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (powerups.length < 2 && Math.random() < DROP_CHANCE[a.size])
          powerups.push(new PowerUp(a.x, a.y));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.shield > 0) {
    // El escudo destruye los asteroides que impactan (sin partirlos ni dar puntos)
    for (const a of asteroids) {
      if (!a.dead && dist(ship, a) < ship.radius + a.radius * 0.82) {
        a.dead = true;
        explode(a.x, a.y, a.size * 5);
      }
    }
    asteroids = asteroids.filter(a => !a.dead);
  } else if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin  = SKINS[skinIndex];
  const SCALE = 0.45;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(SCALE, SCALE);
  ctx.strokeStyle = skin.color;
  ctx.lineWidth   = 1.2 / SCALE;
  ctx.lineJoin    = 'round';
  strokeSkin(skin);
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Power-up «velocidad» activo
  if (ship.speedBoost > 0) {
    const ratio = ship.speedBoost / SPEED_BOOST_TIME;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(`VELOCIDAD x${SPEED_MULT}  ${ship.speedBoost.toFixed(1)}s`, W / 2, 46);
    ctx.fillRect(W / 2 - 60, 52, 120 * ratio, 4);
    ctx.strokeStyle = 'rgba(255, 210, 63, 0.5)';
    ctx.lineWidth   = 1;
    ctx.strokeRect(W / 2 - 60, 52, 120, 4);
  }

  // Triple shot activo
  if (ship.tripleShot > 0) {
    const ratio = ship.tripleShot / TRIPLE_TIME;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff9de2';
    ctx.fillText(`TRIPLE x3  ${ship.tripleShot.toFixed(1)}s`, W / 2, 62);
    ctx.fillRect(W / 2 - 60, 68, 120 * ratio, 4);
    ctx.strokeStyle = 'rgba(255, 157, 226, 0.5)';
    ctx.lineWidth   = 1;
    ctx.strokeRect(W / 2 - 60, 68, 120, 4);
  }

  // Aviso de skin recién cambiada
  if (skinNotice > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = SKINS[skinIndex].color;
    ctx.fillText(`SKIN: ${SKINS[skinIndex].name}`, 14, H - 14);
  }

  // Power-up «escudo» activo
  if (ship.shield > 0) {
    const ratio = ship.shield / SHIELD_TIME;
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgb(${SHIELD_COLOR})`;
    ctx.fillText(`ESCUDO  ${ship.shield.toFixed(1)}s`, W / 2, 78);
    ctx.fillRect(W / 2 - 60, 84, 120 * ratio, 4);
    ctx.strokeStyle = `rgba(${SHIELD_COLOR}, 0.5)`;
    ctx.lineWidth   = 1;
    ctx.strokeRect(W / 2 - 60, 84, 120, 4);
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();
  if (ship.shield > 0 && !ship.dead) ship.drawShield();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
