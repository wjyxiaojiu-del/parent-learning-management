const { createBasePage } = require('../../utils/base-page');
const { getTodayKey } = require('../../utils/date');
const {
  uuid,
  updateStateList,
  deleteFromStateList,
  calculateWorkoutPoints,
} = require('../../utils/data');

const presets = ['跳绳', '跑步', '游泳', '篮球', '羽毛球', '骑车', '散步'];

Page(createBasePage({
  data: {
    presets,
    workouts: [],
    form: { type: '', duration: 20, points: 20 },
  },

  onRefresh(state) {
    const workouts = [...(state.workouts || [])].sort((a, b) => b.date.localeCompare(a.date));
    return { workouts };
  },

  selectSport(event) {
    const sport = event.currentTarget.dataset.sport;
    this.setData({ 'form.type': sport });
  },

  decreaseDuration() {
    const duration = Math.max(5, this.data.form.duration - 5);
    const points = Math.max(1, Math.round(duration));
    this.setData({ 'form.duration': duration, 'form.points': points });
  },

  increaseDuration() {
    const duration = Math.min(180, this.data.form.duration + 5);
    const points = Math.max(1, Math.round(duration));
    this.setData({ 'form.duration': duration, 'form.points': points });
  },

  saveWorkout() {
    if (!this.data.form.type.trim()) {
      wx.showToast({ title: '选个运动项目', icon: 'none' });
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
    this.setData({ form: { type: '', duration: 20, points: 20 } });
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
}));
