// 业务计算 —— 从小程序 utils/data.js 原样移植（仅改为 ES Module）
import { getDayName } from './date.js';

export const statusLabels = {
  todo: '待完成',
  done: '已完成',
};

export const completionLabels = {
  complete: '完成',
  partial: '部分完成',
  incomplete: '未完成',
};

export const learningStateLabels = {
  excellent: '积极',
  good: '正常',
  average: '一般',
  poor: '不在状态',
};

export function uuid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getTasksForDate(state, dateKey) {
  return (state.tasks || []).filter((t) => t.date === dateKey);
}

export function getCoursesForDate(state, date = new Date()) {
  const weekday = getDayName(date);
  return (state.recurringCourses || [])
    .filter((c) => c.weekday === weekday)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
}

export function getTaskSummary(tasks) {
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'done').length,
    incomplete: tasks.filter((t) => t.status !== 'done').length,
  };
}

export function getCompletionRate(tasks) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100);
}

export function getTaskEarnedPoints(task) {
  if (task.status !== 'done') return 0;
  return 10;
}

export function getTotalLearningPoints(state) {
  const taskPoints = (state.tasks || []).reduce((s, t) => s + getTaskEarnedPoints(t), 0);
  const workoutPoints = (state.workouts || []).reduce((s, w) => s + (Number(w.points) || 0), 0);
  const ledgerPoints = (state.pointLedger || []).reduce((s, e) => s + (Number(e.points) || 0), 0);
  return taskPoints + workoutPoints + ledgerPoints;
}

export function getAvailablePoints(state) {
  return Math.max(0, getTotalLearningPoints(state));
}

function upsertById(list, item) {
  const exists = list.some((cur) => cur.id === item.id);
  return exists ? list.map((cur) => (cur.id === item.id ? item : cur)) : [item, ...list];
}

export function updateStateList(state, key, item) {
  return { ...state, [key]: upsertById(state[key] || [], item) };
}

export function deleteFromStateList(state, key, id) {
  return { ...state, [key]: (state[key] || []).filter((item) => item.id !== id) };
}

export function getLatestHealthRecord(state) {
  const records = [...(state.healthRecords || [])].sort((a, b) => a.date.localeCompare(b.date));
  return records[records.length - 1] || null;
}

export function getRecentHealthRecords(state, count) {
  return [...(state.healthRecords || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, count);
}

export function calculateWorkoutPoints(workout) {
  return Math.max(1, Math.round(Number(workout.duration) || 0));
}
