import { CONFIG, THEMES } from "./config.js";
import { AudioController } from "./audio.js";
import { BootHeart } from "./boot.js";
import { Heart2D } from "./heart.js";
import { Heart3D } from "./heart-3d.js";
import { Fireworks } from "./fireworks.js";
import { TextHeart } from "./text-heart.js";
import {
  clamp,
  isPortraitPhone,
  keywordMarkup,
  prefersReducedMotion,
  shuffle,
  stageCoordinates
} from "./utils.js";

const SCENE_NAMES = ["opening", "heart", "fireworks", "words", "text"];
const WORD_SLOTS = [
  { x: -238, y: -138 },
  { x: 242, y: -112 },
  { x: 6, y: 16 },
  { x: -226, y: 150 },
  { x: 236, y: 152 }
];

export class SceneManager {
  constructor(els, { config = CONFIG, theme = THEMES.rose } = {}) {
    this.els = els;
    this.config = config;
    this.theme = theme;
    this.reduced = prefersReducedMotion();
    this.current = -1;
    this.mode = "2d";
    this.busy = false;
    this.modalOpen = false;
    this.paused = false;
    this.isPortrait = false;
    this.scale = 1;
    this.compact = false;
    this.sceneTimers = [];
    this.wordsTimers = [];
    this.nextTimer = 0;
    this.openingTimer = 0;
    this.toastTimer = 0;
    this.lastFrame = 0;
    this.pointerDown = false;
    this.defaultModeAttempted = false;
    this.sceneEls = [...document.querySelectorAll(".scene")];

    this.webglSupported = this.detectWebGL();
    this.audio = new AudioController(config.music, {
      volume: 0.58,
      onError: (message) => this.showToast(message)
    });

    this.boot = new BootHeart(els.bootCanvas);
    this.heart2d = new Heart2D(els.heart2d, {
      particleCount: config.particleCount,
      theme
    });
    this.fireworks = new Fireworks(els.fireworksCanvas, {
      max: config.maxFireworks,
      interval: config.fireworkInterval
    });
    this.textHeart = new TextHeart(
      els.textHeartLayer,
      els.centerCopy,
      els.centerMain,
      {
        config,
        onReplayReady: () => {
          if (this.current === 4) this.els.replay.hidden = false;
        }
      }
    );

    this.buildName();
    this.buildProgress();
    this.buildWords();
    this.setupPassword();
    this.resizeStage();
    this.updateControls();
  }

  detectWebGL() {
    try {
      const canvas = document.createElement("canvas");
      return Boolean(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
      );
    } catch (error) {
      return false;
    }
  }

  buildName() {
    const herName = (this.config.herName || "你").trim();
    const myName = (this.config.myName || "").trim();
    const centerText = (this.config.heartCenterText || "").trim() || herName;
    const isSentence = centerText !== herName;
    // 每个节点都单独判空：即使 index.html 少了一个元素，也不让整页初始化中断。
    if (this.els.heartName) {
      this.els.heartName.textContent = centerText;
      this.els.heartName.classList.toggle("is-long-name", !isSentence && herName.length > 4);
      this.els.heartName.classList.toggle("is-sentence", isSentence);
    }
    if (this.els.heartTo) {
      this.els.heartTo.innerHTML = `致 <span>${herName.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</span>`;
    }
    if (this.els.heartSignature) {
      if (myName) {
        this.els.heartSignature.hidden = false;
        this.els.heartSignature.textContent = `—— ${myName}`;
      } else {
        this.els.heartSignature.hidden = true;
      }
    }
    const note = (this.config.heartNote || "").trim();
    if (this.els.heartNote) {
      if (note) {
        this.els.heartNote.hidden = false;
        this.els.heartNote.textContent = note;
      } else {
        this.els.heartNote.hidden = true;
      }
    }
  }

  buildProgress() {
    this.progressDots = [];
    for (let i = 0; i < 5; i += 1) {
      const dot = document.createElement("span");
      dot.className = "progress-dot";
      dot.setAttribute("aria-hidden", "true");
      this.els.progress.appendChild(dot);
      this.progressDots.push(dot);
    }
  }

