import {
  clamp,
  heartBox,
  keywordMarkup,
  prefersReducedMotion,
  randomRange,
  shuffle
} from "./utils.js";

const DESIGN_WIDTH = 1240;
const DESIGN_HEIGHT = 698;
const CENTER = { x: 620, y: 350 };

export class TextHeart {
  constructor(layer, centerCopy, centerMain, { config, onReplayReady } = {}) {
    this.layer = layer;
    this.centerCopy = centerCopy;
    this.centerMain = centerMain;
    this.config = config;
    this.onReplayReady = onReplayReady;
    this.lines = [];
    this.lineData = [];
    this.centerTimers = [];
    this.animationTimers = [];
    this.animations = [];
    this.isPlaying = false;
    this.reduced = prefersReducedMotion();
    this.current = null;
    this.queue = [];
    this.build();
  }

  build() {
    const paragraphs = this.config.paragraphs;
    const leftParagraphs = paragraphs.filter((p) => p.side === "left");
    const rightParagraphs = paragraphs.filter((p) => p.side === "right");
    this.lineData = [
      ...leftParagraphs.flatMap((paragraph) =>
        paragraph.lines.map((line) => ({
          text: line,
          keyword: paragraph.keyword,
          paragraphId: paragraph.id,
          side: "left"
        }))
      ),
      ...rightParagraphs.flatMap((paragraph) =>
        paragraph.lines.map((line) => ({
          text: line,
          keyword: paragraph.keyword,
          paragraphId: paragraph.id,
          side: "right"
        }))
      )
    ];

    // 右侧从心形右下往右上排，段落内部倒序，保证从上到下仍是原文顺序。
    const leftLines = leftParagraphs.flatMap((p) => p.lines);
    const rightLines = rightParagraphs.flatMap((p) => p.lines.slice().reverse());
    const laidOutLines = [
      ...leftLines.map((line, index) => ({
        line,
        side: "left",
        index,
        data: this.findData(line, "left", index)
      })),
      ...rightLines.map((line, index) => ({
        line,
        side: "right",
        index,
        data: this.findRightData(line, rightParagraphs, index)
      }))
    ];

    const box = heartBox(600, 520, 0);
    const leftPoints = this.pointsAlong(box, Math.PI * 1.72, Math.PI * 1.18, leftLines.length);
    const rightPoints = this.pointsAlong(box, Math.PI * 0.82, Math.PI * 0.28, rightLines.length);

    laidOutLines.forEach((item, index) => {
      const points = item.side === "left" ? leftPoints : rightPoints;
      const point = points[item.index];
      const rotation = this.tangentRotation(points, item.index);
      const el = document.createElement("div");
      el.className = "heart-copy";
      el.style.left = `${point.x.toFixed(2)}px`;
      el.style.top = `${point.y.toFixed(2)}px`;
      el.style.setProperty("--rot", `${rotation.toFixed(2)}deg`);
      el.innerHTML = keywordMarkup(item.line, item.data?.keyword);
      el.dataset.side = item.side;
      el.dataset.paragraph = String(item.data?.paragraphId ?? "");
      this.layer.appendChild(el);
      this.lines.push({
        el,
        x: point.x,
        y: point.y,
        rotation,
        index,
        text: item.line,
        keyword: item.data?.keyword || ""
      });
    });

    this.buildDust();
    this.showDefaultCenter(false);
  }

  findData(line, side, index) {
    const sideData = this.lineData.filter((d) => d.side === side);
    return sideData[index];
  }

  findRightData(line, rightParagraphs, index) {
    // 右侧排版顺序是段落倒序行；计算它对应的原始数据。
    const flat = [];
    rightParagraphs.forEach((paragraph) => {
      paragraph.lines
        .slice()
        .reverse()
        .forEach((text) => {
          flat.push({ text, keyword: paragraph.keyword, paragraphId: paragraph.id, side: "right" });
        });
    });
    return flat[index];
  }

