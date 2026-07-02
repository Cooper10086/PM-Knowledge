---
publish: true
tags:
  - quartz
---


整体架构：Obsidian（存在 iCloud）→ 筛选脚本同步到 Quartz 项目 → 推送 GitHub → GitHub Actions 自动构建部署 → GitHub Pages 网站

- 仓库地址：https://github.com/Cooper10086/PM-Knowledge
- 网站地址：https://cooper10086.github.io/PM-Knowledge
- 本地项目路径：`~/claude-workspace/PM-Knowledge`
- Obsidian vault 路径：`/Users/cooper.fu/Library/Mobile Documents/com~apple~CloudDocs/Obsidian-05:02/Cooper`
- 默认分支：`v5`

---

## 一、当初是怎么搭起来的（一次性配置，已完成，仅作记录）

### 1. 创建 Quartz 项目

```bash
git clone https://github.com/Cooper10086/PM-Knowledge.git
cd PM-Knowledge
npm i
npx quartz create
```

`quartz create` 交互问题选择：

- 模板：obsidian
- 内容导入方式：Empty Quartz
- baseUrl：`cooper10086.github.io/PM-Knowledge`

### 2. 补充 GitHub Pages 部署配置

Quartz 模板本身不自带部署到 GitHub Pages 的 workflow，需要手动创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy Quartz site to GitHub Pages

on:
  push:
    branches:
      - v5

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - name: Cache dependencies
        uses: actions/cache@v5
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      - name: Cache Quartz plugins
        uses: actions/cache@v5
        with:
          path: .quartz/plugins
          key: ${{ runner.os }}-plugins-${{ hashFiles('quartz.lock.json') }}
          restore-keys: |
            ${{ runner.os }}-plugins-
      - name: Install Dependencies
        run: npm ci
      - name: Install Quartz plugins
        run: npx quartz plugin install
      - name: Build Quartz
        run: npx quartz build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: public

  deploy:
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

然后去仓库 **Settings → Pages → Source** 选择 **GitHub Actions**，并推送这个文件触发一次部署。

### 3. 筛选同步脚本 `sync-publish.js`

放在 `PM-Knowledge` 项目根目录下（跟 `package.json` 同一层），完整内容：

```javascript
import fs from "fs";
import path from "path";

const VAULT_DIR = "/Users/cooper.fu/Library/Mobile Documents/com~apple~CloudDocs/Obsidian-05:02/Cooper";
const CONTENT_DIR = "./content";

function isPublished(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  return m ? /publish:\s*"?true"?/.test(m[1]) : false;
}

function extractAssetLinks(text) {
  const links = new Set();
  for (const m of text.matchAll(/!\[\[([^\]|]+)(\|[^\]]*)?\]\]/g)) links.add(m[1]);
  for (const m of text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) links.add(decodeURIComponent(m[1]));
  return [...links];
}

function findAsset(root, name) {
  let result = null;
  (function search(dir) {
    if (result) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (result) return;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) search(full);
      else if (e.name === path.basename(name)) result = full;
    }
  })(root);
  return result;
}

fs.rmSync(CONTENT_DIR, { recursive: true, force: true });
fs.mkdirSync(CONTENT_DIR, { recursive: true });

let count = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full); continue; }
    if (!e.name.endsWith(".md")) continue;

    const text = fs.readFileSync(full, "utf-8");
    if (!isPublished(text)) continue;

    const rel = path.relative(VAULT_DIR, full);
    const destMd = path.join(CONTENT_DIR, rel);
    fs.mkdirSync(path.dirname(destMd), { recursive: true });
    fs.writeFileSync(destMd, text);
    count++;

    for (const link of extractAssetLinks(text)) {
      const found = findAsset(VAULT_DIR, link);
      if (found) {
        const dest = path.join(CONTENT_DIR, path.relative(VAULT_DIR, found));
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(found, dest);
      }
    }
  }
})(VAULT_DIR);

fs.writeFileSync(path.join(CONTENT_DIR, "index.md"), `---
title: 首页
---

欢迎，这里是已发布的笔记列表。
`);

console.log(`已同步 ${count} 篇标记为 publish:true 的笔记`);
```

这个脚本做的事：

1. 清空 `content` 文件夹
2. 遍历整个 Obsidian vault，找到 frontmatter 里 `publish: true`（或 `publish: "true"`）的笔记
3. 把这些笔记复制进 `content` 文件夹，保留原有的文件夹分类结构
4. 同时找到笔记里引用的图片/附件一并复制过去
5. 生成一个简单的首页 `index.md`，避免访问网站根路径 404

### 4. package.json 快捷命令

在 `package.json` 的 `scripts` 字段里加了一行（注意要在同一个 `{ }` 里，用逗号分隔）：

```json
"scripts": {
  "quartz": "./quartz/bootstrap-cli.mjs",
  "docs": "npx quartz build --serve -d docs",
  "check": "tsc --noEmit && npx prettier . --check",
  "format": "npx prettier . --write",
  "test": "tsx --test",
  "profile": "0x -D prof ./quartz/bootstrap-cli.mjs build --concurrency=1",
  "install-plugins": "npx tsx ./quartz/plugins/loader/install-plugins.ts",
  "prebuild": "npm run install-plugins",
  "publish-notes": "node sync-publish.js && npx quartz sync"
}
```

