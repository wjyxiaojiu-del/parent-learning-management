// 每日复盘页 —— 移植自小程序 pages/review-detail（picker 改原生 select，补日期选择）
import { definePage } from '../core/page.js';
import { escapeHtml as h, toast } from '../core/ui.js';
import { getTodayKey } from '../lib/date.js';
import { uuid, updateStateList, deleteFromStateList, completionLabels, learningStateLabels } from '../lib/data.js';

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

export default definePage({
  data: {
    completionOptions,
    learningStateOptions,
    reviews: [],
    form: { date: '', completion: 'partial', learningState: 'good', problems: '', tomorrowPlan: '' },
    problemPresets: ['审题太快，漏条件', '注意力不集中', '粗心，订正不彻底', '拖延，需要陪'],
    tomorrowPresets: ['先做最难的', '减少刷题，增加讲解', '任务减半，保证睡眠', '休息好再继续'],
  },

  onRefresh(state) {
    if (!this.data.form.date) {
      this.data.form.date = getTodayKey();
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

  template(d) {
    const reviewsHtml = d.reviews.length
      ? `<div class="card">
          <span class="card-title">历史复盘</span>
          ${d.reviews.map((item) => `
            <div class="review-row">
              <div class="review-main">
                <span class="review-date">${item.date}</span>
                <span class="review-info">${h(item.completionText)} · ${h(item.learningStateText)}</span>
                ${item.problems ? `<span class="review-detail">问题：${h(item.problems)}</span>` : ''}
                ${item.tomorrowPlan ? `<span class="review-detail">调整：${h(item.tomorrowPlan)}</span>` : ''}
              </div>
              <span class="review-del" data-tap="deleteReview" data-id="${item.id}">×</span>
            </div>`).join('')}
        </div>`
      : '';

    return `
    <div class="page page-review-detail">
      <div class="hero">
        <span class="eyebrow">REVIEW</span>
        <span class="title">每日复盘</span>
        <span class="subtitle">一分钟记录，不给自己加负担。</span>
      </div>

      <div class="card">
        <div class="form">
          <div class="field"><span class="label">日期</span>
            <input class="picker" type="date" data-change="onDateChange" value="${h(d.form.date)}" /></div>
          <div class="field"><span class="label">完成情况</span>
            <select class="picker" data-change="onCompletionChange">
              ${d.completionOptions.map((o) => `<option value="${o.value}" ${o.value === d.form.completion ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select></div>
          <div class="field"><span class="label">学习状态</span>
            <select class="picker" data-change="onLearningStateChange">
              ${d.learningStateOptions.map((o) => `<option value="${o.value}" ${o.value === d.form.learningState ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select></div>
          <div class="field"><span class="label">主要问题</span>
            <textarea class="textarea" data-input="onInput" data-form="form" data-key="problems" data-focus-key="rv-p" placeholder="有什么问题记一下">${h(d.form.problems)}</textarea></div>
          <div class="preset-row">
            ${d.problemPresets.map((item) => `<span class="preset-chip" data-tap="useProblemPreset" data-text="${h(item)}">${h(item)}</span>`).join('')}
          </div>
          <div class="field"><span class="label">明天调整</span>
            <textarea class="textarea" data-input="onInput" data-form="form" data-key="tomorrowPlan" data-focus-key="rv-t" placeholder="明天怎么调整">${h(d.form.tomorrowPlan)}</textarea></div>
          <div class="preset-row">
            ${d.tomorrowPresets.map((item) => `<span class="preset-chip" data-tap="useTomorrowPreset" data-text="${h(item)}">${h(item)}</span>`).join('')}
          </div>
          <button class="button" data-tap="saveReview">保存复盘</button>
        </div>
      </div>

      ${reviewsHtml}
    </div>`;
  },

  onDateChange(event) {
    this.setData({ 'form.date': event.detail.value }, false);
  },
  onCompletionChange(event) {
    this.setData({ 'form.completion': event.detail.value }, false);
  },
  onLearningStateChange(event) {
    this.setData({ 'form.learningState': event.detail.value }, false);
  },

  useProblemPreset(e) {
    this.setData({ 'form.problems': e.currentTarget.dataset.text });
  },
  useTomorrowPreset(e) {
    this.setData({ 'form.tomorrowPlan': e.currentTarget.dataset.text });
  },

  saveReview() {
    if (!this.data.form.date) {
      toast('选个日期');
      return;
    }
    const review = { ...this.data.form, id: uuid('review') };
    const state = updateStateList(this.data._state, 'reviews', review);
    this.setData({
      form: { date: getTodayKey(), completion: 'partial', learningState: 'good', problems: '', tomorrowPlan: '' },
    }, false);
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
});
