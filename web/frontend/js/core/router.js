// 哈希路由 + 底部 Tab 管理
import { isLoggedIn } from './api.js';

let routes = {};
let currentInstance = null;

// routes: { path: { factory, tab: bool, title: string } }
export function registerRoutes(map) {
  routes = map;
}

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, ''); // 去掉 #/ 前缀
  const [path, query] = raw.split('?');
  const params = {};
  if (query) {
    query.split('&').forEach((pair) => {
      const [k, v] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  }
  return { path: path || 'today', params };
}

function applyChrome(route, path) {
  const header = document.getElementById('app-header');
  const tabbar = document.getElementById('tab-bar');
  const isLogin = path === 'login';

  // 登录页：无头部、无 tab
  if (isLogin) {
    header.style.display = 'none';
    tabbar.style.display = 'none';
    return;
  }

  if (route.tab) {
    // Tab 页：显示标题（无返回），显示 tab 栏
    header.style.display = 'flex';
    header.querySelector('.app-back').style.visibility = 'hidden';
    tabbar.style.display = 'flex';
  } else {
    // 二级页：显示返回按钮，隐藏 tab 栏
    header.style.display = 'flex';
    header.querySelector('.app-back').style.visibility = 'visible';
    tabbar.style.display = 'none';
  }
  header.querySelector('.app-title').textContent = route.title || '家长学习管理台';

  // tab 高亮
  document.querySelectorAll('#tab-bar .tab-item').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('data-path') === path);
  });
}

function handleRoute() {
  const { path, params } = parseHash();

  // 登录守卫
  if (!isLoggedIn() && path !== 'login') {
    location.hash = '#/login';
    return;
  }
  if (isLoggedIn() && path === 'login') {
    location.hash = '#/today';
    return;
  }

  const route = routes[path] || routes['today'];
  applyChrome(route, path);

  const content = document.getElementById('app-content');
  content.scrollTop = 0;
  window.scrollTo(0, 0);

  currentInstance = route.factory(params);
  currentInstance.mount(content);
}

export function startRouter() {
  window.addEventListener('hashchange', handleRoute);
  // 头部返回按钮
  const back = document.querySelector('#app-header .app-back');
  if (back) back.addEventListener('click', () => history.back());

  if (!location.hash) location.hash = '#/today';
  else handleRoute();
}

export function reloadCurrent() {
  handleRoute();
}
