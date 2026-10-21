import { clamp, easeOutQuad, randomRange } from "./utils.js";

const DESIGN_WIDTH = 1240;
const DESIGN_HEIGHT = 698;

const PALETTES = [
  ["#FF4D6D", "#FF8FA3", "#C9184A"],
  ["#FF7A59", "#FFB199", "#E85D75"],
  ["#E8C07D", "#F5E1B8", "#C9A45C"],
  ["#B892FF", "#D6C4FF", "#8E6BD9"]
];

export class Fireworks {
  constructor(canvas, { max = 8, interval = [1500, 3000] } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = DESIGN_WIDTH;
    this.height = DESIGN_HEIGHT;
    this.max = max;
    this.interval = interval;
    this.rockets = [];
    this.particles = [];
    this.active = false;
    this.opacity = 1;
    this.lastAuto = 0;
    this.nextAuto = 900;
    this.lastLaunch = 0;
    this.flash = 0;
    this.resize();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  setActive(value) {
    this.active = value;
    if (value) {
      this.lastAuto = performance.now();
      this.nextAuto = 650;
    }
  }

  setOpacity(value) {
    this.opacity = value;
    this.canvas.style.opacity = String(value);
  }

  clear() {
    this.rockets = [];
    this.particles = [];
    this.flash = 0;
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  launch(x = randomRange(180, 1060)) {
    if (this.rockets.length + this.particles.length / 120 >= this.max) return;
    const now = performance.now();
    if (now - this.lastLaunch < 250) return;
    this.lastLaunch = now;
    const startY = this.height + 8;
    const targetY = randomRange(120, 330);
    const duration = randomRange(900, 1200);
    this.rockets.push({
      x: clamp(x, 110, this.width - 110),
      y: startY,
      startY,
      targetY,
      duration,
      startTime: now,
      trail: [],
      exploded: false
    });
  }

  explode(rocket) {
    const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    const count = 160;
    this.flash = 0.1;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const heartX = 16 * Math.pow(Math.sin(angle), 3);
      const heartY = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
      const scale = randomRange(72, 108);
      const vx = (heartX / 16) * scale + randomRange(-9, 9);
      const vy = (heartY / 15) * scale + randomRange(-9, 9);
      const life = randomRange(2.2, 3.2);
      this.particles.push({
        x: rocket.x,
        y: rocket.y,
        vx,
        vy,
        life,
        maxLife: life,
        size: randomRange(1.3, 2.4),
        color: palette[Math.floor(Math.random() * palette.length)],
        trail: []
      });
    }
  }

  update(now, dt) {
    const delta = clamp(dt, 0, 32) / 1000;
    if (this.active && now - this.lastAuto > this.nextAuto) {
      this.launch();
      this.lastAuto = now;
      this.nextAuto = randomRange(this.interval[0], this.interval[1]);
    }

    this.flash *= Math.pow(0.84, delta * 60);

    for (let i = this.rockets.length - 1; i >= 0; i -= 1) {
      const rocket = this.rockets[i];
      const progress = clamp((now - rocket.startTime) / rocket.duration, 0, 1);
      const eased = easeOutQuad(progress);
      rocket.y = rocket.startY + (rocket.targetY - rocket.startY) * eased;
      rocket.x += Math.sin(progress * 8) * 0.08;
      rocket.trail.push({ x: rocket.x, y: rocket.y });
      if (rocket.trail.length > 8) rocket.trail.shift();
      if (progress >= 1) {
        this.explode(rocket);
        this.rockets.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 4) p.trail.shift();
      p.vy += 70 * delta;
      p.vx *= Math.pow(0.992, delta * 60);
      p.vy *= Math.pow(0.992, delta * 60);
      p.x += p.vx * delta;
      p.y += p.vy * delta;
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = "lighter";

    for (const rocket of this.rockets) {
      if (rocket.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(rocket.trail[0].x, rocket.trail[0].y);
        for (let i = 1; i < rocket.trail.length; i += 1) {
          ctx.lineTo(rocket.trail[i].x, rocket.trail[i].y);
        }
        ctx.strokeStyle = "rgba(255,214,222,0.48)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#FFD6DE";
      ctx.beginPath();
      ctx.arc(rocket.x, rocket.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of this.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i += 1) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        ctx.globalAlpha = alpha * 0.26;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
      ctx.globalAlpha = alpha * 0.16;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.flash > 0.005) {
      ctx.globalAlpha = this.flash;
      ctx.fillStyle = "#FFF4F6";
      ctx.fillRect(0, 0, this.width, this.height);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}
