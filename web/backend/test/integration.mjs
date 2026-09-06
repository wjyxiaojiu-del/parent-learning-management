// 联调测试：用前端真实的 api.js / store.js 打真实后端，验证注册→保存→加载往返。
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.join(__dirname, '..', '..', 'frontend');
const p = (rel) => pathToFileURL(path.join(FRONTEND, 'js', rel)).href;

const BASE = 'http://localhost:3000';
const store = {};
global.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
global.location = { hash: '' };
// 把相对 /api 路径补成绝对地址，模拟浏览器同源行为
const realFetch = global.fetch;
global.fetch = (url, opts) => realFetch(url.startsWith('/') ? BASE + url : url, opts);
if (!global.structuredClone) global.structuredClone = (o) => JSON.parse(JSON.stringify(o));

const api = await import(p('core/api.js'));
const storeMod = await import(p('core/store.js'));
const { createDefaultState } = await import(p('lib/defaultData.js'));

let fail = 0;
const assert = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('OK  ', m); };

const uname = 'itest_' + Math.floor(Math.random() * 1e6);
const reg = await api.apiFetch('/api/auth/register', { method: 'POST', body: { username: uname, password: 'secret123' } });
api.setAuth(reg.token, reg.username);
assert(api.isLoggedIn(), '注册并写入 token');

// 首次加载（云端为空 -> 默认数据）
const s1 = await storeMod.loadState();
assert(s1.settings.childName === '小宇', '新账号加载默认 state');

// 改名并保存（saveState 防抖 400ms 上传）
const modified = { ...s1, settings: { ...s1.settings, childName: '联调宝宝' } };
storeMod.saveState(modified);
await new Promise((r) => setTimeout(r, 700));

// 清空本地缓存后重新加载，确认数据来自后端
delete store['parent-learning-web-state'];
const s2 = await storeMod.loadState();
assert(s2.settings.childName === '联调宝宝', '改名已落库并从后端取回');
assert(Array.isArray(s2.tasks) && s2.tasks.length === 3, 'state 完整性（tasks 往返一致）');

console.log(fail === 0 ? '\n✅ 前后端联调通过' : `\n❌ ${fail} 项失败`);
process.exit(fail === 0 ? 0 : 1);
