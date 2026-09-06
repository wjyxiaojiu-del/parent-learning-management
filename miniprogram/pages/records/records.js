const { createBasePage } = require('../../utils/base-page');
const { getTotalLearningPoints, getLatestHealthRecord, getCompletionRate, getTasksForDate } = require('../../utils/data');
const { getTodayKey, getDayName } = require('../../utils/date');

Page(createBasePage({
  data: {
    totalPoints: 0,
    workoutCount: 0,
    rewardCount: 0,
    courseCount: 0,
    latestHealth: null,
    recentActivities: [],
    weeklyStats: {
      taskCompletion: 0,
      workoutDays: 0,
      totalStudyMinutes: 0,
    },
    streakDays: 0,
  },

  onRefresh(state) {
    const workouts = state.workouts || [];
    const rewards = state.rewardItems || [];
    const courses = state.recurringCourses || [];
    const latestHealth = getLatestHealthRecord(state);

    // 获取最近活动
    const activities = [];

    // 最近运动
    workouts.slice(-3).forEach((w) => {
      activities.push({
        id: w.id,
        icon: '🏃',
        text: `${w.type} ${w.duration}分钟`,
        time: w.date,
        type: 'workout',
      });
    });

    // 最近复盘
    (state.reviews || []).slice(-3).forEach((r) => {
      activities.push({
        id: r.id,
        icon: '📝',
        text: `复盘：${r.completion === 'complete' ? '完成' : r.completion === 'partial' ? '部分完成' : '未完成'}`,
        time: r.date,
        type: 'review',
      });
    });

    // 最近兑换
    (state.pointLedger || []).filter(e => e.points < 0).slice(-3).forEach((e) => {
      activities.push({
        id: e.id,
        icon: '🎁',
        text: `兑换：${e.reason}`,
        time: e.date,
        type: 'redeem',
      });
    });

    // 按时间排序
    activities.sort((a, b) => b.time.localeCompare(a.time));

    // 计算本周统计
    const today = new Date();
    const weekStats = this._calculateWeeklyStats(state, today);

    // 计算连续打卡天数
    const streakDays = this._calculateStreak(state);

    return {
      totalPoints: getTotalLearningPoints(state),
      workoutCount: workouts.length,
      rewardCount: rewards.length,
      courseCount: courses.length,
      latestHealth,
      recentActivities: activities.slice(0, 8),
      weeklyStats: weekStats,
      streakDays,
    };
  },

  _calculateWeeklyStats(state, today) {
    const tasks = state.tasks || [];
    const workouts = state.workouts || [];

    // 获取本周日期范围
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1);

    let completedTasks = 0;
    let totalTasks = 0;
    let workoutDays = new Set();
    let totalStudyMinutes = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateKey = getTodayKey(date);

      const dayTasks = getTasksForDate(state, dateKey);
      totalTasks += dayTasks.length;
      completedTasks += dayTasks.filter(t => t.status === 'done').length;

      const dayWorkouts = workouts.filter(w => w.date === dateKey);
      if (dayWorkouts.length > 0) {
        workoutDays.add(dateKey);
        dayWorkouts.forEach(w => totalStudyMinutes += w.duration || 0);
      }
    }

    return {
      taskCompletion: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      workoutDays: workoutDays.size,
      totalStudyMinutes,
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

  goWorkout() {
    wx.navigateTo({ url: '/pages/workout/workout' });
  },

  goHealthGrowth() {
    wx.navigateTo({ url: '/pages/health-growth/health-growth' });
  },

  goRewardExchange() {
    wx.navigateTo({ url: '/pages/reward-exchange/reward-exchange' });
  },

  goCourseManage() {
    wx.navigateTo({ url: '/pages/course-manage/course-manage' });
  },

  goReviewDetail() {
    wx.navigateTo({ url: '/pages/review-detail/review-detail' });
  },
}));