  pointsAlong(box, t0, t1, count) {
    const steps = 340;
    const samples = [];
    let total = 0;
    let prev = null;
    for (let i = 0; i <= steps; i += 1) {
      const t = t0 + ((t1 - t0) * i) / steps;
      const p = box.point(t);
      const x = DESIGN_WIDTH / 2 + p.x;
      const y = DESIGN_HEIGHT / 2 + p.y;
      if (prev) total += Math.hypot(x - prev.x, y - prev.y);
      samples.push({ x, y, d: total });
      prev = { x, y };
    }
    const out = [];
    for (let i = 0; i < count; i += 1) {
      const target = (total * i) / (count - 1);
      let j = 1;
      while (j < samples.length - 1 && samples[j].d < target) j += 1;
      const a = samples[j - 1];
      const b = samples[j];
      const k = b.d === a.d ? 0 : (target - a.d) / (b.d - a.d);
      out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
    }
    return out;
  }

  tangentRotation(points, index) {
    const a = points[Math.max(0, index - 1)];
    const b = points[Math.min(points.length - 1, index + 1)];
    const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    return clamp(deg * 0.34, -20, 20);
  }

  buildDust() {
    for (let i = 0; i < 58; i += 1) {
      const dot = document.createElement("i");
      dot.className = "dust";
      dot.style.left = `${randomRange(0, DESIGN_WIDTH).toFixed(1)}px`;
      dot.style.top = `${randomRange(0, DESIGN_HEIGHT).toFixed(1)}px`;
      dot.style.width = `${randomRange(1, 2.8).toFixed(1)}px`;
      dot.style.height = dot.style.width;
      dot.style.opacity = randomRange(0.08, 0.3).toFixed(2);
      this.layer.appendChild(dot);
    }
  }

  showDefaultCenter(animate = true) {
    const { defaultLines, keyword } = this.config.center;
    this.centerMain.innerHTML = defaultLines
      .map((line) => `<span class="line">${keywordMarkup(line, keyword)}</span>`)
      .join("");
    this.centerCopy.classList.remove("is-hidden", "is-out", "is-in", "is-long");
    if (animate) {
      this.centerCopy.classList.add("is-in");
      void this.centerCopy.offsetWidth;
      requestAnimationFrame(() => this.centerCopy.classList.remove("is-in"));
    }
    this.current = defaultLines.join("");
  }

  renderCenterLine(item) {
    this.centerMain.innerHTML = `<span class="line${item.text.length > 12 ? " is-long" : ""}">${keywordMarkup(item.text, item.keyword)}</span>`;
    this.centerCopy.classList.remove("is-out", "is-in", "is-hidden");
    this.centerCopy.classList.add("is-in");
    void this.centerCopy.offsetWidth;
    requestAnimationFrame(() => this.centerCopy.classList.remove("is-in"));
  }

  startCenterCycle() {
    this.clearCenterTimers();
    if (this.reduced) return;
    const wait = this.config.center.intervalMs || 5000;
    const timer = window.setTimeout(() => this.swapCenter(), wait);
    this.centerTimers.push(timer);
  }

  swapCenter() {
    if (!this.isPlaying || this.reduced) return;
    this.centerCopy.classList.add("is-out");
    const fadeOut = this.config.center.fadeOutMs || 600;
    const timer = window.setTimeout(() => {
      const item = this.nextLine();
      if (!item) return;
      this.centerMain.innerHTML = `<span class="line${item.text.length > 12 ? " is-long" : ""}">${keywordMarkup(item.text, item.keyword)}</span>`;
      this.centerCopy.classList.remove("is-out");
      this.centerCopy.classList.add("is-in");
      void this.centerCopy.offsetWidth;
      requestAnimationFrame(() => this.centerCopy.classList.remove("is-in"));
      const next = window.setTimeout(() => this.swapCenter(), this.config.center.intervalMs || 5000);
      this.centerTimers.push(next);
    }, fadeOut + 80);
    this.centerTimers.push(timer);
  }

