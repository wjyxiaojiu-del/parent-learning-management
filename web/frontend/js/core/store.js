// 状态存取 —— 对应小程序 utils/store.js
// 数据源改为后端 API；localStorage 仅作离线缓存与即时渲染。
import { createDefaultState } from '../lib/defaultData.js';
import { apiFetch } from './api.js';

const CACHE_KEY = 'parent-learning-web-state';

let currentState = null;       // 内存中的当前 state（渲染用，同步读取）
let saveTimer = null;          // 防抖上传计时器

function mergeState(state) {
  const defaults = createDefaultState();
  return {
    ...defaults,
    ...(state || {}),
    settings: {
      ...defaults.settings,
      ...((state && state.settings) || {}),
    },
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeCache(state) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch (e) {
    /* 忽略 */
  }
}

// 应用启动时调用一次：从后端拉取，失败则用本地缓存兜底
export async function loadState() {
  try {
    const res = await apiFetch('/api/state');
    const merged = mergeState(res.state);
    currentState = merged;
    writeCache(merged);
    return merged;
  } catch (e) {
    // 网络/后端异常：退回本地缓存，保证可用
    const cached = readCache();
    currentState = mergeState(cached);
    if (!cached) throw e; // 既无网络又无缓存才抛出
    return currentState;
  }
}

// 同步读取当前 state（渲染时用，需先 loadState）
export function getReadyState() {
  if (!currentState) currentState = mergeState(readCache());
  return currentState;
}

// 保存：立即更新内存+缓存（乐观），防抖上传后端
export function saveState(state) {
  const next = mergeState(state);
  next.updatedAt = Date.now();
  currentState = next;
  writeCache(next);

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    apiFetch('/api/state', { method: 'PUT', body: { state: next } }).catch((err) => {
      console.warn('云端保存失败，已保留本地缓存:', err.message);
    });
  }, 400);

  return next;
}

// 立即把当前 state 同步到后端（设置页“同步到云端”用）
export async function syncNow() {
  clearTimeout(saveTimer);
  await apiFetch('/api/state', { method: 'PUT', body: { state: getReadyState() } });
  return true;
}

export function exportData() {
  return JSON.stringify(getReadyState(), null, 2);
}

export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    saveState(mergeState(data));
    return true;
  } catch (e) {
    console.error('importData failed', e);
    return false;
  }
}

export function clearAllData() {
  const fresh = createDefaultState();
  saveState(fresh);
  return true;
}
