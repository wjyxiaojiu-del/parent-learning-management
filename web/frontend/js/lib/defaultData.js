// 默认数据 —— 从小程序 utils/defaultData.js 原样移植（仅改为 ES Module）
import { getTodayKey, addDays } from './date.js';

export function createDefaultState() {
  const today = getTodayKey();

  return {
    settings: {
      childName: '小宇',
      age: 12,
      subjects: ['语文', '数学', '英语', '科学'],
    },
    tasks: [
      { id: 'task-1', date: today, title: '数学口算 30 题', subject: '数学', status: 'todo', priority: '中', startTime: '', duration: 30, completionLevel: 'standard', note: '' },
      { id: 'task-2', date: today, title: '英语阅读 2 篇', subject: '英语', status: 'todo', priority: '中', startTime: '', duration: 30, completionLevel: 'standard', note: '' },
      { id: 'task-3', date: today, title: '语文生字抄写', subject: '语文', status: 'todo', priority: '中', startTime: '', duration: 20, completionLevel: 'standard', note: '' },
    ],
    recurringCourses: [
      { id: 'course-1', title: '数学思维课', subject: '数学', weekday: '周二', startTime: '19:00', endTime: '20:30' },
      { id: 'course-2', title: '英语口语课', subject: '英语', weekday: '周六', startTime: '10:00', endTime: '11:30' },
    ],
    reviews: [
      { id: 'review-1', date: addDays(today, -1), completion: 'partial', learningState: 'good', problems: '审题容易跳步骤', tomorrowPlan: '增加讲解型练习' },
    ],
    healthRecords: [
      { id: 'health-1', date: addDays(today, -30), heightCm: 150, weightKg: 41 },
      { id: 'health-2', date: today, heightCm: 151, weightKg: 42 },
    ],
    workouts: [
      { id: 'workout-1', date: today, type: '跳绳', duration: 20, points: 20 },
    ],
    rewardItems: [
      { id: 'reward-1', title: '周末自由阅读 30 分钟', cost: 20 },
      { id: 'reward-2', title: '家庭电影时间', cost: 60 },
    ],
    pointLedger: [],
  };
}
