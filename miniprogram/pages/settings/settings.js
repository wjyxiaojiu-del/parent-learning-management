const { createBasePage } = require('../../utils/base-page');
const { createDefaultState } = require('../../utils/defaultData');

Page(createBasePage({
  data: {
    childName: '',
    age: 12,
    subjects: [],
    newSubject: '',
  },

  onRefresh(state) {
    const settings = state.settings || {};
    return {
      childName: settings.childName || '小宇',
      age: settings.age || 12,
      subjects: settings.subjects || [],
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
}));
