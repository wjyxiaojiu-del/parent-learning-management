// 记录页 —— 移植自小程序 pages/records
import { definePage } from '../core/page.js';
import { escapeHtml as h } from '../core/ui.js';
import { getTotalLearningPoints, getLatestHealthRecord, getTasksForDate } from '../lib/data.js';
import { getTodayKey, getNextDateKey } from '../lib/date.js';

export default definePage({
  data: {
    totalPoints: 0,
    workoutCount: 0,
    rewardCount: 0,
    courseCount: 0,
    latestHealth: null,
    recentActivities: [],
    weeklyStats: { taskCompletion: 0, workoutDays: 0, totalStudyMinutes: 0 },
    streakDays: 0,
  },

  onRefresh(state) {
    const workouts = state.workouts || [];
    const rewards = state.rewardItems || [];
    const courses = state.recurringCourses || [];
    const latestHealth = getLatestHealthRecord(state);

    const activities = [];
    workouts.slice(-3).forEach((w) => {
      activities.push({ id: w.id, icon: '🏃', text: `${w.type} ${w.duration}分钟`, time: w.date, type: 'workout' });
    });
    (state.reviews || []).slice(-3).forEach((r) => {
      activities.push({ id: r.id, icon: '📝', text: `复盘：${r.completion === 'complete' ? '完成' : r.completion === 'partial' ? '部分完成' : '未完成'}`, time: r.date, type: 'review' });
    });
    (state.pointLedger || []).filter((e) => e.points < 0).slice(-3).forEach((e) => {
      activities.push({ id: e.id, icon: '🎁', text: `兑换：${e.reason}`, time: e.date, type: 'redeem' });
    });
    activities.sort((a, b) => b.time.localeCompare(a.time));

    const weekStats = this._calculateWeeklyStats(state, new Date());
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

  template(d) {
    const entry = (action, icon, title, desc, count) => `
      <div class="entry-item" data-tap="${action}">
        <div class="entry-icon">${icon}</div>
        <div class="entry-content">
          <span class="entry-title">${title}</span>
          <span class="entry-desc">${desc}</span>
        </div>
        <div class="entry-right">
          ${count ? `<span class="entry-count">${count}</span>` : ''}
          <span class="entry-arrow">›</span>
        </div>
      </div>`;

    const activitiesHtml = d.recentActivities.length
      ? `<div class="card"><span class="card-title">最近动态</span>
          ${d.recentActivities.map((item) => `
            <div class="activity-item">
              <span class="activity-icon">${item.icon}</span>
              <div class="activity-content">
                <span class="activity-text">${h(item.text)}</span>
                <span class="activity-time">${item.time}</span>
              </div>
            </div>`).join('')}
        </div>`
      : `<div class="card"><div class="empty"><span class="empty-icon">📊</span><span>还没有记录，去打卡吧</span></div></div>`;

    return `
    <div class="page page-records">
      <div class="hero">
        <span class="eyebrow">RECORDS</span>
        <span class="title">学习记录</span>
      </div>

      <div class="points-card">
        <div class="points-main">
          <span class="points-num">${d.totalPoints}</span>
          <span class="points-label">可用积分</span>
        </div>
        ${d.streakDays > 0 ? `<div class="points-stats"><span class="streak-icon">🔥</span><span class="streak-text">连续 ${d.streakDays} 天</span></div>` : ''}
      </div>

      <div class="card">
        <span class="card-title">本周统计</span>
        <div class="stats-grid">
          <div class="stat-item"><span class="stat-value">${d.weeklyStats.taskCompletion}%</span><span class="stat-label">任务完成率</span></div>
          <div class="stat-item"><span class="stat-value">${d.weeklyStats.workoutDays}</span><span class="stat-label">运动天数</span></div>
          <div class="stat-item"><span class="stat-value">${d.weeklyStats.totalStudyMinutes}</span><span class="stat-label">运动分钟</span></div>
        </div>
      </div>

      <div class="card">
        ${entry('goWorkout', '🏃', '运动打卡', '记录运动时长，赚取积分', d.workoutCount > 0 ? `${d.workoutCount}次` : '')}
        ${entry('goHealthGrowth', '📏', '身高体重', '记录成长数据', d.latestHealth ? `${d.latestHealth.heightCm}cm` : '')}
        ${entry('goRewardExchange', '🎁', '奖励兑换', '用积分兑换奖励', d.rewardCount > 0 ? `${d.rewardCount}个` : '')}
        ${entry('goCourseManage', '📚', '固定课程', '管理每周课程安排', d.courseCount > 0 ? `${d.courseCount}节` : '')}
        ${entry('goReviewDetail', '📝', '每日复盘', '记录学习状态和问题', '')}
      </div>

      ${activitiesHtml}
    </div>`;
  },

  _calculateWeeklyStats(state, today) {
    const workouts = state.workouts || [];
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1);

    let completedTasks = 0;
    let totalTasks = 0;
    const workoutDays = new Set();
    let totalStudyMinutes = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateKey = getTodayKey(date);
      const dayTasks = getTasksForDate(state, dateKey);
      totalTasks += dayTasks.length;
      completedTasks += dayTasks.filter((t) => t.status === 'done').length;
      const dayWorkouts = workouts.filter((w) => w.date === dateKey);
      if (dayWorkouts.length > 0) {
        workoutDays.add(dateKey);
        dayWorkouts.forEach((w) => (totalStudyMinutes += w.duration || 0));
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

  goWorkout() { this.navigate('#/workout'); },
  goHealthGrowth() { this.navigate('#/health-growth'); },
  goRewardExchange() { this.navigate('#/reward-exchange'); },
  goCourseManage() { this.navigate('#/course-manage'); },
  goReviewDetail() { this.navigate('#/review-detail'); },
});
