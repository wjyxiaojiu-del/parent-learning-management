// 应用入口：注册路由 + 启动
import { registerRoutes, startRouter } from './core/router.js';
import { isLoggedIn } from './core/api.js';
import { loadState } from './core/store.js';
import { createLoginPage } from './pages/login.js';
import todayPage from './pages/today.js';
import recordsPage from './pages/records.js';
import profilePage from './pages/profile.js';
import settingsPage from './pages/settings.js';
import workoutPage from './pages/workout.js';
import healthGrowthPage from './pages/health-growth.js';
import rewardExchangePage from './pages/reward-exchange.js';
import courseManagePage from './pages/course-manage.js';
import reviewDetailPage from './pages/review-detail.js';

registerRoutes({
  login: { factory: createLoginPage, tab: false, title: '登录' },
  today: { factory: todayPage, tab: true, title: '今日' },
  records: { factory: recordsPage, tab: true, title: '记录' },
  profile: { factory: profilePage, tab: true, title: '我的' },
  settings: { factory: settingsPage, tab: false, title: '设置' },
  workout: { factory: workoutPage, tab: false, title: '运动打卡' },
  'health-growth': { factory: healthGrowthPage, tab: false, title: '身高体重' },
  'reward-exchange': { factory: rewardExchangePage, tab: false, title: '奖励兑换' },
  'course-manage': { factory: courseManagePage, tab: false, title: '固定课程' },
  'review-detail': { factory: reviewDetailPage, tab: false, title: '每日复盘' },
});

async function boot() {
  if (isLoggedIn()) {
    try {
      await loadState();
    } catch (e) {
      console.warn('初始加载失败：', e.message);
    }
  }
  startRouter();
}

boot();
