// 后端 API 封装 + token 管理
const TOKEN_KEY = 'pl_token';
const USER_KEY = 'pl_username';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setAuth(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  if (username) localStorage.setItem(USER_KEY, username);
}

export function getUsername() {
  return localStorage.getItem(USER_KEY) || '';
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

// 统一请求；401 自动清登录态并跳登录页
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('网络连接失败，请检查后端是否启动');
  }

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (res.status === 401) {
    clearAuth();
    if (!location.hash.startsWith('#/login')) {
      location.hash = '#/login';
    }
    throw new Error((data && data.error) || '未登录');
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `请求失败 (${res.status})`);
  }

  return data;
}
