const { createBasePage } = require('../../utils/base-page');
const { getTodayKey } = require('../../utils/date');
const {
  uuid,
  updateStateList,
  deleteFromStateList,
  completionLabels,
  learningStateLabels,
} = require('../../utils/data');

const completionOptions = [
  { value: 'complete', label: '完成' },
  { value: 'partial', label: '部分完成' },
  { value: 'incomplete', label: '未完成' },
];
const learningStateOptions = [
  { value: 'excellent', label: '积极' },
  { value: 'good', label: '正常' },
  { value: 'average', label: '一般' },
  { value: 'poor', label: '不在状态' },
];

Page(createBasePage({
  data: {
    completionRange: completionOptions.map((i) => i.label),
    learningStateRange: learningStateOptions.map((i) => i.label),
    completionText: completionLabels.partial,
    learningStateText: learningStateLabels.good,
    reviews: [],
    form: {
      date: '',
      completion: 'partial',
      learningState: 'good',
      problems: '',
      tomorrowPlan: '',
    },
    problemPresets: [
      '审题太快，漏条件',
      '注意力不集中',
      '粗心，订正不彻底',
      '拖延，需要陪',
    ],
    tomorrowPresets: [
      '先做最难的',
      '减少刷题，增加讲解',
      '任务减半，保证睡眠',
      '休息好再继续',
    ],
  },

  onRefresh(state) {
    if (!this.data.form.date) {
      this.setData({ 'form.date': getTodayKey() });
    }
    const reviews = [...(state.reviews || [])]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((r) => ({
        ...r,
        completionText: completionLabels[r.completion] || '',
        learningStateText: learningStateLabels[r.learningState] || '',
      }));
    return { reviews };
  },

  onCompletionChange(event) {
    const opt = completionOptions[event.detail.value];
    this.setData({ 'form.completion': opt.value, completionText: opt.label });
  },

  onLearningStateChange(event) {
    const opt = learningStateOptions[event.detail.value];
    this.setData({ 'form.learningState': opt.value, learningStateText: opt.label });
  },

  useProblemPreset(e) {
    this.setData({ 'form.problems': e.currentTarget.dataset.text });
  },

  useTomorrowPreset(e) {
    this.setData({ 'form.tomorrowPlan': e.currentTarget.dataset.text });
  },

  saveReview() {
    if (!this.data.form.date) {
      wx.showToast({ title: '选个日期', icon: 'none' });
      return;
    }
    const review = { ...this.data.form, id: uuid('review') };
    const state = updateStateList(this.data._state, 'reviews', review);
    this.setData({
      form: { date: getTodayKey(), completion: 'partial', learningState: 'good', problems: '', tomorrowPlan: '' },
      completionText: completionLabels.partial,
      learningStateText: learningStateLabels.good,
    });
    this._saveAndRefresh(state, '已保存');
  },

  deleteReview(event) {
    const id = event.currentTarget.dataset.id;
    this._confirm('删除', '删除这条复盘？').then((confirmed) => {
      if (!confirmed) return;
      const state = deleteFromStateList(this.data._state, 'reviews', id);
      this._saveAndRefresh(state, '已删除');
    });
  },
}));