  nextLine() {
    if (!this.queue.length) {
      this.queue = shuffle(this.lineData.filter((item) => item.text !== this.current));
    }
    const item = this.queue.shift();
    if (!item) return null;
    this.current = item.text;
    return item;
  }

  clearCenterTimers() {
    this.centerTimers.forEach((timer) => window.clearTimeout(timer));
    this.centerTimers = [];
  }

  clearAnimationTimers() {
    this.animationTimers.forEach((timer) => window.clearTimeout(timer));
    this.animationTimers = [];
  }

  cancelAnimations() {
    this.animations.forEach((animation) => {
      try {
        animation.cancel();
      } catch (error) {
        // 忽略浏览器差异。
      }
    });
    this.animations = [];
  }

  async play() {
    this.stop();
    this.isPlaying = true;
    this.clearCenterTimers();
    this.centerCopy.classList.add("is-hidden");
    this.current = null;
    this.queue = [];

    const total = this.lines.length;
    this.lines.forEach((line, index) => {
      const stackOffset = (index - (total - 1) / 2) * 1.15;
      const dx = CENTER.x - line.x;
      const dy = CENTER.y - line.y + stackOffset;
      line.el.style.opacity = "0";
      line.el.style.transform = `translate(-50%, -50%) translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(0.94)`;
      line.el.style.zIndex = String(5 + index);
    });

    if (this.reduced) {
      this.lines.forEach((line) => {
        line.el.style.opacity = "0.82";
        line.el.style.transform = `translate(-50%, -50%) rotate(${line.rotation.toFixed(2)}deg)`;
      });
      this.centerCopy.classList.remove("is-hidden");
      this.showDefaultCenter(true);
      const timer = window.setTimeout(() => this.onReplayReady?.(), 1200);
      this.animationTimers.push(timer);
      return;
    }

    // 第一阶段：从中心紧凑堆叠淡入。
    this.lines.forEach((line, index) => {
      const animation = line.el.animate(
        [
          { opacity: 0 },
          { opacity: 0.82 }
        ],
        {
          duration: 360,
          delay: index * 32,
          easing: "ease-out",
          fill: "both"
        }
      );
      this.animations.push(animation);
    });

    // 第二阶段：堆叠停留后，逐行飞向心形轮廓。
    const flyTimer = window.setTimeout(() => {
      this.flyToTargets();
    }, 1120);
    this.animationTimers.push(flyTimer);
  }

  flyToTargets() {
    if (!this.isPlaying) return;
    const total = this.lines.length;
    this.lines.forEach((line, index) => {
      const target = `translate(-50%, -50%) rotate(${line.rotation.toFixed(2)}deg)`;
      const animation = line.el.animate(
        [
          { transform: line.el.style.transform, opacity: 0.82 },
          { transform: target, opacity: 0.82 }
        ],
        {
          duration: 780,
          delay: index * 100,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both"
        }
      );
      this.animations.push(animation);
    });

    const finish = window.setTimeout(() => {
      this.onAssembled();
    }, 780 + (total - 1) * 100 + 280);
    this.animationTimers.push(finish);
  }

  onAssembled() {
    if (!this.isPlaying) return;
    this.centerCopy.classList.remove("is-hidden");
    this.showDefaultCenter(true);
    this.startCenterCycle();
    const replayTimer = window.setTimeout(() => this.onReplayReady?.(), 5000);
    this.animationTimers.push(replayTimer);
  }

  stop() {
    this.isPlaying = false;
    this.clearCenterTimers();
    this.clearAnimationTimers();
    this.cancelAnimations();
    this.lines.forEach((line) => {
      line.el.style.opacity = "0";
      line.el.style.transform = "translate(-50%, -50%) scale(0.94)";
    });
    this.centerCopy.classList.add("is-hidden");
    this.centerCopy.classList.remove("is-out", "is-in", "is-long");
  }

  reset() {
    this.stop();
    this.current = null;
    this.queue = [];
    this.centerCopy.classList.add("is-hidden");
  }
}
