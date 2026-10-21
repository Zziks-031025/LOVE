export class AudioController {
  constructor(src, { volume = 0.6, onError = null } = {}) {
    this.src = src;
    this.targetVolume = volume;
    this.currentVolume = 0;
    this.playing = false;
    this.available = Boolean(src);
    this.onError = onError;
    this.fadeFrame = 0;
    this.audio = null;

    if (!this.available) return;
    const audio = new Audio();
    audio.src = src;
    audio.preload = "metadata";
    audio.loop = true;
    audio.volume = 0;
    audio.addEventListener("error", () => {
      this.available = false;
      this.playing = false;
      this.onError?.("音乐文件加载失败");
    });
    this.audio = audio;
  }

  async start() {
    if (!this.audio || !this.available) return false;
    try {
      await this.audio.play();
      this.playing = true;
      this.fadeTo(this.targetVolume, 2000);
      return true;
    } catch (error) {
      this.playing = false;
      this.onError?.("点击音乐按钮再试一次");
      return false;
    }
  }

  async toggle() {
    if (!this.audio || !this.available) {
      this.onError?.("未找到背景音乐");
      return false;
    }
    if (this.audio.paused) {
      return this.start();
    }
    this.audio.pause();
    this.playing = false;
    this.fadeTo(0, 300);
    return false;
  }

  fadeTo(target, duration = 600) {
    if (!this.audio) return;
    window.cancelAnimationFrame(this.fadeFrame);
    const start = this.currentVolume;
    const startedAt = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      this.currentVolume = start + (target - start) * eased;
      this.audio.volume = Math.max(0, Math.min(1, this.currentVolume));
      if (t < 1) {
        this.fadeFrame = requestAnimationFrame(tick);
      }
    };
    this.fadeFrame = requestAnimationFrame(tick);
  }

  pause() {
    if (!this.audio) return;
    this.audio.pause();
    this.playing = false;
  }

  get isPlaying() {
    return this.playing && this.audio && !this.audio.paused;
  }
}
