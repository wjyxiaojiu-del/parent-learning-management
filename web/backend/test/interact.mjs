// 交互冒烟测试：模拟 today 页“输入→添加→勾选完成”，验证事件委托与状态闭环。
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.join(__dirname, '..', '..', 'frontend');
const dom = new JSDOM(fs.readFileSync(path.join(FRONTEND, 'index.html'), 'utf8'), { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.location = dom.window.location;
const store = {};
global.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
global.fetch = async () => { throw new Error('offline-test'); }; // 离线，走本地缓存
if (!global.structuredClone) global.structuredClone = (o) => JSON.parse(JSON.stringify(o));

const p = (rel) => pathToFileURL(path.join(FRONTEND, 'js', rel)).href;
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

let fail = 0;
const assert = (cond, msg) => { if (!cond) { fail++; console.log('FAIL', msg); } else console.log('OK  ', msg); };

const mod = await import(p('pages/today.js'));
const page = mod.default({});
const root = document.createElement('div');
document.body.appendChild(root);
page.mount(root);

const before = page.data.tasks.length;

// 1) 输入任务名
const input = root.querySelector('[data-focus-key="add-title"]');
input.value = '测试任务A';
input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
assert(page.data.form.title === '测试任务A', '输入框 -> form.title 同步');

// 2) 点击“添加”
const addBtn = [...root.querySelectorAll('[data-tap="addTask"]')].pop();
click(addBtn);
assert(page.data.tasks.length === before + 1, `添加任务 (${before} -> ${page.data.tasks.length})`);
assert(root.innerHTML.includes('测试任务A'), '新任务渲染到 DOM');

// 3) 勾选第一个任务完成
const firstCheck = root.querySelector('.task-check[data-tap="toggleDone"]');
const idToToggle = firstCheck.getAttribute('data-id');
click(firstCheck);
const toggled = page.data.tasks.find((t) => t.id === idToToggle);
assert(toggled && toggled.isDone, '勾选 -> 任务状态 done');
assert(page.data.totalPoints >= 10, `完成后积分增加 (=${page.data.totalPoints})`);

// 4) 切换排序按钮
const sortBtn = root.querySelector('[data-tap="changeSortBy"]');
click(sortBtn);
assert(page.data.sortBy === 'subject', '排序切换 default -> subject');

// 5) 持久化进了 localStorage 缓存
assert(localStorage.getItem('parent-learning-web-state') != null, '状态已写入本地缓存');

console.log(fail === 0 ? '\n✅ 交互闭环全部通过' : `\n❌ ${fail} 项失败`);
process.exit(fail === 0 ? 0 : 1);
