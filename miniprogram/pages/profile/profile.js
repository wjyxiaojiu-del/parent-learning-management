const { createBasePage } = require('../../utils/base-page');
const {
  getTotalLearningPoints,
  getTaskSummary,
  getTasksForDate,
  getLatestHealthRecord,
} = require('../../utils/data');
const { getTodayKey, addDays } = require('../../utils/date');

Page(createBasePage({
  data: {
    totalPoints: 0,
    childName: '',
    age: 0,
    stats: {
      totalTasks: 0,
      completedTasks: 0,
      totalWorkouts: 0,
      totalReviews: 0,
    },
    achievements: [],
    latestHealth: null,
    weekProgress: 0,
  },

  onRefresh(state) {
    const settings = state.settings || {};
    const totalPoints = getTotalLearningPoints(state);

    // 统计数据
    const allTasks = state.tasks || [];
    const allWorkouts = state.workouts || [];
    const allReviews = state.reviews || [];

    const stats = {
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.status === 'done').length,
      totalWorkouts: allWorkouts.length,
      totalReviews: allReviews.length,
    };

    // 成就系统
    const achievements = this._calculateAchievements(stats, totalPoints, allWorkouts, allReviews);

    // 最新健康数据
    const latestHealth = getLatestHealthRecord(state);

    // 本周进度
    const weekProgress = this._calculateWeekProgress(state);

    return {
      totalPoints,
      childName: settings.childName || '小宇',
      age: settings.age || 12,
      stats,
      achievements,
      latestHealth,
      weekProgress,
    };
  },

  _calculateAchievements(stats, totalPoints, workouts, reviews) {
    const achievements = [];

    // 任务成就
    if (stats.completedTasks >= 10) {
      achievements.push({ icon: '📚', title: '学习达人', desc: '完成10个任务', unlocked: true });
    } else if (stats.completedTasks >= 5) {
      achievements.push({ icon: '📖', title: '学习新手', desc: '完成5个任务', unlocked: true });
    } else {
      achievements.push({ icon: '📖', title: '学习新手', desc: '完成5个任务', unlocked: false, progress: stats.completedTasks, target: 5 });
    }

    // 积分成就
    if (totalPoints >= 100) {
      achievements.push({ icon: '🌟', title: '积分大师', desc: '累计100积分', unlocked: true });
    } else if (totalPoints >= 50) {
      achievements.push({ icon: '⭐', title: '积分能手', desc: '累计50积分', unlocked: true });
    } else {
      achievements.push({ icon: '⭐', title: '积分能手', desc: '累计50积分', unlocked: false, progress: totalPoints, target: 50 });
    }

    // 运动成就
    if (workouts.length >= 10) {
      achievements.push({ icon: '🏃', title: '运动健将', desc: '运动10次', unlocked: true });
    } else if (workouts.length >= 3) {
      achievements.push({ icon: '💪', title: '运动达人', desc: '运动3次', unlocked: true });
    } else {
      achievements.push({ icon: '💪', title: '运动达人', desc: '运动3次', unlocked: false, progress: workouts.length, target: 3 });
    }

    // 复盘成就
    if (reviews.length >= 7) {
      achievements.push({ icon: '📝', title: '复盘专家', desc: '坚持7天复盘', unlocked: true });
    } else if (reviews.length >= 3) {
      achievements.push({ icon: '✏️', title: '复盘新手', desc: '坚持3天复盘', unlocked: true });
    } else {
      achievements.push({ icon: '✏️', title: '复盘新手', desc: '坚持3天复盘', unlocked: false, progress: reviews.length, target: 3 });
    }

    return achievements;
  },

  _calculateWeekProgress(state) {
    const today = new Date();
    const todayKey = getTodayKey(today);
    const weekAgo = addDays(todayKey, -7);

    const weekTasks = (state.tasks || []).filter(t => t.date >= weekAgo && t.date <= todayKey);
    if (weekTasks.length === 0) return 0;

    const completed = weekTasks.filter(t => t.status === 'done').length;
    return Math.round((completed / weekTasks.length) * 100);
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  goWorkout() {
    wx.navigateTo({ url: '/pages/workout/workout' });
  },

  goHealthGrowth() {
    wx.navigateTo({ url: '/pages/health-growth/health-growth' });
  },

  goRewardExchange() {
    wx.navigateTo({ url: '/pages/reward-exchange/reward-exchange' });
  },

  exportData() {
    wx.showModal({
      title: '导出数据',
      content: '数据已复制到剪贴板',
      showCancel: false,
    });
  },
}));
