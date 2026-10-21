import { clamp, easeOutCubic, heartBox, randomRange } from "./utils.js";

const DESIGN_WIDTH = 1240;
const DESIGN_HEIGHT = 698;

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
    this.startedAt = 0;
    this.collapseStartedAt = 0;
    this.collapseFrom = null;
    this.collapsed = false;
    this.visible = true;
    this.raf = 0;
    this.last = 0;
    this.resize();
    this.build();
  }

  resize() {
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  build() {
    const count = 300;
    this.particles = [];
    for (let i = 0; i < count; i += 1) {
      const t = (i / count) * Math.PI * 2;
      const point = this.box.point(t);
      const jitter = randomRange(-3, 3);
      this.particles.push({
        targetX: this.center.x + point.x + randomRange(-2.5, 2.5),
        targetY: this.center.y + point.y + randomRange(-2.5, 2.5),
        x: this.center.x,
        y: this.center.y,
        delay: randomRange(0, 0.35),
        size: randomRange(0.9, 2.4),
        alpha: randomRange(0.3, 0.85),
        phase: Math.random() * Math.PI * 2,
        jitter
      });
    }
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
    this.collapseFrom = this.particles.map((p) => ({ x: p.x, y: p.y }));
    this.onCollapseComplete = onComplete;
  }

  setVisible(value) {
    this.visible = value;
    this.canvas.style.visibility = value ? "visible" : "hidden";
  }

  update(now, dt) {
    if (!this.visible) return;
    const elapsed = now - this.startedAt;
    const collapseProgress = this.collapseStartedAt
      ? clamp((now - this.collapseStartedAt) / 400, 0, 1)
      : 0;

    this.particles.forEach((particle, index) => {
      const local = clamp((elapsed / 1350 - particle.delay) / 0.65, 0, 1);
      const eased = easeOutCubic(local);
      const targetX = particle.targetX;
      const targetY = particle.targetY;
      if (this.collapseStartedAt) {
        const from = this.collapseFrom[index];
        particle.x = from.x + (this.center.x - from.x) * easeOutCubic(collapseProgress);
        particle.y = from.y + (this.center.y - from.y) * easeOutCubic(collapseProgress);
      } else {
        particle.x = this.center.x + (targetX - this.center.x) * eased;
        particle.y = this.center.y + (targetY - this.center.y) * eased;
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
      const twinkle = 0.75 + 0.25 * Math.sin(now * 0.0016 + particle.phase);
      const size = particle.size * 2.6;
      const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, size * 1.8);
      gradient.addColorStop(0, `rgba(255,255,255,${0.9 * particle.alpha})`);
      gradient.addColorStop(0.3, `rgba(255,143,163,${0.68 * particle.alpha})`);
      gradient.addColorStop(1, "rgba(255,77,109,0)");
      ctx.fillStyle = gradient;
      ctx.globalAlpha = twinkle;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size * 1.8, 0, Math.PI * 2);
      ctx.fill();
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
