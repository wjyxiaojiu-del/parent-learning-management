const { getReadyState, saveState } = require('./store');

function createBasePage(options) {
  const pageConfig = {
    data: {
      _state: null,
      _loading: true,
      _refreshing: false,
      ...(options.data || {}),
    },

    onShow() {
      this.initPage();
    },

    // 下拉刷新支持
    onPullDownRefresh() {
      this.initPage();
      wx.stopPullDownRefresh();
    },

    initPage() {
      const state = getReadyState();
      this.setData({ _state: state, _loading: false });
      if (options.onRefresh) {
        const patch = options.onRefresh.call(this, state);
        if (patch) this.setData(patch);
      }
    },

    _saveAndRefresh(state, msg) {
      saveState(state);
      if (msg) wx.showToast({ title: msg, icon: 'success' });
      this.initPage();
    },

    _confirm(title, content) {
      return new Promise((resolve) => {
        wx.showModal({
          title,
          content,
          confirmText: '确定',
          cancelText: '取消',
          success: (res) => resolve(res.confirm),
        });
      });
    },

    // 通用输入处理 - 支持 data-form 和 data-key 属性
    onInput(event) {
      const { form, key } = event.currentTarget.dataset;
      if (form && key) {
        this.setData({ [`${form}.${key}`]: event.detail.value });
      }
    },

    // 通用文本输入
    onTextInput(event) {
      const key = event.currentTarget.dataset.key;
      if (key) {
        this.setData({ [key]: event.detail.value });
      }
    },

    // 震动反馈
    _vibrate(type = 'light') {
      if (wx.vibrateShort) {
        wx.vibrateShort({ type });
      }
    },

    // 分享功能
    onShareAppMessage() {
      return {
        title: '家长学习管理台',
        path: '/pages/today/today',
      };
    },
  };

  // 合并用户定义的方法
  Object.keys(options).forEach((key) => {
    if (key !== 'data' && key !== 'onRefresh') {
      pageConfig[key] = options[key];
    }
  });

  return pageConfig;
}

module.exports = { createBasePage };
