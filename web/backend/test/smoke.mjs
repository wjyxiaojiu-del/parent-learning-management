// 无头渲染冒烟测试：用 jsdom 把每个页面真实 mount 一遍，确认不抛异常且有产出。
// 运行：在 web/backend 目录下 node ../tools/smoke.mjs
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.join(__dirname, '..', '..', 'frontend');

const html = fs.readFileSync(path.join(FRONTEND, 'index.html'), 'utf8');
const dom = new JSDOM(html, { url: 'http://localhost/', pretendToBeVisual: true });

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.location = dom.window.location;
global.HTMLElement = dom.window.HTMLElement;
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
// localStorage shim
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
if (!global.structuredClone) global.structuredClone = (o) => JSON.parse(JSON.stringify(o));

const p = (rel) => pathToFileURL(path.join(FRONTEND, 'js', rel)).href;

const pages = [
  ['today', 'pages/today.js', true],
  ['records', 'pages/records.js', true],
  ['profile', 'pages/profile.js', true],
  ['settings', 'pages/settings.js', true],
  ['workout', 'pages/workout.js', true],
  ['health-growth', 'pages/health-growth.js', true],
  ['reward-exchange', 'pages/reward-exchange.js', true],
  ['course-manage', 'pages/course-manage.js', true],
  ['review-detail', 'pages/review-detail.js', true],
];

let fail = 0;
for (const [name, rel, isDefault] of pages) {
  try {
    const mod = await import(p(rel));
    const factory = mod.default;
    const inst = factory({});
    const div = document.createElement('div');
    inst.mount(div);
    const len = div.innerHTML.length;
    if (len < 50) throw new Error('产出过短: ' + len);
    // 触发一次重渲染，确认 render 幂等
    inst.render();
    console.log(`OK   ${name.padEnd(16)} (${len} chars)`);
  } catch (e) {
    fail++;
    console.log(`FAIL ${name.padEnd(16)} ${e.message}`);
    console.log(e.stack.split('\n').slice(1, 3).join('\n'));
  }
}

// 登录页
try {
  const mod = await import(p('pages/login.js'));
  const inst = mod.createLoginPage({});
  const div = document.createElement('div');
  inst.mount(div);
  if (div.innerHTML.length < 50) throw new Error('登录页产出过短');
  console.log(`OK   ${'login'.padEnd(16)} (${div.innerHTML.length} chars)`);
} catch (e) {
  fail++;
  console.log(`FAIL login ${e.message}`);
}

console.log(fail === 0 ? '\n✅ 全部页面渲染通过' : `\n❌ ${fail} 个页面失败`);
process.exit(fail === 0 ? 0 : 1);
