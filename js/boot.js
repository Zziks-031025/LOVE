import { clamp, easeOutCubic, heartBox, randomRange } from "./utils.js";

const DESIGN_WIDTH = 1240;
const DESIGN_HEIGHT = 698;
const REPEL_RADIUS = 150;
const REPEL_FORCE = 38;

export class BootHeart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = DESIGN_WIDTH;
    this.height = DESIGN_HEIGHT;
    const compactMode = window.innerWidth <= 900 || window.innerHeight < 500;
    this.center = { x: 620, y: compactMode ? 278 : 320 };
    this.box = heartBox(compactMode ? 360 : 410, compactMode ? 280 : 350, 0);
    this.particles = [];
    this.pointer = { x: 0, y: 0, active: false };
    this.startedAt = 0;
    this.collapseStartedAt = 0;
    this.collapseFrom = null;
    this.collapsed = false;
    this.visible = true;
    this.sprites = {
      dot: this.makeSprite(64, [
        [0, "rgba(255,255,255,1)"],
        [0.16, "rgba(255,240,244,0.98)"],
        [0.38, "rgba(255,150,170,0.78)"],
        [0.68, "rgba(255,88,118,0.3)"],
        [1, "rgba(255,77,109,0)"]
      ]),
      glow: this.makeSprite(96, [
        [0, "rgba(255,170,186,0.5)"],
        [0.45, "rgba(255,110,138,0.24)"],
        [1, "rgba(255,77,109,0)"]
      ])
    };
    this.resize();
    this.build();
  }

  makeSprite(size, stops) {
    const sprite = document.createElement("canvas");
    sprite.width = size;
    sprite.height = size;
    const spriteCtx = sprite.getContext("2d");
    const half = size / 2;
    const gradient = spriteCtx.createRadialGradient(half, half, 0, half, half, half);
    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    spriteCtx.fillStyle = gradient;
    spriteCtx.beginPath();
    spriteCtx.arc(half, half, half, 0, Math.PI * 2);
    spriteCtx.fill();
    return sprite;
  }

  resize() {
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  build() {
    this.particles = [];
    const outlineCount = 420;
    const innerCount = 240;
    const glowCount = 190;

    for (let i = 0; i < outlineCount; i += 1) {
      const t = (i / outlineCount) * Math.PI * 2 + randomRange(-0.004, 0.004);
      const point = this.box.point(t);
      this.pushParticle({
        x: point.x + randomRange(-2.6, 2.6),
        y: point.y + randomRange(-2.6, 2.6),
        size: randomRange(1.1, 2.6),
        alpha: randomRange(0.5, 1)
      });
    }

    for (let i = 0; i < innerCount; i += 1) {
      // 内层粒子沿轮廓缩放填充；避开中轴，否则画面正中会叠出一条竖线。
      let point = this.box.point(Math.random() * Math.PI * 2);
      for (let tries = 0; tries < 6 && Math.abs(point.x) < 11; tries += 1) {
        point = this.box.point(Math.random() * Math.PI * 2);
      }
      const radius = Math.sqrt(Math.random()) * 0.78;
      this.pushParticle({
        x: point.x * radius + randomRange(-3, 3),
        y: point.y * radius + randomRange(-3, 3),
        size: randomRange(0.8, 1.9),
        alpha: randomRange(0.24, 0.56)
      });
    }

    for (let i = 0; i < glowCount; i += 1) {
      const t = (i / glowCount) * Math.PI * 2 + randomRange(-0.02, 0.02);
      const point = this.box.point(t);
      this.pushParticle({
        x: point.x + randomRange(-5, 5),
        y: point.y + randomRange(-5, 5),
        size: randomRange(2.4, 5.2),
        alpha: randomRange(0.16, 0.34),
        layer: "glow"
      });
    }
  }

  pushParticle({ x, y, size, alpha, layer = "dot" }) {
    const startX = this.center.x + randomRange(-9, 9);
    const startY = this.center.y + randomRange(-9, 9);
    this.particles.push({
      targetX: this.center.x + x,
      targetY: this.center.y + y,
      startX,
      startY,
      x: startX,
      y: startY,
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
      size,
      alpha,
      layer,
      delay: randomRange(0, 0.35),
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: randomRange(0.7, 1.9),
      driftAmp: layer === "glow" ? randomRange(1.4, 3.2) : randomRange(0.7, 2.2),
      driftPhase: Math.random() * Math.PI * 2,
      driftSpeed: randomRange(0.6, 1.4),
      flashStart: -1e9,
      flashAt: 0
    });
  }

  start() {
    this.startedAt = performance.now();
    this.collapseStartedAt = 0;
    this.collapseFrom = null;
    this.collapsed = false;
    this.visible = true;
    this.canvas.style.visibility = "visible";
    this.canvas.style.opacity = "1";
  }

  collapse(onComplete) {
    if (this.collapsed) return;
    this.collapsed = true;
    this.collapseStartedAt = performance.now();
    this.collapseFrom = this.particles.map((particle) => ({
      x: particle.x + particle.dx,
      y: particle.y + particle.dy
    }));
    this.onCollapseComplete = onComplete;
  }

  setVisible(value) {
    this.visible = value;
    this.canvas.style.visibility = value ? "visible" : "hidden";
  }

  setPointer(x, y, active = true) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.active = active;
  }

  clearPointer() {
    this.pointer.active = false;
  }

  update(now, dt) {
    if (!this.visible) return;
    const elapsed = now - this.startedAt;
    const collapseProgress = this.collapseStartedAt
      ? clamp((now - this.collapseStartedAt) / 400, 0, 1)
      : 0;
    const pointer = this.pointer;
    const interacting = pointer.active && !this.collapseStartedAt;

    this.particles.forEach((particle, index) => {
      if (this.collapseStartedAt) {
        const from = this.collapseFrom[index];
        const eased = easeOutCubic(collapseProgress);
        particle.x = from.x + (this.center.x - from.x) * eased;
        particle.y = from.y + (this.center.y - from.y) * eased;
        particle.dx *= 0.8;
        particle.dy *= 0.8;
        return;
      }

      const local = clamp((elapsed / 1350 - particle.delay) / 0.65, 0, 1);
      const eased = easeOutCubic(local);
      particle.x = particle.startX + (particle.targetX - particle.startX) * eased;
      particle.y = particle.startY + (particle.targetY - particle.startY) * eased;

      let pushX = 0;
      let pushY = 0;
      if (interacting) {
        const pointX = particle.x + particle.dx;
        const pointY = particle.y + particle.dy;
        const offsetX = pointX - pointer.x;
        const offsetY = pointY - pointer.y;
        const distance = Math.hypot(offsetX, offsetY);
        if (distance > 0.001 && distance < REPEL_RADIUS) {
          const force = REPEL_FORCE * (1 - distance / REPEL_RADIUS);
          pushX = (offsetX / distance) * force;
          pushY = (offsetY / distance) * force;
        }
      }

      particle.vx += (pushX - particle.dx) * 0.08;
      particle.vy += (pushY - particle.dy) * 0.08;
      particle.vx *= 0.86;
      particle.vy *= 0.86;
      particle.dx += particle.vx;
      particle.dy += particle.vy;

      if (particle.flashAt === 0) {
        particle.flashAt = now + randomRange(600, 4600);
      } else if (now >= particle.flashAt) {
        particle.flashStart = now;
        particle.flashAt = now + randomRange(1600, 5600);
      }
    });

    if (collapseProgress >= 1 && this.onCollapseComplete) {
      const callback = this.onCollapseComplete;
      this.onCollapseComplete = null;
      callback();
    }
  }

  render(now) {
    if (!this.visible) return;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = "lighter";

    this.particles.forEach((particle) => {
      const twinkle = 0.62 + 0.38 * Math.sin(now * 0.001 * particle.twinkleSpeed + particle.phase);
      let flash = 0;
      if (particle.flashStart > 0) {
        const flashT = (now - particle.flashStart) / 190;
        if (flashT < 1) flash = Math.sin(flashT * Math.PI);
      }
      const driftX = Math.sin(now * 0.00055 * particle.driftSpeed + particle.driftPhase) * particle.driftAmp;
      const driftY = Math.cos(now * 0.00042 * particle.driftSpeed + particle.driftPhase * 1.6) * particle.driftAmp * 0.8;
      const alpha = clamp(particle.alpha * twinkle + flash * 0.6, 0, 1);
      const scale = 1 + flash * 0.9;
      const sprite = particle.layer === "glow" ? this.sprites.glow : this.sprites.dot;
      const size = particle.size * (particle.layer === "glow" ? 6.6 : 4.4) * scale;
      const x = particle.x + particle.dx + driftX;
      const y = particle.y + particle.dy + driftY;
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
    });

    // 起始光点与归位时的心口亮点。
    const elapsed = now - this.startedAt;
    const pointAlpha = elapsed < 260 ? 1 - elapsed / 260 : 0;
    if (pointAlpha > 0) {
      const g = ctx.createRadialGradient(this.center.x, this.center.y, 0, this.center.x, this.center.y, 34);
      g.addColorStop(0, `rgba(255,255,255,${pointAlpha})`);
      g.addColorStop(0.24, `rgba(255,143,163,${pointAlpha * 0.7})`);
      g.addColorStop(1, "rgba(255,77,109,0)");
      ctx.fillStyle = g;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(this.center.x, this.center.y, 34, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}
