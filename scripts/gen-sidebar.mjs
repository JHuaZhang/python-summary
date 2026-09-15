/**
 * gen-sidebar.mjs — 扫描 docs/ 下所有 markdown 文件，解析 frontmatter，
 * 自动生成 rspress.config.ts（包含 nav + sidebar 结构）。
 *
 * Frontmatter 格式：
 *   nav:
 *     title: Python基础
 *     order: 1
 *   group:
 *     title: 【01】初识python
 *     order: 1
 *   order: 1
 *   title: Python介绍及安装
 *
 * 用法：
 *   node scripts/gen-sidebar.mjs           仅打印配置到终端
 *   node scripts/gen-sidebar.mjs --write   将配置写入 rspress.config.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const docsDir = path.join(projectRoot, 'docs');
const configFile = path.join(projectRoot, 'rspress.config.ts');

// ── 1. 解析 frontmatter ───────────────────────────────────────────

/**
 * 解析单个 markdown 文件的 frontmatter（仅 YAML 简易解析）。
 * 返回 { nav, group, order, title } 或 null。
 */
function parseFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  const fmText = fmMatch[1];
  const result = {
    nav: null,
    group: null,
    order: 9999,
    title: '',
  };

  // 逐行解析
  let currentTopKey = null;
  for (const line of fmText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // top-level key (no leading space)
    if (/^\w/.test(line)) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      currentTopKey = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();

      if (currentTopKey === 'order') {
        result.order = parseInt(value, 10) || 9999;
      } else if (currentTopKey === 'title') {
        result.title = value;
      } else if (currentTopKey === 'nav') {
        result.nav = {};
      } else if (currentTopKey === 'group') {
        if (result.group === null) result.group = {};
      }
    }

    // nested key (2 spaces + key: value)
    else if (/^  \w/.test(line) && (currentTopKey === 'nav' || currentTopKey === 'group')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const subKey = line.slice(0, colonIdx).trim();
      const subVal = line.slice(colonIdx + 1).trim();
      result[currentTopKey][subKey] = subKey === 'order' ? parseInt(subVal, 10) || 0 : subVal;
    }
  }

  // 无 nav 的文件跳过
  if (!result.nav || !result.nav.title) return null;
  return result;
}

// ── 2. 收集所有文档 ────────────────────────────────────────────────

function collectDocs() {
  const items = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
        const fm = parseFrontmatter(fullPath);
        if (fm) {
          const relativePath = path.relative(docsDir, fullPath);
          // 文件路径转为路由：去掉 .md，把 path sep 换成 /
          const route = '/' + relativePath.replace(/\.md$/, '').replace(/\\/g, '/');
          items.push({ ...fm, route });
        }
      }
    }
  }
  walk(docsDir);
  return items;
}

// ── 3. 构建 nav + sidebar 结构 ─────────────────────────────────────