  buildWords() {
    this.wordBlocks = this.config.paragraphs.map((paragraph, index) => {
      const block = document.createElement("div");
      block.className = "word-block is-hidden";
      block.dataset.index = String(index);
      block.innerHTML = paragraph.lines
        .map((line) => `<span class="word-line">${keywordMarkup(line, paragraph.keyword)}</span>`)
        .join("");
      this.els.wordsLayer.appendChild(block);
      return block;
    });
    this.wordQueue = [];
    this.wordRecent = [];
    this.wordSlotByIndex = new Map();
  }

  setupPassword() {
    if (!this.config.password) {
      this.els.passwordLayer.hidden = true;
      return;
    }
    this.els.passwordLayer.hidden = true;
    this.passwordInputs = [...this.els.passwordInputs];
    this.passwordInputs.forEach((input, index) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(-1);
        if (input.value && index < this.passwordInputs.length - 1) {
          this.passwordInputs[index + 1].focus();
        }
        if (this.passwordInputs.every((item) => item.value)) {
          this.checkPassword();
        }
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" && !input.value && index > 0) {
          this.passwordInputs[index - 1].focus();
        }
        if (event.key === "Enter") this.checkPassword();
      });
    });
  }

  openPassword() {
    this.modalOpen = true;
    this.els.passwordLayer.hidden = false;
    this.els.passwordError.textContent = "";
    this.passwordInputs.forEach((input) => {
      input.value = "";
    });
    window.setTimeout(() => this.passwordInputs[0]?.focus(), 120);
  }

  checkPassword() {
    const value = this.passwordInputs.map((input) => input.value).join("");
    if (value.length !== 4) return;
    if (value === String(this.config.password)) {
      this.modalOpen = false;
      this.els.passwordLayer.hidden = true;
      this.startOpening();
      return;
    }
    this.els.passwordModal.classList.remove("is-shaking");
    void this.els.passwordModal.offsetWidth;
    this.els.passwordModal.classList.add("is-shaking");
    this.els.passwordError.textContent = "口令不对，再试一次";
    window.setTimeout(() => {
      this.els.passwordModal.classList.remove("is-shaking");
      this.passwordInputs.forEach((input) => {
        input.value = "";
      });
      this.passwordInputs[0]?.focus();
    }, 340);
  }

  start() {
    this.bindEvents();
    this.startLoop();
    if (this.config.password) {
      this.openPassword();
    } else {
      this.startOpening();
    }
  }

  startLoop() {
    this.lastFrame = performance.now();
    const tick = (now) => {
      const delta = now - this.lastFrame;
      this.lastFrame = now;
      if (!this.paused) {
        if (this.current === 0) {
          this.boot.update(now, delta);
          this.boot.render(now);
        }
        this.heart2d.update(delta);
        this.heart2d.render();
        this.heart3d?.update(now, delta);
        this.fireworks.update(now, delta);
        this.fireworks.render();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  resizeStage() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / 1240, vh / 698, 1);
    if (!Number.isFinite(scale) || scale <= 0) return;
    this.scale = scale;
    this.compact = vw <= 900 || scale < 0.9;
    this.els.stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
    this.els.stage.style.setProperty("--stage-scale", String(scale));
    this.els.stage.classList.toggle("is-compact", this.compact);

    const actual = (value, min = 0, max = Infinity) =>
      `${clamp(value / scale, min, max).toFixed(2)}px`;
    const set = (name, value) => this.els.stage.style.setProperty(name, value);

    set("--fs-heart", this.compact ? actual(8.7, 12, 16) : "12px");
    set("--fs-center", this.compact ? actual(17, 21, 33) : "21px");
    set("--fs-words", this.compact ? actual(15, 17, 29) : "17px");
    set("--fs-name", this.compact ? actual(34, 58, 72) : "58px");
    set("--fs-to", this.compact ? actual(11, 18, 26) : "12px");
    set("--fs-ui", this.compact ? actual(14, 20, 28) : "14px");
    set("--fs-mode", this.compact ? actual(11, 16, 22) : "11px");
    set("--fs-hint", this.compact ? actual(11, 18, 24) : "12px");
    set("--fs-boot-title", this.compact ? actual(30, 40, 56) : "44px");
    set("--fs-boot-eyebrow", this.compact ? actual(10, 14, 20) : "11px");
    set("--fs-boot-hint", this.compact ? actual(11, 16, 22) : "12px");
    set("--control-size", this.compact ? actual(40, 56, 80) : "40px");
    set("--control-hit", this.compact ? actual(44, 60, 88) : "44px");
    set("--control-gap", this.compact ? actual(12, 16, 24) : "16px");
    set("--icon-size", this.compact ? actual(19, 24, 30) : "20px");
    set("--safe-top", this.compact ? actual(14, 20, 30) : "24px");
    set("--safe-right", this.compact ? actual(16, 24, 36) : "48px");
    set("--next-bottom", this.compact ? actual(16, 22, 32) : "48px");
    set("--progress-bottom", this.compact ? actual(12, 16, 24) : "24px");
    set("--dot-size", this.compact ? actual(6, 8, 12) : "6px");
    set("--dot-active", this.compact ? actual(20, 26, 38) : "20px");
    set("--center-rule", this.compact ? actual(18, 22, 28) : "28px");
    set("--heart-copy-width", this.compact ? "170px" : "150px");
    set("--word-width", this.compact ? "720px" : "760px");

    const portrait = isPortraitPhone();
    this.isPortrait = portrait;
    this.els.rotateOverlay.hidden = !portrait;
    this.updatePaused();
  }

  updatePaused() {
    this.paused = document.hidden || this.isPortrait;
  }

  bindEvents() {
    this.els.stage.addEventListener("click", (event) => {
      if (this.modalOpen || this.busy) return;
      const hit = event.target.closest("button, input, a");
      if (hit) return;
      if (this.current === 0 && this.openingReady) {
        this.enterFromGate();
      } else if (this.current === 2) {
        this.launchFireworks(event);
      }
    });

    this.els.next.addEventListener("click", () => this.goNext());
    this.els.replay.addEventListener("click", () => this.replay());
    this.els.modeButton.addEventListener("click", () => this.toggleMode());
    this.els.music.addEventListener("click", () => this.toggleMusic());
    this.els.fullscreen.addEventListener("click", () => this.toggleFullscreen());

    this.els.stage.addEventListener("pointermove", (event) => {
      if (this.current !== 1 || this.mode !== "2d") return;
      if (event.pointerType === "mouse" || this.pointerDown) {
        const point = stageCoordinates(event, this.els.stage);
        this.heart2d.setPointer(point.x, point.y, true);
      }
    });
    this.els.stage.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button, input, a")) return;
      this.pointerDown = true;
      if (this.current === 1 && this.mode === "2d") {
        const point = stageCoordinates(event, this.els.stage);
        this.heart2d.setPointer(point.x, point.y, true);
      } else if (this.current === 0) {
        const point = stageCoordinates(event, this.els.stage);
        this.boot.setPointer(point.x, point.y, true);
      }
    });

    this.els.stage.addEventListener("pointermove", (event) => {
      if (this.current !== 0) return;
      if (event.target.closest("button, input, a")) {
        this.boot.clearPointer();
        return;
      }
      const point = stageCoordinates(event, this.els.stage);
      this.boot.setPointer(point.x, point.y, true);
    });

    const clearPointer = () => {
      this.pointerDown = false;
      this.heart2d.clearPointer();
      this.boot.clearPointer();
    };
    this.els.stage.addEventListener("pointerup", clearPointer);
    this.els.stage.addEventListener("pointercancel", clearPointer);
    this.els.stage.addEventListener("pointerleave", clearPointer);

    window.addEventListener("keydown", (event) => {
      if (this.modalOpen) return;
      const target = event.target;
      if (target instanceof Element && target.closest("button, input, a")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      if (this.current === 0 && this.openingReady) {
        event.preventDefault();
        this.enterFromGate();
      } else if (this.current === 1 || this.current === 2 || this.current === 3) {
        event.preventDefault();
        this.goNext();
      }
    });

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        this.resizeStage();
      }, 280);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    document.addEventListener("visibilitychange", () => {
      this.updatePaused();
      if (document.hidden) {
        this.audioWasPlaying = this.audio.isPlaying;
        this.audio.pause();
      } else if (this.audioWasPlaying) {
        this.audioWasPlaying = false;
        this.audio.start().then((playing) => this.updateMusicButton(playing));
      }
    });

    document.addEventListener("fullscreenchange", () => {
      this.els.fullscreen.setAttribute("aria-pressed", String(Boolean(document.fullscreenElement)));
      this.els.fullscreen.classList.toggle("is-on", Boolean(document.fullscreenElement));
    });

    if (!document.fullscreenEnabled) {
      this.els.fullscreen.hidden = true;
    }
    if (!this.webglSupported) {
      this.els.modeButton.hidden = true;
    }
    this.els.fullscreen.setAttribute("aria-pressed", "false");
    this.els.music.setAttribute("aria-pressed", "false");
  }

  startOpening() {
    this.clearSceneTimers();
    this.clearWordsTimers();
    this.openingReady = false;
    this.replayReady = false;
    this.els.sceneOpening.classList.remove("is-ready");
    this.els.replay.hidden = true;
    this.activateScene(0);
    this.boot.start();
    window.clearTimeout(this.openingTimer);
    this.openingTimer = window.setTimeout(() => {
      if (this.current !== 0) return;
      this.openingReady = true;
      this.els.sceneOpening.classList.add("is-ready");
    }, 1850);
  }

  enterFromGate() {
    if (!this.openingReady || this.modalOpen || this.busy) return;
    this.busy = true;
    this.setBootHint("正在为你准备音乐…");
    // 先等音乐真正开始播放（或超时兜底），再收起开场动画进入正文。
    const guard = new Promise((resolve) => window.setTimeout(() => resolve(false), 9000));
    Promise.race([this.audio.start(), guard]).then((playing) => {
      this.updateMusicButton(Boolean(playing));
      this.setBootHint(null);
      this.boot.collapse(() => {
        this.busy = false;
        this.boot.setVisible(false);
        this.activateScene(1);
      });
    });
  }

  setBootHint(text) {
    const hint = this.els.sceneOpening.querySelector(".boot-hint");
    if (!hint) return;
    if (!this.bootHintDefault) this.bootHintDefault = hint.textContent.trim();
    const dot = hint.querySelector(".hint-dot");
    hint.textContent = text || this.bootHintDefault;
    if (dot) hint.prepend(dot);
    hint.classList.toggle("is-loading", Boolean(text));
  }

  activateScene(index) {
    if (index < 0 || index >= SCENE_NAMES.length) return;
    this.clearSceneTimers();
    this.current = index;
    const name = SCENE_NAMES[index];
    this.sceneEls.forEach((scene, sceneIndex) => {
      const active = sceneIndex === index;
      scene.classList.toggle("is-active", active);
      scene.setAttribute("aria-hidden", String(!active));
    });
    this.els.stage.dataset.scene = name;
    this.updateControls();
    this.setProgress(index);
    this.openingReady = index === 0 ? this.openingReady : false;

    if (index === 0) this.enterOpening();
    if (index === 1) this.enterHeart();
    if (index === 2) this.enterFireworks();
    if (index === 3) this.enterWords();
    if (index === 4) this.enterText();
  }

  updateControls() {
    const name = SCENE_NAMES[this.current] || "opening";
    this.els.topbar.classList.toggle("is-hidden", name === "opening");
    this.els.progress.classList.toggle("is-hidden", name === "opening");
    this.els.modeButton.hidden = !(name === "heart" || name === "fireworks" || name === "words") || !this.webglSupported;
    this.els.next.classList.toggle("is-visible", name === "fireworks" || name === "words");
    if (name === "text" || name === "opening") {
      this.els.next.classList.remove("is-visible");
    }
    if (name !== "text") {
      this.els.replay.hidden = true;
    }
  }

  setProgress(index) {
    this.progressDots.forEach((dot, i) => {
      dot.classList.toggle("is-done", i < index);
      dot.classList.toggle("is-active", i === index);
    });
  }

  enterOpening() {
    this.boot.setVisible(true);
    this.setHeartOpacity(0);
    this.heart2d.setBeating(false);
    this.heart3d?.setVisible(false);
    this.heart3d?.setInteractive(false);
    this.fireworks.setActive(false);
    this.fireworks.clear();
    this.fireworks.setOpacity(0);
    this.resetWords();
    this.textHeart.reset();
    this.els.next.classList.remove("is-visible");
    this.els.replay.hidden = true;
    this.els.stage.dataset.mode = this.mode;
  }

  enterHeart() {
    this.boot.setVisible(false);
    this.setHeartOpacity(1);
    this.heart2d.setBeating(!this.reduced);
    this.heart3d?.setAutoRotate(!this.reduced);
    this.heart3d?.setBeating(!this.reduced);
    this.heart3d?.setInteractive(this.mode === "3d");
    this.fireworks.setActive(false);
    this.fireworks.clear();
    this.fireworks.setOpacity(0);
    this.resetWords();
    this.textHeart.reset();
    this.els.replay.hidden = true;
    this.els.stage.dataset.mode = this.mode;
    this.els.next.classList.remove("is-visible");
    window.clearTimeout(this.nextTimer);
    this.nextTimer = window.setTimeout(() => {
      if (this.current === 1) this.els.next.classList.add("is-visible");
    }, 4000);

    if (this.config.defaultMode === "3d" && !this.defaultModeAttempted) {
      this.defaultModeAttempted = true;
      window.setTimeout(() => this.enable3D(), 500);
    }
  }

  enterFireworks() {
    this.setHeartOpacity(0.35);
    this.heart2d.setBeating(!this.reduced);
    this.heart3d?.setAutoRotate(!this.reduced);
    this.heart3d?.setBeating(!this.reduced);
    this.heart3d?.setInteractive(false);
    this.els.stage.dataset.mode = this.mode;
    this.fireworks.clear();
    this.fireworks.setOpacity(1);
    this.fireworks.setActive(!this.reduced);
    this.els.next.classList.add("is-visible");
    this.els.replay.hidden = true;
    this.textHeart.reset();
    this.resetWords();
  }

  enterWords() {
    this.setHeartOpacity(this.heartOpacityForCurrent());
    this.heart2d.setBeating(!this.reduced);
    this.heart3d?.setAutoRotate(!this.reduced);
    this.heart3d?.setBeating(!this.reduced);
    this.heart3d?.setInteractive(false);
    this.fireworks.setActive(false);
    this.fireworks.setOpacity(0.22);
    this.sceneTimers.push(
      window.setTimeout(() => {
        if (this.current !== 3) return;
        this.fireworks.setOpacity(0);
        this.fireworks.clear();
      }, 900)
    );
    this.els.replay.hidden = true;
    this.resetWords();
    this.startWords();
  }

  enterText() {
    this.setHeartOpacity(0);
    this.heart2d.setVisible(false);
    this.heart3d?.setVisible(false);
    this.heart3d?.setInteractive(false);
    this.fireworks.setActive(false);
    this.fireworks.setOpacity(0);
    this.fireworks.clear();
    this.els.next.classList.remove("is-visible");
    this.els.replay.hidden = true;
    this.resetWords();
    this.textHeart.play();
  }

  goNext() {
    if (this.busy || this.modalOpen) return;
    if (this.current === 1) this.activateScene(2);
    else if (this.current === 2) this.activateScene(3);
    else if (this.current === 3) this.skipWords();
  }

  setHeartOpacity(value) {
    if (this.mode === "3d" && this.heart3d?.ready) {
      this.heart2d.setOpacity(0);
      this.heart3d.setVisible(value > 0.001);
      this.heart3d.setOpacity(value);
      return;
    }
    this.heart3d?.setOpacity(0);
    this.heart2d.setVisible(value > 0.001);
    this.heart2d.setOpacity(value);
  }

  resetWords() {
    this.clearWordsTimers();
    this.wordBlocks.forEach((block) => {
      block.classList.remove("is-active");
      block.classList.add("is-hidden");
    });
    this.els.wordsLayer.classList.remove("is-leaving");
  }

  startWords() {
    this.wordQueue = shuffle(this.wordBlocks.map((block, index) => index));
    this.wordRecent = [];
    this.wordSlotByIndex = new Map();
    this.wordsTimers.push(window.setTimeout(() => this.showNextWord(), 500));
  }

  showNextWord() {
    if (this.current !== 3) return;
    if (!this.wordQueue.length) {
      // 一轮放完后重新洗牌，仍在屏幕上的几段不参与，避免立刻重复。
      const recent = new Set(this.wordRecent);
      this.wordQueue = shuffle(
        this.wordBlocks
          .map((block, index) => index)
          .filter((index) => !recent.has(index))
      );
    }
    const index = this.wordQueue.shift();
    if (index === undefined) return;

    // 在 5 个位置中随机挑一个，避开还在屏幕上的几句。
    const occupied = new Set();
    this.wordRecent.forEach((recentIndex) => {
      const slotIndex = this.wordSlotByIndex.get(recentIndex);
      if (slotIndex !== undefined) occupied.add(slotIndex);
    });
    const freeSlots = WORD_SLOTS.map((slot, slotIndex) => slotIndex).filter(
      (slotIndex) => !occupied.has(slotIndex)
    );
    const slotIndex = freeSlots[Math.floor(Math.random() * freeSlots.length)];
    const slot = WORD_SLOTS[slotIndex];
    this.wordSlotByIndex.set(index, slotIndex);

    const block = this.wordBlocks[index];
    // 换位置时不做过渡，避免从上一个位置滑过来。
    block.classList.add("no-transition");
    block.style.setProperty("--wx", `${slot.x}px`);
    block.style.setProperty("--wy", `${slot.y}px`);
    void block.offsetWidth;
    block.classList.remove("no-transition");

    block.classList.remove("is-hidden");
    block.classList.add("is-active");

    this.wordRecent = [index, ...this.wordRecent].slice(0, 3);

    // 每句待遇完全相同：淡入 600 毫秒、全亮停留 2000 毫秒，然后渐隐消失，不留残影。
    this.wordsTimers.push(
      window.setTimeout(() => {
        if (this.current !== 3) return;
        block.classList.remove("is-active");
        block.classList.add("is-hidden");
      }, 2600)
    );

    // 每 1400 毫秒出现下一句，因此同屏会自然保留 2–3 句在亮着或渐隐。
    this.wordsTimers.push(window.setTimeout(() => this.showNextWord(), 1400));
  }

  skipWords() {
    if (this.current !== 3 || this.busy) return;
    this.clearWordsTimers();
    this.els.wordsLayer.classList.add("is-leaving");
    this.sceneTimers.push(
      window.setTimeout(() => {
        if (this.current === 3) this.activateScene(4);
      }, 380)
    );
  }

  replay() {
    if (this.busy) return;
    this.textHeart.reset();
    this.resetWords();
    this.fireworks.setActive(false);
    this.fireworks.clear();
    this.fireworks.setOpacity(0);
    this.setHeartOpacity(0);
    this.els.replay.hidden = true;
    this.startOpening();
  }

  clearSceneTimers() {
    this.sceneTimers.forEach((timer) => window.clearTimeout(timer));
    this.sceneTimers = [];
    window.clearTimeout(this.nextTimer);
    this.nextTimer = 0;
  }

  clearWordsTimers() {
    this.wordsTimers.forEach((timer) => window.clearTimeout(timer));
    this.wordsTimers = [];
  }

  async toggleMusic() {
    const playing = await this.audio.toggle();
    this.updateMusicButton(playing);
  }

  updateMusicButton(playing) {
    this.els.music.classList.toggle("is-on", Boolean(playing));
    this.els.music.setAttribute("aria-pressed", String(Boolean(playing)));
    this.els.music.setAttribute("aria-label", playing ? "暂停背景音乐" : "播放背景音乐");
  }

  async toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await this.els.stageShell.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (error) {
      this.showToast("当前浏览器不支持全屏");
    }
  }

  toggleMode() {
    if (this.mode === "2d") {
      this.enable3D();
    } else {
      this.disable3D();
    }
  }

  async enable3D() {
    if (!this.webglSupported) {
      this.els.modeButton.hidden = true;
      return;
    }
    if (this.mode === "3d" || this.els.modeButton.disabled) return;
    this.els.modeButton.disabled = true;
    this.els.modeButton.classList.add("is-loading");
    this.els.modeButton.textContent = "3D 加载中";
    try {
      if (!this.heart3d) {
        this.heart3d = new Heart3D(this.els.heart3d, { theme: this.theme });
        await this.heart3d.init();
      }
      this.mode = "3d";
      this.els.stage.dataset.mode = "3d";
      this.heart3d.setInteractive(this.current === 1);
      this.heart3d.setAutoRotate(!this.reduced && this.current < 4);
      this.heart3d.setBeating(!this.reduced && this.current < 4);
      this.setHeartOpacity(this.heartOpacityForCurrent());
      this.els.modeButton.textContent = "2D";
      this.els.modeButton.setAttribute("aria-label", "切换到 2D 爱心");
      this.els.modeButton.title = "切换到 2D";
    } catch (error) {
      console.warn("3D heart failed:", error);
      this.mode = "2d";
      this.heart3d = null;
      this.els.stage.dataset.mode = "2d";
      this.els.modeButton.textContent = "3D";
      this.els.modeButton.disabled = true;
      this.setHeartOpacity(this.heartOpacityForCurrent());
      this.showToast("3D 加载失败");
    } finally {
      this.els.modeButton.classList.remove("is-loading");
      if (this.mode === "3d") this.els.modeButton.disabled = false;
    }
  }

  disable3D() {
    if (this.mode !== "3d") return;
    this.mode = "2d";
    this.els.stage.dataset.mode = "2d";
    this.heart3d?.setInteractive(false);
    this.heart3d?.setOpacity(0);
    this.heart2d.setVisible(this.heartOpacityForCurrent() > 0);
    this.heart2d.setOpacity(this.heartOpacityForCurrent());
    this.els.modeButton.textContent = "3D";
    this.els.modeButton.setAttribute("aria-label", "切换到 3D 爱心");
    this.els.modeButton.title = "切换到 3D";
  }

  heartOpacityForCurrent() {
    return [0, 1, 0.35, 0.28, 0][this.current] ?? 0;
  }

  launchFireworks(event) {
    const point = stageCoordinates(event, this.els.stage);
    this.fireworks.launch(point.x);
    const ring = document.createElement("span");
    ring.className = "click-ring";
    ring.style.left = `${point.x}px`;
    ring.style.top = `${point.y}px`;
    this.els.stage.appendChild(ring);
    window.setTimeout(() => ring.remove(), 520);
  }

  showToast(message) {
    if (!this.els.toast) return;
    window.clearTimeout(this.toastTimer);
    this.els.toast.textContent = message;
    this.els.toast.classList.add("is-visible");
    this.toastTimer = window.setTimeout(() => {
      this.els.toast.classList.remove("is-visible");
    }, 2200);
  }
}
