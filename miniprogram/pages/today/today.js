const { createBasePage } = require('../../utils/base-page');
const { getTodayKey, getDayName, getNextDateKey } = require('../../utils/date');
const {
  statusLabels,
  uuid,
  getTasksForDate,
  getCoursesForDate,
  getTaskSummary,
  getCompletionRate,
  getTaskEarnedPoints,
  getTotalLearningPoints,
  updateStateList,
  deleteFromStateList,
} = require('../../utils/data');

Page(createBasePage({
  data: {
    todayKey: '',
    todayLabel: '',
    childName: '',
    tasks: [],
    courses: [],
    summary: { total: 0, completed: 0, incomplete: 0 },
    completionRate: 0,
    totalPoints: 0,
    subjects: [],
    form: { title: '', subject: '数学' },
    showPointsAnim: false,
    animPoints: 0,
  },

  onRefresh(state) {
    const today = new Date();
    const todayKey = getTodayKey(today);
    const subjects = state.settings.subjects || [];
    const tasks = getTasksForDate(state, todayKey).map((t) => ({
      ...t,
      points: getTaskEarnedPoints(t),
      statusText: statusLabels[t.status] || t.status,
      isDone: t.status === 'done',
    }));
    const courses = getCoursesForDate(state, today);
    const summary = getTaskSummary(tasks);

    return {
      todayKey,
      todayLabel: getDayName(today),
      childName: state.settings.childName || '小宇',
      tasks,
      courses,
      summary,
      subjects,
      completionRate: getCompletionRate(tasks),
      totalPoints: getTotalLearningPoints(state),
      'form.subject': subjects[0] || '数学',
    };
  },

  showPointsAnimation(points) {
    this.setData({ showPointsAnim: true, animPoints: points });
    setTimeout(() => this.setData({ showPointsAnim: false }), 1500);
  },

  onFormInput(event) {
    this.setData({ 'form.title': event.detail.value });
  },

  onSubjectChange(event) {
    this.setData({ 'form.subject': this.data.subjects[event.detail.value] });
  },

  addTask() {
    if (!this.data.form.title.trim()) {
      wx.showToast({ title: '先写任务名称', icon: 'none' });
      return;
    }
    const task = {
      id: uuid('task'),
      date: this.data.todayKey,
      title: this.data.form.title.trim(),
      subject: this.data.form.subject,
      status: 'todo',
      priority: '中',
      startTime: '',
      duration: 30,
      completionLevel: 'standard',
      note: '',
    };
    const state = updateStateList(this.data._state, 'tasks', task);
    this.setData({ 'form.title': '' });
    this._saveAndRefresh(state, '已添加');
  },

  toggleDone(event) {
    const id = event.currentTarget.dataset.id;
    const task = this.data.tasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const updated = { ...task, status: newStatus };
    delete updated.statusText;
    delete updated.isDone;
    delete updated.points;
    const state = updateStateList(this.data._state, 'tasks', updated);
    const points = getTaskEarnedPoints(updated);
    if (newStatus === 'done') this.showPointsAnimation(points);
    this._saveAndRefresh(state, newStatus === 'done' ? `+${points} 积分` : '已恢复');
  },

  deleteTask(event) {
    const id = event.currentTarget.dataset.id;
    const task = this.data.tasks.find((t) => t.id === id);
    if (!task) return;
    this._confirm('删除', `删除「${task.title}」？`).then((confirmed) => {
      if (!confirmed) return;
      const state = deleteFromStateList(this.data._state, 'tasks', id);
      this._saveAndRefresh(state, '已删除');
    });
  },

  deferTask(event) {
    const id = event.currentTarget.dataset.id;
    const task = this.data.tasks.find((t) => t.id === id);
    if (!task) return;
    const updated = { ...task, date: getNextDateKey(this.data.todayKey), status: 'todo' };
    delete updated.statusText;
    delete updated.isDone;
    delete updated.points;
    const state = updateStateList(this.data._state, 'tasks', updated);
    this._saveAndRefresh(state, '已移到明天');
  },

  quickReview() {
    const review = {
      id: uuid('review'),
      date: this.data.todayKey,
      completion: 'complete',
      learningState: 'good',
      problems: '整体稳定。',
      tomorrowPlan: '保持节奏。',
    };
    const state = updateStateList(this.data._state, 'reviews', review);
    this._saveAndRefresh(state, '复盘已保存');
  },

  goDetailReview() {
    wx.navigateTo({ url: '/pages/review-detail/review-detail' });
  },
}));
