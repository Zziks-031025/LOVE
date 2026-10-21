import { clamp, createParticleSprite, heartBox, randomRange } from "./utils.js";

const DESIGN_WIDTH = 1240;
const DESIGN_HEIGHT = 698;

export class Heart3D {
  constructor(canvas, { theme }) {
    this.canvas = canvas;
    this.theme = theme;
    this.ready = false;
    this.visible = false;
    this.active = false;
    this.interactive = false;
    this.opacity = 0;
    this.autoRotate = true;
    this.rotationY = -0.24;
    this.rotationX = 0;
    this.dragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartRotationX = 0;
    this.resumeAt = 0;
    this.beatTime = 0;
    this.beating = true;
    this.lastFrame = 0;
    this.lastDisperse = 0;
    this.disperseStart = 0;
    this.dispersionEnabled = true;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.onPointerDown = this.handlePointerDown.bind(this);
    this.onPointerMove = this.handlePointerMove.bind(this);
    this.onPointerUp = this.handlePointerUp.bind(this);
  }

  async init() {
    if (this.ready) return;
    const THREE = await import("../vendor/three.module.js");
    this.THREE = THREE;

    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(this.dpr);
    renderer.setSize(DESIGN_WIDTH, DESIGN_HEIGHT, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(42, DESIGN_WIDTH / DESIGN_HEIGHT, 0.1, 40);
    camera.position.set(0, 0, 8.2);
    camera.lookAt(0, 0, 0);
    this.camera = camera;

    const group = new THREE.Group();
    group.rotation.y = this.rotationY;
    scene.add(group);
    this.group = group;

    this.buildPoints(THREE, group);
    this.ready = true;
    this.applyVisibility();
    this.render();
  }

  buildPoints(THREE, group) {
    const mobile = window.innerWidth < 768;
    const total = mobile ? 4000 : 8000;
    const box = heartBox(5.5, 4.7, 0);
    const positions = new Float32Array(total * 3);
    const basePositions = new Float32Array(total * 3);
    const normals = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const palette = [this.theme.light, this.theme.primary, this.theme.deep].map((c) => new THREE.Color(c));
    this.dispersionEnabled = !mobile;

    for (let i = 0; i < total; i += 1) {
      const t = Math.random() * Math.PI * 2;
      const point = box.point(t);
      const surface = Math.random();
      let x;
      let y;
      let z;

      if (surface < 0.8) {
        const radius = Math.sqrt(Math.random()) * 0.94;
        x = point.x * radius;
        // 2D 画布 y 轴向下，Three.js y 轴向上，这里翻转，避免爱心倒置。
        y = -point.y * radius;
        const side = Math.random() < 0.5 ? -1 : 1;
        z = side * 0.34 * (1 - radius * radius) + randomRange(-0.018, 0.018);
      } else {
        x = point.x + randomRange(-0.035, 0.035);
        y = -point.y + randomRange(-0.035, 0.035);
        z = randomRange(-0.3, 0.3);
      }

      const radius = Math.hypot(x, y);
      const normalLength = Math.hypot(x, y, z) || 1;
      const color = palette[radius < 1.5 ? 0 : radius < 2.5 ? 1 : 2].clone();
      color.offsetHSL(0, 0, randomRange(-0.04, 0.04));

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;
      normals[i * 3] = x / normalLength;
      normals[i * 3 + 1] = y / normalLength;
      normals[i * 3 + 2] = z / normalLength;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    this.basePositions = basePositions;
    this.normals = normals;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();

    const textureCanvas = createParticleSprite(64, "#ffffff");
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.PointsMaterial({
      size: mobile ? 0.052 : 0.044,
      map: texture,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      alphaTest: 0.02
    });
    this.material = material;
    this.points = new THREE.Points(geometry, material);
    group.add(this.points);
  }

  applyVisibility() {
    this.canvas.style.visibility = this.visible ? "visible" : "hidden";
    this.canvas.style.opacity = String(this.opacity);
    this.canvas.style.pointerEvents = this.interactive && this.visible ? "auto" : "none";
  }

  setVisible(value) {
    this.visible = value;
    this.applyVisibility();
  }

  setOpacity(value) {
    this.opacity = value;
    if (value > 0.001) this.visible = true;
    this.applyVisibility();
  }

  setActive(value) {
    this.active = value;
    this.setVisible(value);
  }

  setInteractive(value) {
    if (!this.ready) {
      this.interactive = value;
      this.applyVisibility();
      return;
    }
    if (value === this.interactive) return;
    this.interactive = value;
    if (value) {
      // 场景层的透明 section 盖在画布上，指针事件统一从 window 进入，
      // 这样既不会挡住按钮，也能在整块舞台上拖动 3D 爱心。
      window.addEventListener("pointerdown", this.onPointerDown);
      window.addEventListener("pointermove", this.onPointerMove);
      window.addEventListener("pointerup", this.onPointerUp);
    } else {
      window.removeEventListener("pointerdown", this.onPointerDown);
      window.removeEventListener("pointermove", this.onPointerMove);
      window.removeEventListener("pointerup", this.onPointerUp);
      this.dragging = false;
    }
    this.applyVisibility();
  }

  setBeating(value) {
    this.beating = value;
    if (!value) this.group?.scale.setScalar(1);
  }

  setAutoRotate(value) {
    this.autoRotate = value;
  }

  handlePointerDown(event) {
    if (!this.interactive || !this.visible) return;
    const target = event.target;
    if (target instanceof Element && target.closest("button, input, a, .topbar, .progress, .password-layer, .replay-button")) {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      return;
    }
    const isPhone = window.matchMedia("(max-width: 900px)").matches;
    const relativeY = (event.clientY - rect.top) / rect.height;
    if (isPhone && relativeY < 0.42) return;
    this.dragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartRotationX = this.rotationX;
    event.target.setPointerCapture?.(event.pointerId);
  }

  handlePointerMove(event) {
    if (!this.dragging || !this.group) return;
    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;
    this.rotationY += dx * 0.006;
    this.rotationX = clamp(this.dragStartRotationX + dy * 0.0025, -0.35, 0.35);
    this.resumeAt = performance.now() + 1000;
  }

  handlePointerUp() {
    if (!this.dragging) return;
    this.dragging = false;
    this.resumeAt = performance.now() + 1000;
  }

  update(now, dt) {
    if (!this.ready || !this.visible) return;
    const delta = clamp(dt, 0, 32);
    if (this.beating) {
      this.beatTime += delta;
      const phase = (this.beatTime % 1100) / 1100;
      let beat;
      if (phase < 0.2) {
        const t = phase / 0.2;
        beat = 1 - 0.15 * (1 - (1 - t) * (1 - t));
      } else {
        const t = (phase - 0.2) / 0.8;
        beat = 0.85 + 0.15 * (-(Math.cos(Math.PI * t) - 1) / 2);
      }
      this.group.scale.setScalar(beat);
    }

    if (this.autoRotate && !this.dragging && now > this.resumeAt) {
      this.rotationY += 0.2618 * (delta / 1000);
    }
    this.group.rotation.y = this.rotationY;
    this.group.rotation.x = this.rotationX;

    if (this.dispersionEnabled && this.autoRotate) {
      if (this.disperseStart === 0 && now - this.lastDisperse > 8000) {
        this.disperseStart = now;
      }
      if (this.disperseStart > 0) {
        const progress = (now - this.disperseStart) / 1500;
        if (progress >= 1) {
          this.restorePositions();
          this.disperseStart = 0;
          this.lastDisperse = now;
        } else {
          this.applyDispersion(Math.sin(progress * Math.PI) * 1.35);
        }
      }
    } else {
      this.restorePositions();
    }

    this.render();
  }

  applyDispersion(amount) {
    if (!this.points) return;
    const position = this.points.geometry.attributes.position;
    const array = position.array;
    for (let i = 0; i < array.length; i += 3) {
      array[i] = this.basePositions[i] + this.normals[i] * amount;
      array[i + 1] = this.basePositions[i + 1] + this.normals[i + 1] * amount;
      array[i + 2] = this.basePositions[i + 2] + this.normals[i + 2] * amount;
    }
    position.needsUpdate = true;
    this.dispersed = true;
  }

  restorePositions() {
    if (!this.points || !this.dispersed) return;
    const position = this.points.geometry.attributes.position;
    position.array.set(this.basePositions);
    position.needsUpdate = true;
    this.dispersed = false;
  }

  render() {
    if (!this.ready || !this.visible) return;
    this.renderer.render(this.scene, this.camera);
  }
}
