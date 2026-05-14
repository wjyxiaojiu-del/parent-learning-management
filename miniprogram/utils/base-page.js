const { getReadyState, saveState } = require('./store');

function createBasePage(options) {
  const pageConfig = {
    data: {
      _state: null,
      _loading: true,
      ...(options.data || {}),
    },

    onShow() {
      this.initPage();
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
