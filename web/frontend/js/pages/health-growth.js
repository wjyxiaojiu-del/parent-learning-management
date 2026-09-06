// 身高体重页 —— 移植自小程序 pages/health-growth（趋势图用 CSS 柱状还原）
import { definePage } from '../core/page.js';
import { escapeHtml as h, toast } from '../core/ui.js';
import { getTodayKey } from '../lib/date.js';
import { uuid, updateStateList, deleteFromStateList, getLatestHealthRecord, getRecentHealthRecords } from '../lib/data.js';

export default definePage({
  data: {
    latest: null,
    records: [],
    form: { heightCm: '', weightKg: '' },
    trends: { height: 0, weight: 0, heightText: '', weightText: '' },
    chartData: { heights: [], weights: [], dates: [] },
  },

  onRefresh(state) {
    const latest = getLatestHealthRecord(state);
    const records = getRecentHealthRecords(state, 20);

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

    const chartRecords = records.slice(0, 10).reverse();
    const chartData = {
      heights: chartRecords.map((r) => r.heightCm),
      weights: chartRecords.map((r) => r.weightKg),
      dates: chartRecords.map((r) => r.date.slice(5)),
    };

    return { latest, records, trends, chartData };
  },

  template(d) {
    const trendClass = (v) => (v > 0 ? 'trend-up' : v < 0 ? 'trend-down' : 'trend-same');

    const currentHtml = d.latest
      ? `<div class="growth-card">
          <div class="growth-item">
            <span class="growth-label">身高</span>
            <span class="growth-value">${d.latest.heightCm}<span class="growth-unit">cm</span></span>
            ${d.trends.heightText ? `<div class="trend-badge ${trendClass(d.trends.height)}"><span>${d.trends.heightText}</span></div>` : ''}
          </div>
          <div class="growth-item">
            <span class="growth-label">体重</span>
            <span class="growth-value">${d.latest.weightKg}<span class="growth-unit">kg</span></span>
            ${d.trends.weightText ? `<div class="trend-badge ${trendClass(d.trends.weight)}"><span>${d.trends.weightText}</span></div>` : ''}
          </div>
        </div>`
      : '';

    const chartHtml = d.chartData.dates.length > 1
      ? `<div class="card">
          <span class="card-title">变化趋势</span>
          <div class="chart-container">
            <div class="chart-legend">
              <div class="legend-item"><div class="legend-dot" style="background:#ff9f1c;"></div><span class="legend-text">身高 (cm)</span></div>
              <div class="legend-item"><div class="legend-dot" style="background:#4b95cc;"></div><span class="legend-text">体重 (kg)</span></div>
            </div>
            <div class="chart-bars">
              ${d.chartData.dates.map((date, index) => `
                <div class="chart-bar-group">
                  <div class="chart-bar-wrapper">
                    <div class="chart-bar height-bar" style="height:${d.chartData.heights[index] / 2}%;"></div>
                    <div class="chart-bar weight-bar" style="height:${d.chartData.weights[index] * 2}%;"></div>
                  </div>
                  <span class="chart-label">${h(date)}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>`
      : '';

    const historyHtml = d.records.length
      ? `<div class="card">
          <span class="card-title">历史记录 (${d.records.length})</span>
          ${d.records.map((item) => `
            <div class="row">
              <div class="row-main"><span class="row-title">${item.date}</span><span class="row-sub">${item.heightCm}cm · ${item.weightKg}kg</span></div>
              <span class="del-btn" data-tap="deleteRecord" data-id="${item.id}">×</span>
            </div>`).join('')}
        </div>`
      : `<div class="empty"><span class="empty-icon">📏</span><span>还没有记录</span></div>`;

    return `
    <div class="page page-health-growth">
      <div class="hero"><span class="eyebrow">GROWTH</span><span class="title">身高体重</span></div>
      ${currentHtml}
      ${chartHtml}
      <div class="card">
        <span class="card-title">记录数据</span>
        <div class="form">
          <div class="field"><span class="label">身高 cm</span>
            <input class="input" type="number" inputmode="decimal" data-input="onHeightInput" data-focus-key="hg-h" value="${h(d.form.heightCm)}" placeholder="例如 151" /></div>
          <div class="field"><span class="label">体重 kg</span>
            <input class="input" type="number" inputmode="decimal" data-input="onWeightInput" data-focus-key="hg-w" value="${h(d.form.weightKg)}" placeholder="例如 42" /></div>
          <button class="button" data-tap="saveRecord">记录</button>
        </div>
      </div>
      ${historyHtml}
    </div>`;
  },

  onHeightInput(event) {
    this.setData({ 'form.heightCm': event.detail.value }, false);
  },

  onWeightInput(event) {
    this.setData({ 'form.weightKg': event.detail.value }, false);
  },

  saveRecord() {
    if (!this.data.form.heightCm || !this.data.form.weightKg) {
      toast('填下身高体重');
      return;
    }
    const height = Number(this.data.form.heightCm);
    const weight = Number(this.data.form.weightKg);
    if (height < 50 || height > 250) {
      toast('身高范围 50-250cm');
      return;
    }
    if (weight < 10 || weight > 150) {
      toast('体重范围 10-150kg');
      return;
    }
    const record = { id: uuid('health'), date: getTodayKey(), heightCm: height, weightKg: weight };
    const state = updateStateList(this.data._state, 'healthRecords', record);
    this.setData({ form: { heightCm: '', weightKg: '' } }, false);
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
});
