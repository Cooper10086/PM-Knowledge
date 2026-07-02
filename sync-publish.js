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