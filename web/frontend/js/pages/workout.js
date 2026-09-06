// 运动打卡页 —— 移植自小程序 pages/workout
import { definePage } from '../core/page.js';
import { escapeHtml as h, toast } from '../core/ui.js';
import { getTodayKey } from '../lib/date.js';
import { uuid, updateStateList, deleteFromStateList, calculateWorkoutPoints } from '../lib/data.js';

const presets = ['跳绳', '跑步', '游泳', '篮球', '羽毛球', '骑车', '散步'];
const icons = ['🤸', '🏃', '🏊', '🏀', '🏸', '🚴', '🚶'];

export default definePage({
  data: {
    presets,
    workouts: [],
    form: { type: '', duration: 20, points: 20 },
  },

  onRefresh(state) {
    const workouts = [...(state.workouts || [])].sort((a, b) => b.date.localeCompare(a.date));
    return { workouts };
  },

  template(d) {
    const sportsHtml = d.presets.map((item, index) => `
      <div class="sport-item ${d.form.type === item ? 'active' : ''}" data-tap="selectSport" data-sport="${h(item)}">
        <span class="sport-icon">${icons[index] || '🏃'}</span>
        <span class="sport-name">${h(item)}</span>
      </div>`).join('');

    const historyHtml = d.workouts.length
      ? `<div class="card">
          <span class="card-title">打卡记录</span>
          ${d.workouts.map((item) => `
            <div class="row">
              <div class="row-main">
                <span class="row-title">${h(item.type)}</span>
                <span class="row-sub">${item.date} · ${item.duration}分钟 · +${item.points}分</span>
              </div>
              <span class="del-btn" data-tap="deleteWorkout" data-id="${item.id}">×</span>
            </div>`).join('')}
        </div>`
      : `<div class="empty"><span class="empty-icon">🏃</span><span>还没有运动记录</span></div>`;

    return `
    <div class="page page-workout">
      <div class="hero"><span class="eyebrow">WORKOUT</span><span class="title">运动打卡</span></div>

      <div class="card">
        <span class="card-title">选择运动</span>
        <div class="sport-grid">${sportsHtml}</div>

        <span class="card-title">时长</span>
        <div class="duration-picker">
          <div class="duration-btn" data-tap="decreaseDuration">-</div>
          <div class="duration-value">${d.form.duration}<span class="duration-unit"> 分钟</span></div>
          <div class="duration-btn" data-tap="increaseDuration">+</div>
        </div>

        <div class="points-preview">预计获得 +${d.form.points} 积分</div>
        <button class="button" data-tap="saveWorkout">打卡</button>
      </div>

      ${historyHtml}
    </div>`;
  },

  selectSport(event) {
    this.setData({ 'form.type': event.currentTarget.dataset.sport });
  },

  decreaseDuration() {
    const duration = Math.max(5, this.data.form.duration - 5);
    this.setData({ 'form.duration': duration, 'form.points': Math.max(1, Math.round(duration)) });
  },

  increaseDuration() {
    const duration = Math.min(180, this.data.form.duration + 5);
    this.setData({ 'form.duration': duration, 'form.points': Math.max(1, Math.round(duration)) });
  },

  saveWorkout() {
    if (!this.data.form.type.trim()) {
      toast('选个运动项目');
      return;
    }
    const workout = {
      id: uuid('workout'),
      date: getTodayKey(),
      type: this.data.form.type,
      duration: Number(this.data.form.duration) || 0,
      points: calculateWorkoutPoints(this.data.form),
    };
    const state = updateStateList(this.data._state, 'workouts', workout);
    this.setData({ form: { type: '', duration: 20, points: 20 } }, false);
    this._saveAndRefresh(state, `+${workout.points} 积分`);
  },

  deleteWorkout(event) {
    const id = event.currentTarget.dataset.id;
    this._confirm('删除', '删除这条运动记录？').then((confirmed) => {
      if (!confirmed) return;
      const state = deleteFromStateList(this.data._state, 'workouts', id);
      this._saveAndRefresh(state, '已删除');
    });
  },
});
