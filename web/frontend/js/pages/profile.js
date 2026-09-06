// 我的页 —— 移植自小程序 pages/profile
import { definePage } from '../core/page.js';
import { escapeHtml as h } from '../core/ui.js';
import { getTotalLearningPoints, getLatestHealthRecord } from '../lib/data.js';
import { getTodayKey, addDays } from '../lib/date.js';

export default definePage({
  data: {
    totalPoints: 0,
    childName: '',
    age: 0,
    stats: { totalTasks: 0, completedTasks: 0, totalWorkouts: 0, totalReviews: 0 },
    achievements: [],
    latestHealth: null,
    weekProgress: 0,
  },

  onRefresh(state) {
    const settings = state.settings || {};
    const totalPoints = getTotalLearningPoints(state);
    const allTasks = state.tasks || [];
    const allWorkouts = state.workouts || [];
    const allReviews = state.reviews || [];

    const stats = {
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter((t) => t.status === 'done').length,
      totalWorkouts: allWorkouts.length,
      totalReviews: allReviews.length,
    };

    return {
      totalPoints,
      childName: settings.childName || '小宇',
      age: settings.age || 12,
      stats,
      achievements: this._calculateAchievements(stats, totalPoints, allWorkouts, allReviews),
      latestHealth: getLatestHealthRecord(state),
      weekProgress: this._calculateWeekProgress(state),
    };
  },

  template(d) {
    const achHtml = d.achievements.map((item) => `
      <div class="achievement-item ${item.unlocked ? 'unlocked' : 'locked'}">
        <span class="achievement-icon">${item.icon}</span>
        <span class="achievement-title">${h(item.title)}</span>
        <span class="achievement-desc">${h(item.desc)}</span>
        ${!item.unlocked ? `<div class="achievement-progress"><div class="achievement-progress-bar" style="width: ${Math.min(100, (item.progress / item.target) * 100)}%"></div></div>` : ''}
      </div>`).join('');

    const entry = (action, icon, title, desc) => `
      <div class="entry-item" data-tap="${action}">
        <div class="entry-icon">${icon}</div>
        <div class="entry-content"><span class="entry-title">${title}</span><span class="entry-desc">${desc}</span></div>
        <span class="entry-arrow">›</span>
      </div>`;

    return `
    <div class="page page-profile">
      <div class="hero"><div class="hero-content">
        <span class="eyebrow">PROFILE</span>
        <span class="title">${h(d.childName)} 的管理台</span>
        <span class="subtitle">年龄 ${d.age} 岁 · 积分 ${d.totalPoints}</span>
      </div></div>

      <div class="progress-card">
        <div class="progress-header"><span class="progress-title">本周进度</span><span class="progress-value">${d.weekProgress}%</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${d.weekProgress}%"></div></div>
      </div>

      <div class="card">
        <span class="card-title">学习统计</span>
        <div class="stats-grid">
          <div class="stat-item" data-tap="goWorkout"><span class="stat-value">${d.stats.totalWorkouts}</span><span class="stat-label">运动次数</span></div>
          <div class="stat-item"><span class="stat-value">${d.stats.completedTasks}</span><span class="stat-label">完成任务</span></div>
          <div class="stat-item"><span class="stat-value">${d.stats.totalReviews}</span><span class="stat-label">复盘次数</span></div>
        </div>
      </div>

      ${d.latestHealth ? `
      <div class="card" data-tap="goHealthGrowth">
        <span class="card-title">最新健康数据</span>
        <div class="health-preview">
          <div class="health-item"><span class="health-value">${d.latestHealth.heightCm}<span class="health-unit">cm</span></span><span class="health-label">身高</span></div>
          <div class="health-divider"></div>
          <div class="health-item"><span class="health-value">${d.latestHealth.weightKg}<span class="health-unit">kg</span></span><span class="health-label">体重</span></div>
        </div>
      </div>` : ''}

      <div class="card">
        <span class="card-title">成就徽章</span>
        <div class="achievements-grid">${achHtml}</div>
      </div>

      <div class="card">
        ${entry('goSettings', '⚙️', '设置', '孩子信息、科目管理')}
        ${entry('goWorkout', '🏃', '运动打卡', '记录运动，赚取积分')}
        ${entry('goHealthGrowth', '📏', '身高体重', '记录成长数据')}
        ${entry('goRewardExchange', '🎁', '奖励兑换', '用积分兑换奖励')}
      </div>

      <div class="card about-card">
        <span class="about-title">家长学习管理台</span>
        <span class="about-version">网页版 v1.0.0</span>
        <span class="about-desc">帮助家长科学管理孩子的学习生活</span>
      </div>
    </div>`;
  },

  _calculateAchievements(stats, totalPoints, workouts, reviews) {
    const achievements = [];
    if (stats.completedTasks >= 10) achievements.push({ icon: '📚', title: '学习达人', desc: '完成10个任务', unlocked: true });
    else if (stats.completedTasks >= 5) achievements.push({ icon: '📖', title: '学习新手', desc: '完成5个任务', unlocked: true });
    else achievements.push({ icon: '📖', title: '学习新手', desc: '完成5个任务', unlocked: false, progress: stats.completedTasks, target: 5 });

    if (totalPoints >= 100) achievements.push({ icon: '🌟', title: '积分大师', desc: '累计100积分', unlocked: true });
    else if (totalPoints >= 50) achievements.push({ icon: '⭐', title: '积分能手', desc: '累计50积分', unlocked: true });
    else achievements.push({ icon: '⭐', title: '积分能手', desc: '累计50积分', unlocked: false, progress: totalPoints, target: 50 });

    if (workouts.length >= 10) achievements.push({ icon: '🏃', title: '运动健将', desc: '运动10次', unlocked: true });
    else if (workouts.length >= 3) achievements.push({ icon: '💪', title: '运动达人', desc: '运动3次', unlocked: true });
    else achievements.push({ icon: '💪', title: '运动达人', desc: '运动3次', unlocked: false, progress: workouts.length, target: 3 });

    if (reviews.length >= 7) achievements.push({ icon: '📝', title: '复盘专家', desc: '坚持7天复盘', unlocked: true });
    else if (reviews.length >= 3) achievements.push({ icon: '✏️', title: '复盘新手', desc: '坚持3天复盘', unlocked: true });
    else achievements.push({ icon: '✏️', title: '复盘新手', desc: '坚持3天复盘', unlocked: false, progress: reviews.length, target: 3 });

    return achievements;
  },

  _calculateWeekProgress(state) {
    const todayKey = getTodayKey(new Date());
    const weekAgo = addDays(todayKey, -7);
    const weekTasks = (state.tasks || []).filter((t) => t.date >= weekAgo && t.date <= todayKey);
    if (weekTasks.length === 0) return 0;
    const completed = weekTasks.filter((t) => t.status === 'done').length;
    return Math.round((completed / weekTasks.length) * 100);
  },

  goSettings() { this.navigate('#/settings'); },
  goWorkout() { this.navigate('#/workout'); },
  goHealthGrowth() { this.navigate('#/health-growth'); },
  goRewardExchange() { this.navigate('#/reward-exchange'); },
});
