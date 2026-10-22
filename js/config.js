// 「我与她」页面配置
// 只改这个文件就能替换名字、情话、音乐、主题与动画参数。
// 情话按“段”组织：每段固定 2 行（在逗号处换行），行内不加标点；整段只出现在心形的一侧。
// 当前为 16 段 / 32 行：左侧 8 段，右侧 8 段。

export const CONFIG = {
  // 对方名字会显示在“致 …”抬头和落款处；留空时显示“你”。
  herName: "刘筱亚",
  // 使用者自称，预留给落款或后续扩展。
  myName: "周蒴",
  // 第二幕爱心中央的大字；留空时显示 herName。
  heartCenterText: "剩下的路，我陪你走",
  // 第二幕大字下方的一句小字；留空时不显示。
  heartNote: "",

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

  // 第五幕中心句循环：4–10 字短情话，按顺序逐条遍历，播完从头再来。
  center: {
    lines: [
      "今天想你",
      "想见你了",
      "一直是你",
      "心上有你",
      "见字如面",
      "为你心动",
      "岁岁有你",
      "等你回家",
      "今天也喜欢你",
      "余生请多指教"
    ],
    keyword: "",
    intervalMs: 5000,
    fadeOutMs: 600,
    fadeInMs: 700,
    holdMs: 4000
  },

  // 16 段情话。lines 是一行一个文字节点（每段 2 行、每段 14 字、不加标点），keyword 会以亮色强调。
  // 左半 8 段是前半篇，右半 8 段是后半篇，连起来是一封连贯的信。
  paragraphs: [
    {
      id: 1,
      side: "left",
      lines: ["第一次见你", "我把那天当成了节日"],
      keyword: "节日"
    },
    {
      id: 2,
      side: "left",
      lines: ["人很多的那天", "我只看见你的侧脸"],
      keyword: "侧脸"
    },
    {
      id: 3,
      side: "left",
      lines: ["每次路过那条街", "我都会走慢一点"],
      keyword: "慢一点"
    },
    {
      id: 4,
      side: "left",
      lines: ["我不是一见钟情", "是见了你才知情"],
      keyword: "一见钟情"
    },
    {
      id: 5,
      side: "left",
      lines: ["后来我们吃饭", "沉默也不觉得尴尬"],
      keyword: "沉默"
    },
    {
      id: 6,
      side: "left",
      lines: ["你说声明天见", "我就开始期待明天"],
      keyword: "期待明天"
    },
    {
      id: 7,
      side: "left",
      lines: ["你低头系鞋带", "我在旁边看了很久"],
      keyword: "鞋带"
    },
    {
      id: 8,
      side: "left",
      lines: ["和你一起浪费时间", "是最认真的事"],
      keyword: "认真"
    },
    {
      id: 9,
      side: "right",
      lines: ["你靠在我肩上睡着", "我不敢动一下"],
      keyword: "不敢动"
    },
    {
      id: 10,
      side: "right",
      lines: ["看见一朵云", "第一反应是想给你看"],
      keyword: "想给你看"
    },
    {
      id: 11,
      side: "right",
      lines: ["我这边下雨了", "想知道你带伞没有"],
      keyword: "带伞没有"
    },
    {
      id: 12,
      side: "right",
      lines: ["你没回消息", "我把手机看了很多遍"],
      keyword: "很多遍"
    },
    {
      id: 13,
      side: "right",
      lines: ["想见你这件事", "是每天最确定的事"],
      keyword: "最确定"
    },
    {
      id: 14,
      side: "right",
      lines: ["我不是一时兴起", "是想和你走很久"],
      keyword: "走很久"
    },
    {
      id: 15,
      side: "right",
      lines: ["如果重新来一次", "我还是会走向你"],
      keyword: "走向你"
    },
    {
      id: 16,
      side: "right",
      lines: ["这些话存了很久", "今天想让你知道"],
      keyword: "存了很久"
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
