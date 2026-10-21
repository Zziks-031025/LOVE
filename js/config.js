// 「我与她」页面配置
// 只改这个文件就能替换名字、情话、音乐、主题与动画参数。
// 情话按“段”组织：每段 2–3 行，整段只出现在心形的一侧。
// 当前为 10 段 / 28 行：左侧第 1–5 段，右侧第 6–10 段。

export const CONFIG = {
  // 对方名字会显示在第二幕爱心中央；留空时显示“你”。
  herName: "你",
  // 使用者自称，预留给落款或后续扩展。
  myName: "我",

  // rose / red / gold
  theme: "rose",
  // 2d / 3d
  defaultMode: "2d",

  // 背景音乐；没有文件时音乐按钮会显示提示，不影响其余动画。
  music: "assets/audio/bgm.mp3",
  // 4 位数字口令；留空表示关闭。
  password: "",

  // 2D 爱心粒子数。手机端会自动降到 2200 左右。
  particleCount: 3000,
  // 自动烟花间隔，单位毫秒。
  fireworkInterval: [1500, 3000],
  maxFireworks: 8,

  // 增强功能：烟花文字。没有确认短语时保持关闭。
  fireworkTextEnabled: false,
  fireworkText: "今天想你",

  // 第五幕中心句循环。
  center: {
    defaultLines: ["以后的路", "我陪你走"],
    keyword: "陪你",
    intervalMs: 5000,
    fadeOutMs: 600,
    fadeInMs: 700,
    holdMs: 4000
  },

  // 10 段情话。lines 是一行一个文字节点，keyword 会以亮色强调。
  paragraphs: [
    {
      id: 1,
      side: "left",
      lines: ["第一次见你，", "我把那天", "记成了节日。"],
      keyword: "节日"
    },
    {
      id: 2,
      side: "left",
      lines: ["那天人很多，", "我只看见", "你的侧脸。"],
      keyword: "侧脸"
    },
    {
      id: 3,
      side: "left",
      lines: ["那一眼很轻，", "落在我心里", "却很重。"],
      keyword: "很重"
    },
    {
      id: 4,
      side: "left",
      lines: ["和你吃饭，", "连沉默都", "不觉得尴尬。"],
      keyword: "尴尬"
    },
    {
      id: 5,
      side: "left",
      lines: ["你说明天见，", "我就开始", "期待明天。"],
      keyword: "明天"
    },
    {
      id: 6,
      side: "right",
      lines: ["你靠在我肩上睡着，", "我一动", "也不敢动。"],
      keyword: "不敢动"
    },
    {
      id: 7,
      side: "right",
      lines: ["今天看到一朵云，", "第一反应是", "想给你看。"],
      keyword: "看"
    },
    {
      id: 8,
      side: "right",
      lines: ["我这边下雨了，", "想知道你", "带伞没有。"],
      keyword: "没有"
    },
    {
      id: 9,
      side: "right",
      lines: ["我不是一时兴起，", "是想和你很久。"],
      keyword: "很久"
    },
    {
      id: 10,
      side: "right",
      lines: ["以后的路，", "我陪你走。"],
      keyword: "陪你"
    }
  ]
};

export const THEMES = {
  rose: {
    primary: "#FF4D6D",
    light: "#FF8FA3",
    deep: "#C9184A",
    soft: "#FFD6DE",
    pale: "#FFE4EA"
  },
  red: {
    primary: "#E63946",
    light: "#FF6B6B",
    deep: "#9D0208",
    soft: "#FFD5D8",
    pale: "#FFE8EA"
  },
  gold: {
    primary: "#D4AF37",
    light: "#F0D9A8",
    deep: "#A67C00",
    soft: "#F5E6BD",
    pale: "#FFF4D8"
  }
};
