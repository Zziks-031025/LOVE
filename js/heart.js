import {
  clamp,
  createParticleSprite,
  easeInOutSine,
  easeOutQuad,
  heartBox,
  randomRange
} from "./utils.js";

const DESIGN_WIDTH = 1240;
const DESIGN_HEIGHT = 698;

export class Heart2D {
  constructor(canvas, { particleCount = 3000, theme }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particleCount = particleCount;
    this.theme = theme;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = DESIGN_WIDTH;
    this.height = DESIGN_HEIGHT;
    this.center = { x: 620, y: 336 };
    this.box = heartBox(526, 474, 0);
    this.particles = [];
    this.pointer = { x: 0, y: 0, active: false };
    this.beating = true;
    this.beatTime = 0;
    this.time = 0;
    this.scale = 1;
    this.pulse = 0;
    this.visible = true;
    this.opacity = 1;
    this.sprites = [];
    this.maxRadius = Math.max(this.box.width, this.box.height) / 2;
    this.buildSprites();
    this.buildParticles();
    this.resize();
  }

  buildSprites() {
    const { light, primary, deep } = this.theme;
    this.sprites = [
      createParticleSprite(32, light),
      createParticleSprite(32, primary),
      createParticleSprite(32, deep)
    ];
  }

  colorIndexFor(radius) {
    const ratio = clamp(radius / this.maxRadius, 0, 1);
    if (ratio < 0.45) return 0;
    if (ratio < 0.8) return 1;
    return 2;
  }

  addParticle({ outline = true, glow = false } = {}) {
    const t = Math.random() * Math.PI * 2;
    const point = this.box.point(t);
    let x;
    let y;
    let alpha;
    let size;

    if (glow) {
      const spread = randomRange(1.015, 1.11);
      let px = point.x;
      let py = point.y;
      for (let tries = 0; tries < 6 && Math.abs(px) < 14; tries += 1) {
        const next = this.box.point(Math.random() * Math.PI * 2);
        px = next.x;
        py = next.y;
      }
      x = px * spread;
      y = py * spread;
      alpha = randomRange(0.12, 0.34);
      size = randomRange(0.9, 1.9);
    } else if (outline) {
      const jitter = randomRange(1.5, 6);
      const angle = Math.random() * Math.PI * 2;
      x = point.x + Math.cos(angle) * jitter;
      y = point.y + Math.sin(angle) * jitter;
      alpha = randomRange(0.46, 0.88);
      size = randomRange(1.1, 2.8);
    } else {
      const radius = Math.sqrt(Math.random()) * 0.82;
      // 内层粒子沿着轮廓点缩放填充。t≈0 和 t≈π 的点都落在中轴上，
      // 直接缩放在画面正中会叠出一条竖线；这里避开中轴再取样。
      let px = point.x;
      let py = point.y;
      for (let tries = 0; tries < 6 && Math.abs(px) < 14; tries += 1) {
        const next = this.box.point(Math.random() * Math.PI * 2);
        px = next.x;
        py = next.y;
      }
      x = px * radius + randomRange(-3.5, 3.5);
      y = py * radius + randomRange(-3.5, 3.5);
      alpha = randomRange(0.28, 0.62);
      size = randomRange(0.8, 2.1);
    }

    const radius = Math.hypot(x, y);
    this.particles.push({
      baseX: x,
      baseY: y,
      x: x,
      y: y,
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
      size,
      alpha,
      color: this.colorIndexFor(radius),
      glow,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: randomRange(0.5, 1.4)
    });
  }

  buildParticles() {
    this.particles = [];
    const compact = window.innerWidth < 768;
    const countScale = compact ? 0.74 : 1;
    const outlineCount = Math.round(2100 * countScale);
    const innerCount = Math.round(900 * countScale);
    const glowCount = Math.round(800 * countScale);

    for (let i = 0; i < outlineCount; i += 1) this.addParticle({ outline: true });
    for (let i = 0; i < innerCount; i += 1) this.addParticle({ outline: false });
    for (let i = 0; i < glowCount; i += 1) this.addParticle({ outline: true, glow: true });
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  setPointer(x, y, active = true) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.active = active;
  }

  clearPointer() {
    this.pointer.active = false;
  }

  setBeating(value) {
    this.beating = value;
    if (!value) {
      this.scale = 1;
      this.pulse = 0;
    }
  }

  setOpacity(value) {
    this.opacity = value;
    this.canvas.style.opacity = String(value);
    this.visible = value > 0.001;
  }

  setVisible(value) {
    this.visible = value;
    this.canvas.style.visibility = value ? "visible" : "hidden";
  }

  update(dt) {
    if (!this.visible) return;
    const delta = clamp(dt, 0, 32);
    this.time += delta;

    if (this.beating) {
      this.beatTime += delta;
      const phase = (this.beatTime % 1100) / 1100;
      if (phase < 0.2) {
        this.scale = 1 - 0.15 * easeOutQuad(phase / 0.2);
      } else {
        this.scale = 0.85 + 0.15 * easeInOutSine((phase - 0.2) / 0.8);
      }
      this.pulse = (1 - this.scale) / 0.15;
    } else {
      this.scale = 1;
      this.pulse = 0;
    }

    const pointer = this.pointer;
    for (let i = 0; i < this.particles.length; i += 1) {
      const p = this.particles[i];
      const currentX = this.center.x + p.baseX * this.scale;
      const currentY = this.center.y + p.baseY * this.scale;
      let targetX = 0;
      let targetY = 0;

      if (pointer.active) {
        const dx = currentX - pointer.x;
        const dy = currentY - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 0.001 && distance < 120) {
          const force = 28 * (1 - distance / 120);
          targetX = (dx / distance) * force;
          targetY = (dy / distance) * force;
        }
      }

      p.vx += (targetX - p.dx) * 0.08;
      p.vy += (targetY - p.dy) * 0.08;
      p.vx *= 0.86;
      p.vy *= 0.86;
      p.dx += p.vx;
      p.dy += p.vy;
    }
  }

  render() {
    if (!this.visible) return;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < this.particles.length; i += 1) {
      const p = this.particles[i];
      const twinkle = 0.82 + 0.18 * Math.sin(this.time * 0.001 * p.twinkleSpeed + p.twinkle);
      const pulsePush = p.glow ? 20 * this.pulse : 0;
      const radius = Math.hypot(p.baseX, p.baseY) || 1;
      const x = this.center.x + p.baseX * this.scale + (p.baseX / radius) * pulsePush + p.dx;
      const y = this.center.y + p.baseY * this.scale + (p.baseY / radius) * pulsePush + p.dy;
      const size = p.size * 2.3;
      ctx.globalAlpha = p.alpha * twinkle;
      ctx.drawImage(this.sprites[p.color], x - size / 2, y - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}
