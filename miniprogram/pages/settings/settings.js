const { createBasePage } = require('../../utils/base-page');
const { createDefaultState } = require('../../utils/defaultData');
const { exportData, importData, clearAllData, manualSync, getSyncStatus } = require('../../utils/store');

Page(createBasePage({
  data: {
    childName: '',
    age: 12,
    subjects: [],
    newSubject: '',
    syncStatus: 'idle',
    syncStatusText: '未同步',
    showDataPanel: false,
  },

  onRefresh(state) {
    const settings = state.settings || {};
    const syncStatus = getSyncStatus();
    const statusMap = {
      idle: '未同步',
      syncing: '同步中...',
      success: '已同步',
      error: '同步失败',
    };

    return {
      childName: settings.childName || '小宇',
      age: settings.age || 12,
      subjects: settings.subjects || [],
      syncStatus,
      syncStatusText: statusMap[syncStatus] || '未知',
    };
  },

  onNewSubjectInput(e) {
    this.setData({ newSubject: e.detail.value });
  },

  addSubject() {
    const name = this.data.newSubject.trim();
    if (!name) return;
    if (this.data.subjects.includes(name)) {
      wx.showToast({ title: '已存在', icon: 'none' });
      return;
    }
    const subjects = [...this.data.subjects, name];
    const state = { ...this.data._state, settings: { ...this.data._state.settings, subjects } };
    this.setData({ newSubject: '' });
    this._saveAndRefresh(state, '已添加');
  },

  removeSubject(e) {
    const name = e.currentTarget.dataset.name;
    const subjects = this.data.subjects.filter((s) => s !== name);
    const state = { ...this.data._state, settings: { ...this.data._state.settings, subjects } };
    this._saveAndRefresh(state, '已删除');
  },

  saveSettings() {
    const state = {
      ...this.data._state,
      settings: {
        ...this.data._state.settings,
        childName: this.data.childName || '小宇',
        age: Number(this.data.age) || 12,
      },
    };
    this._saveAndRefresh(state, '已保存');
  },

  resetData() {
    this._confirm('重置', '所有数据恢复默认，确定？').then((confirmed) => {
      if (!confirmed) return;
      const state = createDefaultState();
      this._saveAndRefresh(state, '已重置');
    });
  },

  toggleDataPanel() {
    this.setData({ showDataPanel: !this.data.showDataPanel });
  },

  async syncToCloud() {
    wx.showLoading({ title: '同步中...' });
    const success = await manualSync();
    wx.hideLoading();

    if (success) {
      this.setData({
        syncStatus: 'success',
        syncStatusText: '已同步',
      });
    } else {
      this.setData({
        syncStatus: 'error',
        syncStatusText: '同步失败',
      });
    }
  },

  exportToClipboard() {
    const data = exportData();
    wx.setClipboardData({
      data,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      },
    });
  },

  importFromClipboard() {
    this._confirm('导入数据', '将从剪贴板导入数据，当前数据会被覆盖，确定？').then((confirmed) => {
      if (!confirmed) return;

      wx.getClipboardData({
        success: (res) => {
          if (res.data) {
            const success = importData(res.data);
            if (success) {
              wx.showToast({ title: '导入成功', icon: 'success' });
              this.initPage();
            } else {
              wx.showToast({ title: '数据格式错误', icon: 'none' });
            }
          }
        },
      });
    });
  },

  clearData() {
    this._confirm('清除数据', '确定清除所有数据？此操作不可恢复！').then((confirmed) => {
      if (!confirmed) return;

      this._confirm('再次确认', '真的要删除所有数据吗？').then((confirmed2) => {
        if (!confirmed2) return;

        clearAllData();
        wx.showToast({ title: '已清除', icon: 'success' });
        this.initPage();
      });
    });
  },
}));
