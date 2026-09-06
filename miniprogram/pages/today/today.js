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

// 预设任务模板
const taskPresets = [
  { title: '数学口算 30 题', subject: '数学' },
  { title: '英语阅读 2 篇', subject: '英语' },
  { title: '语文生字抄写', subject: '语文' },
  { title: '背诵课文', subject: '语文' },
  { title: '完成作业', subject: '数学' },
];

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
    taskPresets,
    showPresets: false,
    sortBy: 'default', // default, subject, status
    streakDays: 0,
    greeting: '',
  },

  onRefresh(state) {
    const today = new Date();
    const todayKey = getTodayKey(today);
    const subjects = state.settings.subjects || [];
    let tasks = getTasksForDate(state, todayKey).map((t) => ({
      ...t,
      points: getTaskEarnedPoints(t),
      statusText: statusLabels[t.status] || t.status,
      isDone: t.status === 'done',
    }));

    // 排序
    if (this.data.sortBy === 'subject') {
      tasks.sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));
    } else if (this.data.sortBy === 'status') {
      tasks.sort((a, b) => (a.isDone ? 1 : 0) - (b.isDone ? 1 : 0));
    }

    const courses = getCoursesForDate(state, today);
    const summary = getTaskSummary(tasks);

    // 计算问候语
    const hour = today.getHours();
    let greeting = '早上好';
    if (hour >= 12 && hour < 18) greeting = '下午好';
    else if (hour >= 18) greeting = '晚上好';

    // 计算连续打卡天数
    const streakDays = this._calculateStreak(state);

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
      greeting,
      streakDays,
    };
  },

  _calculateStreak(state) {
    const reviews = state.reviews || [];
    if (reviews.length === 0) return 0;

    const sortedDates = [...new Set(reviews.map(r => r.date))].sort().reverse();
    const today = getTodayKey();

    let streak = 0;
    let checkDate = today;

    for (const date of sortedDates) {
      if (date === checkDate) {
        streak++;
        checkDate = getNextDateKey(date);
      } else if (date < checkDate) {
        break;
      }
    }
    return streak;
  },

  togglePresets() {
    this.setData({ showPresets: !this.data.showPresets });
  },

  quickAddPreset(event) {
    const { title, subject } = event.currentTarget.dataset;
    const task = {
      id: uuid('task'),
      date: this.data.todayKey,
      title,
      subject,
      status: 'todo',
      priority: '中',
      startTime: '',
      duration: 30,
      completionLevel: 'standard',
      note: '',
    };
    const state = updateStateList(this.data._state, 'tasks', task);
    this._saveAndRefresh(state, '已添加');
  },

  changeSortBy() {
    const sortOptions = ['default', 'subject', 'status'];
    const currentIndex = sortOptions.indexOf(this.data.sortBy);
    const nextSort = sortOptions[(currentIndex + 1) % sortOptions.length];
    this.setData({ sortBy: nextSort });
    this.initPage();
  },

  showPointsAnimation(points) {
    this.setData({ showPointsAnim: true, animPoints: points });
    setTimeout(() => this.setData({ showPointsAnim: false }), 1500);
    this._vibrate('medium');
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

  batchComplete() {
    const todoTasks = this.data.tasks.filter(t => !t.isDone);
    if (todoTasks.length === 0) {
      wx.showToast({ title: '没有待完成任务', icon: 'none' });
      return;
    }
    this._confirm('批量完成', `确定完成所有 ${todoTasks.length} 个任务？`).then((confirmed) => {
      if (!confirmed) return;
      let state = this.data._state;
      todoTasks.forEach(task => {
        const updated = { ...task, status: 'done' };
        state = updateStateList(state, 'tasks', updated);
      });
      this._saveAndRefresh(state, `完成 ${todoTasks.length} 个任务`);
    });
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
