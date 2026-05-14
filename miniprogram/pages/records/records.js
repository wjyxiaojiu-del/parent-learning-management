const { createBasePage } = require('../../utils/base-page');
const { getTotalLearningPoints, getLatestHealthRecord } = require('../../utils/data');

Page(createBasePage({
  data: {
    totalPoints: 0,
    workoutCount: 0,
    rewardCount: 0,
    courseCount: 0,
    latestHealth: null,
    recentActivities: [],
  },

  onRefresh(state) {
    const workouts = state.workouts || [];
    const rewards = state.rewardItems || [];
    const courses = state.recurringCourses || [];
    const latestHealth = getLatestHealthRecord(state);

    const activities = workouts.slice(-3).map((w) => ({
      id: w.id,
      icon: '🏃',
      text: `${w.type} ${w.duration}分钟`,
      time: w.date,
    }));

    return {
      totalPoints: getTotalLearningPoints(state),
      workoutCount: workouts.length,
      rewardCount: rewards.length,
      courseCount: courses.length,
      latestHealth,
      recentActivities: activities.reverse(),
    };
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
}));
