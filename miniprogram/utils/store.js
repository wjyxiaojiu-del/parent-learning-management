const { createDefaultState } = require('./defaultData');

const STORAGE_KEY = 'parent-learning-mini-state';

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

function loadLocalState() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY);
    return mergeState(data || null);
  } catch (e) {
    console.warn('loadLocalState failed', e);
    return mergeState(null);
  }
}

function saveLocalState(state) {
  try {
    // 添加更新时间戳
    const stateWithTimestamp = {
      ...state,
      updatedAt: Date.now(),
    };
    wx.setStorageSync(STORAGE_KEY, stateWithTimestamp);
  } catch (e) {
    console.warn('saveLocalState failed', e);
  }
}

function getReadyState() {
  const app = getApp();
  if (app.globalData.state) return app.globalData.state;
  const local = loadLocalState();
  app.globalData.state = local;
  return local;
}

function saveState(state) {
  const nextState = mergeState(state);
  saveLocalState(nextState);
  const app = getApp();
  app.globalData.state = nextState;

  // 触发云端同步（异步，不阻塞）
  if (app.globalData.cloudReady && app.uploadToCloud) {
    app.uploadToCloud(nextState).catch(err => {
      console.warn('云端同步失败:', err);
    });
  }

  return nextState;
}

// 获取同步状态
function getSyncStatus() {
  const app = getApp();
  return app.globalData.syncStatus || 'idle';
}

// 手动同步
async function manualSync() {
  const app = getApp();
  if (app.manualSync) {
    return await app.manualSync();
  }
  return false;
}

// 导出数据
function exportData() {
  const state = getReadyState();
  return JSON.stringify(state, null, 2);
}

// 导入数据
function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    const merged = mergeState(data);
    saveState(merged);
    return true;
  } catch (e) {
    console.error('importData failed', e);
    return false;
  }
}

// 清除所有数据
function clearAllData() {
  try {
    wx.removeStorageSync(STORAGE_KEY);
    const app = getApp();
    app.globalData.state = createDefaultState();
    return true;
  } catch (e) {
    console.error('clearAllData failed', e);
    return false;
  }
}

module.exports = {
  loadLocalState,
  getReadyState,
  saveState,
  saveLocalState,
  getSyncStatus,
  manualSync,
  exportData,
  importData,
  clearAllData,
};
