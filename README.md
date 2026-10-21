# 有句话想对你说

一个纯静态、五幕式的表白页。打开后先看到粒子爱心，点一下进入爱心、烟花、情话，最后收束成一颗由 28 行文字组成的心，中间那句话会轻轻轮换。

页面没有数据库，也不需要构建工具，直接部署静态文件即可。

线上地址：<https://zziks-031025.github.io/LOVE/>

## 本地预览

在 `LOVE` 目录启动一个静态服务器：

```bash
cd LOVE
python -m http.server 8000
```

浏览器打开 `http://127.0.0.1:8000/`。

> 不要直接双击 `index.html`。页面使用 ES Module，本地 `file://` 打开会被浏览器的模块安全策略拦住。

## 替换成你的内容

所有内容都在 `js/config.js`：

- `herName` / `myName`：对方和你的称呼，留空时会回退为“你”/“我”。
- `theme`：`rose`、`red`、`gold` 三套主题。
- `defaultMode`：默认 `2d`；页面加载后也可以点右上角切到 3D。
- `music`：背景音乐路径，默认是 `assets/audio/bgm.mp3`。换成自己的音乐时，请确认你有使用权。
- `password`：四位数字口令。留空表示关闭；它只是页面上的轻量门禁，不是真正的安全措施。
- `paragraphs`：10 段情话，每段 2–3 行，左侧 1–5 段、右侧 6–10 段。改文案时保持每段只在一侧即可。
- `center`：文字心中央的默认句、关键词和轮换节奏。

`js/config.js` 里的文案会自动同步到烟花后的文字幕和最后的文字心，不需要改两处。

## 资源

- `assets/audio/bgm.mp3`：默认是一段生成的占位音乐，发布前建议换成你选好的歌。
- `assets/img/share-cover.jpg`：分享封面，可用 `python tools/make_assets.py` 重新生成。
- `vendor/three.module.js`：本地 Three.js，只在切到 3D 时按需加载。

## 交互

| 幕 | 操作 |
| --- | --- |
| 开场 | 点击 / 轻触 / 回车或空格进入 |
| 爱心 | 点击“继续”，或等待按钮出现后进入烟花；右上角可切换 2D/3D |
| 烟花 | 点击空白处放一朵烟花；点击“继续”进入情话 |
| 情话 | 自动逐段出现；右上角“跳过”直接进入文字心 |
| 文字心 | 中央句约每 5 秒换一句；全部归位后出现“再看一遍” |

3D 爱心支持拖动旋转；手机横屏时会使用 16:9 舞台，竖屏会提示旋转手机。

## 部署到 GitHub Pages

仓库里已经带好 `.github/workflows/pages.yml`。把 `LOVE` 目录推到 GitHub 仓库的 `main` 分支后：

1. 打开仓库的 **Settings → Pages**。
2. 在 **Build and deployment** 里把 Source 设为 **GitHub Actions**。
3. 等 Actions 跑完，页面地址是 `https://<你的用户名>.github.io/<仓库名>/`。

部署后可以在 `index.html` 里把 `og:url` 和 `og:image` 换成完整 HTTPS 地址，微信等应用分享时更容易显示封面。

## 说明

- 这是纯静态页面，口令只存在前端代码里，无法阻止懂技术的人查看源码；不要用它保护敏感信息。
- 页面默认不写入真实姓名、手机号或住址，发布前请自己检查一遍文案。
- 2D 爱心使用 Canvas 2D，3D 爱心使用 Three.js，烟花使用 Canvas 2D；没有后端和追踪脚本。
