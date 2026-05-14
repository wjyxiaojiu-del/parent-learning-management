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
    wx.setStorageSync(STORAGE_KEY, state);
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
  return nextState;
}

module.exports = {
  loadLocalState,
  getReadyState,
  saveState,
};
