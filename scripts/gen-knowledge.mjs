import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, basename, extname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CWD = resolve(__dirname, '..');
const DOCS = join(CWD, 'docs');
const OUTPUT = join(CWD, 'theme', 'data', 'knowledge-data.ts');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  return parseBlock(match[1].split('\n').filter(l => l.trim()));
}

function parseBlock(lines) {
  const result = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const indent = line.search(/\S/);
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) { i++; continue; }
    const key = line.slice(0, colonIdx).trim();
    const afterColon = line.slice(colonIdx + 1).trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    const nextIndent = nextLine ? nextLine.search(/\S/) : 0;
    if (!afterColon && nextLine && nextIndent > indent) {
      const children = [];
      i++;
      while (i < lines.length) {
        if (lines[i].search(/\S/) <= indent || !lines[i].trim()) break;
        children.push(lines[i++]);
      }
      result[key] = parseBlock(children);
    } else {
      let val = afterColon.replace(/^['"]|['"]$/g, '');
      if (/^\d+$/.test(val)) val = parseInt(val);
      result[key] = val;
      i++;
    }
  }
  return result;
}

async function scanDocs(dir) {
  if (!existsSync(dir)) { console.error('❌ 目录不存在: ' + dir); process.exit(1); }
  const results = [];
  async function walk(d) {
    for (const e of await readdir(d, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name.startsWith('_')) continue;
      const full = join(d, e.name);
      if (e.isDirectory()) { await walk(full); }
      else if (e.isFile() && extname(e.name) === '.md') {
        const raw = readFileSync(full, 'utf-8');
        const fm = parseFrontmatter(raw);
        const rel = full.replace(dir, '').replace(/\\/g, '/').replace(/\/index\.md$/, '/').replace(/\.md$/, '');
        results.push({ rel, fm, name: basename(e.name, '.md') });
      }
    }
  }
  await walk(dir);
  return results;
}

/**
 * 以 docs/ 目录结构区分 nav 分组。
 * 顶层目录名即为 nav 名称，通过 nav.order 控制排序。
 * 如果有 index.md 作为分组名则读取，否则用目录名。
 */
function buildKnowledgeData(docs) {
  // 按目录分组（去掉 rel 开头的 /）
  const dirMap = new Map();
  for (const doc of docs) {
    const parts = doc.rel.replace(/^\//, '').split('/');
    const dir = parts.length > 1 ? parts[0] : '/';
    if (!dirMap.has(dir)) dirMap.set(dir, { name: dir, docs: [] });
    dirMap.get(dir).docs.push(doc);
  }

  const entries = [];
  const added = new Set();

  // 先收集所有模块，按 nav.order 排序
  const modules = [];
  for (const [dir, group] of dirMap) {
    if (dir === '/') continue; // 跳过根目录（首页等）
    const navTitle = group.docs[0]?.fm?.nav?.title || dir;
    const navOrder = group.docs[0]?.fm?.nav?.order ?? 99;
    modules.push({ dir, navTitle, navOrder, group });
  }
  modules.sort((a, b) => a.navOrder - b.navOrder);

  for (const { dir, navTitle, navOrder, group } of modules) {
    // 按 group.title 分二级
    const subMap = new Map();
    for (const doc of group.docs) {
      const g = doc.fm.group || {};
      const gk = g.title || '其他';
      if (!subMap.has(gk)) subMap.set(gk, { title: gk, order: g.order ?? 99, items: [] });
      subMap.get(gk).items.push(doc);
    }

    const sortedGroups = [...subMap.values()].sort((a, b) => a.order - b.order);

    // 生成模块节点（每个模块独立为树根节点，parentId 为 null）
    const modId = dir;
    if (!added.has(modId)) {
      entries.push({ id: modId, label: navTitle, parentId: null, color: '#0958d9', bg: '#e6f4ff', fontSize: 14 });
      added.add(modId);
    }

    for (const sg of sortedGroups) {
      const gId = `${modId}-${sg.title.replace(/[【】\s]/g, '')}`;
      if (!added.has(gId)) {
        entries.push({
          id: gId,
          label: sg.title,
          parentId: modId,
          color: '#0958d9',
          bg: '#e6f4ff',
        });
        added.add(gId);
      }

      const sortedItems = sg.items.sort((a, b) => (a.fm.order ?? 99) - (b.fm.order ?? 99));
      for (const item of sortedItems) {
        if (!added.has(item.rel)) {
          entries.push({
            id: item.rel,
            label: item.fm.title || item.name,
            parentId: gId,
            link: item.rel,
            color: '#555',
            bg: '#fff',
          });
          added.add(item.rel);
        }
      }
    }
  }

  return entries;
}

function generateFile(entries) {
  const items = entries.map(e => {
    const fields = [];
    fields.push(`id: '${e.id}'`);
    fields.push(`label: '${e.label.replace(/'/g, "\\'")}'`);
    if (e.parentId) fields.push(`parentId: '${e.parentId}'`);
    else fields.push('parentId: null');
    if (e.link) fields.push(`link: '${e.link}'`);
    fields.push(`color: '${e.color}'`);
    fields.push(`bg: '${e.bg}'`);
    if (e.fontSize) fields.push(`fontSize: ${e.fontSize}`);
    return `  { ${fields.join(', ')} }`;
  }).join(',\n');

  return `// ============================================================
//  自动生成 — 运行 pnpm gen-knowledge 更新
//  加新文章后运行 pnpm gen-knowledge 即可
// ============================================================

export interface KnowledgeItem {
  id: string;
  label: string;
  parentId: string | null;
  link?: string;
  color: string;
  bg: string;
  fontSize?: number;
}

export const KNOWLEDGE_DATA: KnowledgeItem[] = [
${items},
];
`;
}

const docs = await scanDocs(DOCS);
const entries = buildKnowledgeData(docs);
const code = generateFile(entries);

if (process.argv.includes('--write')) {
  writeFileSync(OUTPUT, code, 'utf-8');
  console.log('✅ 已写入: ' + OUTPUT);
} else {
  console.log('\n📁 ' + docs.length + ' 篇文章\n');
  const byNav = new Map();
  for (const d of docs) {
    const n = (d.fm.nav || {}).title || '(无)';
    if (!byNav.has(n)) byNav.set(n, []);
    byNav.get(n).push(d);
  }
  for (const [n, items] of byNav) {
    console.log('📘 ' + n + ' (' + items.length + ' 篇)');
    const byG = new Map();
    for (const d of items) {
      const g = (d.fm.group || {}).title || '(无)';
      if (!byG.has(g)) byG.set(g, []);
      byG.get(g).push(d);
    }
    for (const [g, gItems] of byG) {
      console.log('  📂 ' + g);
      gItems.sort((a, b) => (a.fm.order ?? 99) - (b.fm.order ?? 99)).slice(0, 3)
        .forEach(d => console.log('    📄 ' + (d.fm.title || d.name)));
      if (gItems.length > 3) console.log('    ... 等' + gItems.length + '篇');
    }
  }
  console.log('\n⚡ 预览完成。加 --write 生成文件');
}
