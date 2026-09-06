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
    trends: {
      height: 0,
      weight: 0,
      heightText: '',
      weightText: '',
    },
    chartData: {
      heights: [],
      weights: [],
      dates: [],
    },
  },

  onRefresh(state) {
    const latest = getLatestHealthRecord(state);
    const records = getRecentHealthRecords(state, 20);

    // 计算趋势
    let trends = { height: 0, weight: 0, heightText: '', weightText: '' };
    if (records.length >= 2) {
      const prev = records[1];
      const curr = records[0];
      const heightDiff = curr.heightCm - prev.heightCm;
      const weightDiff = curr.weightKg - prev.weightKg;

      trends = {
        height: heightDiff,
        weight: weightDiff,
        heightText: heightDiff > 0 ? `+${heightDiff}cm` : heightDiff < 0 ? `${heightDiff}cm` : '持平',
        weightText: weightDiff > 0 ? `+${weightDiff}kg` : weightDiff < 0 ? `${weightDiff}kg` : '持平',
      };
    }

    // 准备图表数据
    const chartRecords = records.slice(0, 10).reverse();
    const chartData = {
      heights: chartRecords.map(r => r.heightCm),
      weights: chartRecords.map(r => r.weightKg),
      dates: chartRecords.map(r => r.date.slice(5)), // 只显示月-日
    };

    return { latest, records, trends, chartData };
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

    const height = Number(this.data.form.heightCm);
    const weight = Number(this.data.form.weightKg);

    if (height < 50 || height > 250) {
      wx.showToast({ title: '身高范围 50-250cm', icon: 'none' });
      return;
    }
    if (weight < 10 || weight > 150) {
      wx.showToast({ title: '体重范围 10-150kg', icon: 'none' });
      return;
    }

    const record = {
      id: uuid('health'),
      date: getTodayKey(),
      heightCm: height,
      weightKg: weight,
    };
    const state = updateStateList(this.data._state, 'healthRecords', record);
    this.setData({ form: { heightCm: '', weightKg: '' } });
    this._saveAndRefresh(state, '已记录');
    this._vibrate('light');
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
