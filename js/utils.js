export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const lerp = (a, b, t) => a + (b - a) * t;

export const randomRange = (min, max) => min + Math.random() * (max - min);

export const randomInt = (min, max) => Math.floor(randomRange(min, max + 1));

export const shuffle = (list) => {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t) => t * t * t;
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

export const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 心形参数方程，返回 y 向上的数学坐标。
export function heartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return { x, y };
}

// 将数学坐标缩放到指定矩形。
export function heartBox(width, height, padding = 0) {
  const raw = [];
  const steps = 1600;
  for (let i = 0; i <= steps; i += 1) {
    raw.push(heartPoint((i / steps) * Math.PI * 2));
  }
  const minX = Math.min(...raw.map((p) => p.x));
  const maxX = Math.max(...raw.map((p) => p.x));
  const minY = Math.min(...raw.map((p) => p.y));
  const maxY = Math.max(...raw.map((p) => p.y));
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;
  const scale = Math.min(usableW / (maxX - minX), usableH / (maxY - minY));
  return {
    raw,
    minX,
    maxX,
    minY,
    maxY,
    scale,
    width: (maxX - minX) * scale,
    height: (maxY - minY) * scale,
    point(t) {
      const p = heartPoint(t);
      return {
        x: (p.x - (minX + maxX) / 2) * scale,
        y: (p.y - (minY + maxY) / 2) * scale
      };
    }
  };
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 把关键词包成亮色 span，其他内容保持纯文本。
export function keywordMarkup(text, keyword) {
  const safeText = escapeHtml(text);
  if (!keyword) return safeText;
  const safeKeyword = escapeHtml(keyword);
  const index = safeText.indexOf(safeKeyword);
  if (index < 0) return safeText;
  return `${safeText.slice(0, index)}<span class="kw">${safeKeyword}</span>${safeText.slice(index + safeKeyword.length)}`;
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const normalized = value.length === 3
    ? value.split("").map((char) => char + char).join("")
    : value;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function createParticleSprite(size = 32, color = "#FF8FA3") {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.2, hexToRgba(color, 0.95));
  gradient.addColorStop(0.52, hexToRgba(color, 0.42));
  gradient.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

export function setCssVar(name, value, root = document.documentElement) {
  root.style.setProperty(name, value);
}

export function stageCoordinates(event, stage) {
  const rect = stage.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 1240,
    y: ((event.clientY - rect.top) / rect.height) * 698
  };
}

export function isMobileLandscape() {
  return window.matchMedia("(max-width: 900px) and (orientation: landscape)").matches;
}

export function isPortraitPhone() {
  return window.matchMedia("(max-width: 900px) and (orientation: portrait)").matches;
}
