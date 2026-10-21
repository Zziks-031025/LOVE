import { CONFIG, THEMES } from "./config.js";
import { SceneManager } from "./scene-manager.js";

const byId = (id) => document.getElementById(id);

const elements = {
  stageShell: byId("stage-shell"),
  stage: byId("stage"),
  bootCanvas: byId("boot-canvas"),
  heart2d: byId("heart-2d"),
  heart3d: byId("heart-3d"),
  fireworksCanvas: byId("fireworks-canvas"),
  heartName: byId("heart-name"),
  heartTo: byId("heart-to"),
  heartSignature: byId("heart-signature"),
  sceneOpening: byId("scene-opening"),
  wordsLayer: byId("words-layer"),
  textHeartLayer: byId("text-heart-layer"),
  centerCopy: byId("center-copy"),
  centerMain: byId("center-main"),
  topbar: byId("topbar"),
  progress: byId("progress"),
  next: byId("btn-next"),
  skip: byId("btn-skip"),
  replay: byId("replay-btn"),
  modeButton: byId("btn-mode"),
  music: byId("btn-music"),
  fullscreen: byId("btn-fullscreen"),
  toast: byId("toast"),
  passwordLayer: byId("password-layer"),
  passwordModal: byId("password-modal"),
  passwordInputs: document.querySelectorAll(".password-input"),
  passwordError: byId("password-error"),
  rotateOverlay: byId("rotate-overlay")
};

const theme = THEMES[CONFIG.theme] || THEMES.rose;
const manager = new SceneManager(elements, { config: CONFIG, theme });
manager.start();

// 便于调试，不影响页面行为。
window.__love = manager;