function buildSidebar(items) {
  // 按 nav.title 分组
  const navMap = new Map();
  for (const item of items) {
    const navTitle = item.nav.title;
    if (!navMap.has(navTitle)) {
      navMap.set(navTitle, []);
    }
    navMap.get(navTitle).push(item);
  }

  // 对每个 nav 构建 sidebar
  const navs = [];
  for (const [navTitle, groupItems] of navMap) {
    // 找到该 nav 下第一个文档的 order 作为 nav order
    const navOrder = groupItems[0]?.nav?.order ?? 9999;

    // 按 group.title 分组
    const groupMap = new Map();
    for (const item of groupItems) {
      const groupTitle = item.group?.title || 'default';
      if (!groupMap.has(groupTitle)) {
        groupMap.set(groupTitle, []);
      }
      groupMap.get(groupTitle).push(item);
    }

    // 构建 sidebar sections
    const sidebarSections = [];
    for (const [groupTitle, groupDocs] of groupMap) {
      // 按 order 排序
      groupDocs.sort((a, b) => a.order - b.order);
      const groupOrder = groupDocs[0]?.group?.order ?? 9999;

      const children = groupDocs.map((doc) => ({
        text: doc.title,
        link: doc.route,
      }));

      sidebarSections.push({
        text: groupTitle,
        order: groupOrder,
        items: children,
      });
    }

    // 按 group order 排序 sections
    sidebarSections.sort((a, b) => a.order - b.order);

    // 移除 order 字段（Rspress sidebar 不需要）
    const sidebarClean = sidebarSections.map(({ order, ...rest }) => rest);

    // 生成 nav 的路由前缀
    // 所有文档都在 Base/ 下，nav 路由用 /base 作为 key
    // Rspress 的 navWithSidebar 用 nav 的 key 来匹配 sidebar
    const navKey = '/' + groupItems[0].route.split('/')[1]; // /base

    navs.push({
      text: navTitle,
      order: navOrder,
      link: navKey,
      // 找到 navKey 对应的 sidebar
      sidebarKey: navKey,
    });
  }

  // 按 nav order 排序
  navs.sort((a, b) => a.order - b.order);

  // 构建 sidebar 对象（key = navKey）
  const sidebarMap = {};

  // 为每个 nav key 生成 sidebar 配置
  for (const nav of navs) {
    sidebarMap[nav.sidebarKey] = [];

    // 收集该 nav 下的所有 groups
    const navItems = items.filter((item) => item.nav.title === nav.text);

    // 按 group 分组
    const groupMap = new Map();
    for (const item of navItems) {
      const groupTitle = item.group?.title || 'default';
      if (!groupMap.has(groupTitle)) {
        groupMap.set(groupTitle, []);
      }
      groupMap.get(groupTitle).push(item);
    }

    for (const [groupTitle, groupDocs] of groupMap) {
      groupDocs.sort((a, b) => a.order - b.order);
      const children = groupDocs.map((doc) => ({
        text: doc.title,
        link: doc.route,
      }));
      sidebarMap[nav.sidebarKey].push({
        text: groupTitle,
        items: children,
      });
    }
  }

  return { navs, sidebarMap };
}

// ── 4. 生成配置文件内容 ─────────────────────────────────────────────

function generateConfig() {
  const items = collectDocs();
  const { navs, sidebarMap } = buildSidebar(items);

  // 序列化 nav（对齐 ai-summary 格式）
  const navArr = navs.map((n) => ({
    text: n.text,
    link: n.link + '/' + (items.find((i) => i.nav.title === n.text)?.route.split('/')[2] || ''),
    activeMatch: '^' + n.link + '/',
  }));
  const navStr = JSON.stringify(navArr, null, 4)
    .replace(/"text":/g, '"text":')
    .replace(/"link":/g, '"link":')
    .replace(/"activeMatch":/g, '"activeMatch":');

  // 序列化 sidebar（对齐 ai-summary 格式：collapsible: true，key 用 /Base/ 格式）
  const sidebarObj = {};
  for (const [key, groups] of Object.entries(sidebarMap)) {
    sidebarObj[key + '/'] = groups.map((g) => ({
      text: g.text,
      collapsible: true,
      items: g.items,
    }));
  }
  const sidebarStr = JSON.stringify(sidebarObj, null, 4)
    .replace(/"text":/g, '"text":')
    .replace(/"collapsible":/g, '"collapsible":')
    .replace(/"link":/g, '"link":');

  const configContent = `import { defineConfig } from '@rspress/core';

/**
 * ============================================================
 *  自动生成 — 运行 pnpm gen-config 更新
 *  加新文章后运行 pnpm gen-config 即可，无需手改
 * ============================================================ */
const basePath = process.env.BASE_PATH || '/';

export default defineConfig({
  title: 'Python 学习笔记',
  logo: basePath + 'logo.png',
  logoText: 'Python 学习笔记',
  icon: 'logo.ico',
  root: 'docs',
  base: basePath,
  outDir: 'dist',

  // 关闭 SSG（不预渲染 HTML），浏览器端渲染，内存大降
  ssg: false,

  themeConfig: {
    nav: ${navStr},
    sidebar: ${sidebarStr},
    footer: {
      message: 'Copyright © 2026 | Powered by Rspress',
    },
  },

  markdown: {
    link: {
      checkDeadLinks: false,
    },
  },
});
`;

  return configContent;
}

// ── 5. 主逻辑 ──────────────────────────────────────────────────────

const shouldWrite = process.argv.includes('--write');
const configContent = generateConfig();

if (shouldWrite) {
  fs.writeFileSync(configFile, configContent, 'utf-8');
  console.log(`✅ 配置已写入 ${configFile}`);
} else {
  console.log(configContent);
}