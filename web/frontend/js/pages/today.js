// 今日页 —— 移植自小程序 pages/today
import { definePage } from '../core/page.js';
import { toast } from '../core/ui.js';
import { getTodayKey, getDayName, getNextDateKey } from '../lib/date.js';
import {
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
} from '../lib/data.js';
import { escapeHtml as h } from '../core/ui.js';

const taskPresets = [
  { title: '数学口算 30 题', subject: '数学' },
  { title: '英语阅读 2 篇', subject: '英语' },
  { title: '语文生字抄写', subject: '语文' },
  { title: '背诵课文', subject: '语文' },
  { title: '完成作业', subject: '数学' },
];

export default definePage({
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
    sortBy: 'default',
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

    if (this.data.sortBy === 'subject') {
      tasks.sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));
    } else if (this.data.sortBy === 'status') {
      tasks.sort((a, b) => (a.isDone ? 1 : 0) - (b.isDone ? 1 : 0));
    }

    const courses = getCoursesForDate(state, today);
    const summary = getTaskSummary(tasks);

    const hour = today.getHours();
    let greeting = '早上好';
    if (hour >= 12 && hour < 18) greeting = '下午好';
    else if (hour >= 18) greeting = '晚上好';

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
      'form.subject': this.data.form.subject || subjects[0] || '数学',
      greeting,
      streakDays,
    };
  },

  template(d) {
    const tasksHtml = d.tasks.length
      ? `<div class="task-list">${d.tasks.map((item) => `
          <div class="task-item ${item.isDone ? 'done' : ''}">
            <div class="task-check" data-tap="toggleDone" data-id="${item.id}">
              <div class="check-circle ${item.isDone ? 'checked' : ''}">${item.isDone ? '<span class="check-icon">✓</span>' : ''}</div>
            </div>
            <div class="task-content">
              <span class="task-title ${item.isDone ? 'strike' : ''}">${h(item.title)}</span>
              <div class="task-meta-row">
                <span class="task-subject-tag">${h(item.subject)}</span>
                ${item.isDone ? `<span class="task-points">+${item.points}分</span>` : ''}
              </div>
            </div>
            <div class="task-btns">
              ${!item.isDone ? `<div class="task-btn defer" data-tap="deferTask" data-id="${item.id}"><span>明天</span></div>` : ''}
              <div class="task-btn delete" data-tap="deleteTask" data-id="${item.id}"><span>×</span></div>
            </div>
          </div>`).join('')}</div>`
      : `<div class="empty"><span class="empty-icon">📋</span><span>今天还没有任务</span><span style="display:block;margin-top:4px;font-size:11px;">添加一个开始吧</span></div>`;

    const coursesHtml = d.courses.length
      ? `<div class="card">
          <span class="card-title">今日课程</span>
          ${d.courses.map((item) => `
            <div class="row"><div class="row-main">
              <span class="row-title">${h(item.title)}</span>
              <span class="row-sub">${h(item.startTime)}-${h(item.endTime)} · ${h(item.subject)}</span>
            </div></div>`).join('')}
        </div>`
      : '';

    return `
    <div class="page page-today">
      ${d.showPointsAnim ? `<div class="points-anim"><span class="points-anim-text">+${d.animPoints}</span></div>` : ''}

      <div class="hero">
        <div class="hero-header">
          <div>
            <span class="eyebrow">TODAY</span>
            <span class="title">${d.greeting}，${h(d.childName)}</span>
            <span class="subtitle">${d.todayLabel} · ${d.todayKey}</span>
          </div>
          ${d.streakDays > 0 ? `<div class="streak-badge"><span class="streak-num">${d.streakDays}</span><span class="streak-label">天连续</span></div>` : ''}
        </div>
      </div>

      <div class="grid">
        <div class="metric"><span class="metric-label">任务</span><span class="metric-value">${d.summary.total}</span></div>
        <div class="metric"><span class="metric-label">完成</span><span class="metric-value">${d.summary.completed}</span></div>
        <div class="metric"><span class="metric-label">完成率</span><span class="metric-value">${d.completionRate}%</span></div>
        <div class="metric"><span class="metric-label">积分</span><span class="metric-value">${d.totalPoints}</span></div>
      </div>

      ${d.summary.total > 0 ? `
      <div class="progress-section">
        <div class="progress-bar"><div class="progress-fill" style="width: ${d.completionRate}%"></div></div>
        <span class="progress-text">${d.completionRate}%</span>
      </div>` : ''}

      <div class="card">
        <div class="card-header">
          <span class="card-title">添加任务</span>
          <div class="preset-toggle" data-tap="togglePresets"><span>${d.showPresets ? '收起' : '快捷'}</span></div>
        </div>
        ${d.showPresets ? `
        <div class="preset-section"><div class="preset-grid">
          ${d.taskPresets.map((item) => `
            <div class="preset-item" data-tap="quickAddPreset" data-title="${h(item.title)}" data-subject="${h(item.subject)}">
              <span class="preset-title">${h(item.title)}</span>
              <span class="preset-subject">${h(item.subject)}</span>
            </div>`).join('')}
        </div></div>` : ''}
        <div class="add-task-form">
          <input class="add-input" value="${h(d.form.title)}" placeholder="输入任务名称..." data-input="onFormInput" data-confirm="addTask" data-focus-key="add-title" />
          <div class="add-row">
            <select class="add-picker picker add-picker-wrap" data-change="onSubjectChange">
              ${d.subjects.map((s) => `<option value="${h(s)}" ${s === d.form.subject ? 'selected' : ''}>${h(s)}</option>`).join('')}
            </select>
            <button class="button add-btn" data-tap="addTask">添加</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">今日任务</span>
          <div class="task-actions">
            <div class="sort-btn" data-tap="changeSortBy"><span>${d.sortBy === 'default' ? '默认' : d.sortBy === 'subject' ? '科目' : '状态'}</span></div>
            ${d.summary.incomplete > 1 ? `<div class="batch-btn" data-tap="batchComplete"><span>全完成</span></div>` : ''}
          </div>
        </div>
        ${tasksHtml}
      </div>

      <div class="card">
        <span class="card-title">今日复盘</span>
        <div class="review-shortcuts">
          <button class="button review-btn" data-tap="quickReview">今天还行</button>
          <button class="button-light review-btn" data-tap="goDetailReview">详细复盘</button>
        </div>
      </div>

      ${coursesHtml}
      <div style="height: 20px;"></div>
    </div>`;
  },

  _calculateStreak(state) {
    const reviews = state.reviews || [];
    if (reviews.length === 0) return 0;
    const sortedDates = [...new Set(reviews.map((r) => r.date))].sort().reverse();
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
      id: uuid('task'), date: this.data.todayKey, title, subject,
      status: 'todo', priority: '中', startTime: '', duration: 30, completionLevel: 'standard', note: '',
    };
    const state = updateStateList(this.data._state, 'tasks', task);
    this._saveAndRefresh(state, '已添加');
  },

  changeSortBy() {
    const sortOptions = ['default', 'subject', 'status'];
    const currentIndex = sortOptions.indexOf(this.data.sortBy);
    this.data.sortBy = sortOptions[(currentIndex + 1) % sortOptions.length];
    this.initPage();
  },

  showPointsAnimation(points) {
    this.setData({ showPointsAnim: true, animPoints: points });
    setTimeout(() => this.setData({ showPointsAnim: false }), 1200);
    this._vibrate('medium');
  },

  onFormInput(event) {
    this.setData({ 'form.title': event.detail.value }, false);
  },

  onSubjectChange(event) {
    this.setData({ 'form.subject': event.detail.value }, false);
  },

  addTask() {
    if (!this.data.form.title.trim()) {
      toast('先写任务名称');
      return;
    }
    const task = {
      id: uuid('task'), date: this.data.todayKey, title: this.data.form.title.trim(),
      subject: this.data.form.subject, status: 'todo', priority: '中',
      startTime: '', duration: 30, completionLevel: 'standard', note: '',
    };
    const state = updateStateList(this.data._state, 'tasks', task);
    this.data.form.title = '';
    this._saveAndRefresh(state, '已添加');
  },

  toggleDone(event) {
    const id = event.currentTarget.dataset.id;
    const task = this.data.tasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const updated = { ...task, status: newStatus };
    delete updated.statusText; delete updated.isDone; delete updated.points;
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
    delete updated.statusText; delete updated.isDone; delete updated.points;
    const state = updateStateList(this.data._state, 'tasks', updated);
    this._saveAndRefresh(state, '已移到明天');
  },

  batchComplete() {
    const todoTasks = this.data.tasks.filter((t) => !t.isDone);
    if (todoTasks.length === 0) {
      toast('没有待完成任务');
      return;
    }
    this._confirm('批量完成', `确定完成所有 ${todoTasks.length} 个任务？`).then((confirmed) => {
      if (!confirmed) return;
      let state = this.data._state;
      todoTasks.forEach((task) => {
        const updated = { ...task, status: 'done' };
        delete updated.statusText; delete updated.isDone; delete updated.points;
        state = updateStateList(state, 'tasks', updated);
      });
      this._saveAndRefresh(state, `完成 ${todoTasks.length} 个任务`);
    });
  },

  quickReview() {
    const review = {
      id: uuid('review'), date: this.data.todayKey, completion: 'complete',
      learningState: 'good', problems: '整体稳定。', tomorrowPlan: '保持节奏。',
    };
    const state = updateStateList(this.data._state, 'reviews', review);
    this._saveAndRefresh(state, '复盘已保存');
  },

  goDetailReview() {
    this.navigate('#/review-detail');
  },
});
