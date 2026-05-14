const { createBasePage } = require('../../utils/base-page');
const { getTodayKey } = require('../../utils/date');
const {
  uuid,
  updateStateList,
  deleteFromStateList,
  getLatestHealthRecord,
  getRecentHealthRecords,
} = require('../../utils/data');

Page(createBasePage({
  data: {
    latest: null,
    records: [],
    form: { heightCm: '', weightKg: '' },
  },

  onRefresh(state) {
    const latest = getLatestHealthRecord(state);
    const records = getRecentHealthRecords(state, 20);
    return { latest, records };
  },

  onHeightInput(event) {
    this.setData({ 'form.heightCm': event.detail.value });
  },

  onWeightInput(event) {
    this.setData({ 'form.weightKg': event.detail.value });
  },

  saveRecord() {
    if (!this.data.form.heightCm || !this.data.form.weightKg) {
      wx.showToast({ title: '填下身高体重', icon: 'none' });
      return;
    }
    const record = {
      id: uuid('health'),
      date: getTodayKey(),
      heightCm: Number(this.data.form.heightCm),
      weightKg: Number(this.data.form.weightKg),
    };
    const state = updateStateList(this.data._state, 'healthRecords', record);
    this.setData({ form: { heightCm: '', weightKg: '' } });
    this._saveAndRefresh(state, '已记录');
  },

  deleteRecord(event) {
    const id = event.currentTarget.dataset.id;
    this._confirm('删除', '删除这条记录？').then((confirmed) => {
      if (!confirmed) return;
      const state = deleteFromStateList(this.data._state, 'healthRecords', id);
      this._saveAndRefresh(state, '已删除');
    });
  },
}));
