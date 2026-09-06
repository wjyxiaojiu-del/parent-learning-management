// 一次性开发脚本：把小程序各页面 .wxss 转换为网页 pages.css
// - rpx -> px（÷2，对应 750rpx=375px 设计稿）
// - 每个页面的样式用 .page-<name> 作用域隔离，还原小程序页面级样式作用域
// 用法：node web/tools/convert-wxss.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const PAGES_DIR = path.join(ROOT, 'miniprogram', 'pages');
const OUT = path.join(__dirname, '..', 'frontend', 'css', 'pages.css');

const PAGES = [
  'today', 'records', 'profile', 'settings',
  'workout', 'health-growth', 'reward-exchange',
  'course-manage', 'review-detail',
];

function rpxToPx(css) {
  return css.replace(/(-?\d*\.?\d+)rpx/g, (_, n) => `${parseFloat(n) / 2}px`);
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function scopeCss(css, scope) {
  let result = '';
  let i = 0;
  const len = css.length;
  while (i < len) {
    const braceIdx = css.indexOf('{', i);
    if (braceIdx === -1) { result += css.slice(i); break; }
    const prelude = css.slice(i, braceIdx);
    let depth = 1;
    let j = braceIdx + 1;
    for (; j < len; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') { depth--; if (depth === 0) break; }
    }
    const body = css.slice(braceIdx + 1, j);
    const preludeTrim = prelude.trim();
    if (/^@(-webkit-)?keyframes/.test(preludeTrim)) {
      result += `${prelude}{${body}}\n`;
    } else if (preludeTrim.startsWith('@')) {
      result += `${prelude}{${scopeCss(body, scope)}}\n`;
    } else {
      const selectors = preludeTrim
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (s === 'page' ? scope : `${scope} ${s}`))
        .join(',\n');
      result += `${selectors} {${body}}\n`;
    }
    i = j + 1;
  }
  return result;
}

let out = '/* 自动生成：由 web/tools/convert-wxss.js 从各页面 .wxss 转换而来。请勿手改。 */\n';
for (const name of PAGES) {
  const file = path.join(PAGES_DIR, name, `${name}.wxss`);
  if (!fs.existsSync(file)) { console.warn('跳过缺失:', file); continue; }
  const raw = fs.readFileSync(file, 'utf8');
  const scoped = scopeCss(stripComments(rpxToPx(raw)), `.page-${name}`);
  out += `\n/* ===== ${name} ===== */\n${scoped}`;
}
fs.writeFileSync(OUT, out, 'utf8');
console.log('已生成', OUT);