---

## 二、以后发布新笔记的日常操作

### 第一步：在 Obsidian 里标记要发布的笔记

1. 打开笔记
2. 顶部 Properties 区域点 **"+ Add property"**
3. 属性名填 `publish`，类型选 **Checkbox**（不要选 Text，否则会存成带引号的字符串导致脚本识别不到）
4. 勾选打钩 = 发布，不勾 = 不发布

想确认有没有加对，切到源码模式看笔记最顶部应该是：

```yaml
---
publish: true
---
```

（没有引号才对）

### 第二步：打开终端，进入项目目录

```bash
cd ~/claude-workspace/PM-Knowledge
```

### 第三步：跑同步 + 发布

**方式一，用快捷命令（推荐）**：

```bash
npm run publish-notes
```

**方式二，分两条命令手动跑（等价，遇到问题方便单独排查是哪一步）**：

```bash
node sync-publish.js
npx quartz sync
```

跑完终端会显示：

```
已同步 X 篇标记为 publish:true 的笔记
```

`X` 是这次总共匹配到的已发布笔记数量（不是新增数量，是当前所有打了 `publish: true` 的笔记总数，因为脚本每次都是全量重新生成）。

### 第四步：确认部署成功

1. 去 GitHub 仓库 → **Actions** 标签页
2. 看最新一次 **"Deploy Quartz site to GitHub Pages"** 运行状态，变绿色对勾即成功（一般 1-2 分钟）
3. 打开 https://cooper10086.github.io/PM-Knowledge 确认，如果看到的还是旧内容，强制刷新浏览器（`Cmd + Shift + R`）排除缓存

### 可选：本地先预览再推送

如果不放心想先看看效果再推上线，在跑 `quartz sync` 之前先本地起服务看一眼：

```bash
node sync-publish.js
npx quartz build --serve
```

浏览器打开 `http://localhost:8080` 确认没问题，按 `Ctrl + C` 停掉本地服务，再跑：

```bash
npx quartz sync
```

---

## 三、重要机制说明

- **取消发布**：把 Obsidian 里某篇笔记的 `publish` 属性取消勾选，再跑一次 `npm run publish-notes`，这篇笔记会从网站上消失——因为脚本每次都是"清空 content 全量重新生成"，不是增量叠加
- **仓库可见性影响隐私程度**：
    - 仓库是 **Public**：网站内容公开是预期的，但仓库完整 git 提交历史也任何人可查，意味着"取消发布"过的笔记理论上仍能通过翻历史 commit 找到
    - 仓库是 **Private**：他人看不到源文件和历史记录，但网站本身（GitHub Pages 生成的页面）通常依然是公开可访问的
    - 如果希望"取消发布=彻底消失"，建议把仓库设为 Private（Settings 最下面 Danger Zone）

---

## 四、常见问题排查

|现象|大概率原因|
|---|---|
|访问网站根路径 404，但笔记页面能打开|`content` 文件夹缺 `index.md`，脚本已经处理，不应再出现|
|`node sync-publish.js` 报 `ENOENT` 路径错误|`sync-publish.js` 里 `VAULT_DIR` 路径没填对或被改回了占位符|
|跑完显示"已同步 0 篇"|frontmatter 属性类型选错（Text 类型会存成带引号的 `"true"`），或者 `---` 不在文件最开头|
|推送后 Actions 没有对应工作流运行|检查 `.github/workflows/deploy.yml` 里 `branches` 填的分支名和 `git branch --show-current` 显示的是否一致|
|package.json 报 JSON 解析错误|手动编辑时把新脚本写到了 `scripts` 对象外面，需要保证在同一个 `{ }` 内|

---

## 五、修改站点标题（页面上的 "Quartz 5" 字样）

Quartz v5 的配置文件是 `quartz.config.yaml`（注意不是 `.ts` 文件），"Quartz 5" 是 `pageTitle` 字段的默认值。

```bash
cd ~/claude-workspace/PM-Knowledge
code quartz.config.yaml
```

找到最顶部这一段，把 `pageTitle` 改成想要的名字：

```yaml
configuration:
  pageTitle: "Cooper 的产品笔记"
```

如果还想给浏览器标签页标题加个后缀（不影响页面上显示的标题），可以顺便设置：

```yaml
configuration:
  pageTitle: "Cooper 的产品笔记"
  pageTitleSuffix: " · Cooper"
```

改完之后本地预览确认效果，没问题再推送：

```bash
node sync-publish.js
npx quartz build --serve
# 确认无误，Ctrl + C 停掉本地服务后：
npx quartz sync
```

## 六、⚠️ 一处需要更正的历史建议

在正式创建这个项目之前，曾经给过一份关于"页面排版好看"的建议，里面用的是 `quartz.config.ts` 的语法（`theme.typography`、`theme.colors` 那种写法）。**这个语法对应的是 Quartz 旧版本（v4），跟你实际用的 v5 不匹配**——v5 的字体和配色配置实际上要写在 `quartz.config.yaml` 里，格式类似：

```yaml
configuration:
  theme:
    typography:
      header: Schibsted Grotesk
      body: Source Sans Pro
      code: IBM Plex Mono
```

如果之后想调整正文字体、配色这些排版细节，按这个 YAML 格式来，不要照抄之前给的 TS 版本代码。