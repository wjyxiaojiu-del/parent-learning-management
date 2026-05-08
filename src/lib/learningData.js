const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEKDAY_ORDER = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const TIME_BLOCKS = ['morning', 'afternoon', 'night', 'other'];

export function getTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayName(date = new Date()) {
  return WEEKDAYS[date.getDay()];
}

export function createInitialState() {
  return cloneDefaultState();
}

export function getTasksForDate(state, dateKey) {
  return state.tasks.filter((task) => task.date === dateKey);
}

export function getTaskSummary(tasks) {
  const completed = tasks.filter((task) => task.status === 'done').length;
  const pendingReview = tasks.filter((task) => task.status === 'review').length;
  return {
    total: tasks.length,
    completed,
    incomplete: tasks.filter((task) => task.status === 'todo' || task.status === 'doing').length,
    pendingReview,
  };
}

export function getCompletionRate(tasks) {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((task) => task.status === 'done').length;
  return Math.round((completed / tasks.length) * 100);
}

export function getSubjectSummary(tasks) {
  const bySubject = new Map();
  tasks.forEach((task) => {
    const current = bySubject.get(task.subject) || {
      subject: task.subject,
      total: 0,
      completed: 0,
      pendingReview: 0,
    };
    current.total += 1;
    if (task.status === 'done') current.completed += 1;
    if (task.status === 'review') current.pendingReview += 1;
    bySubject.set(task.subject, current);
  });
  return [...bySubject.values()].sort((a, b) => b.total - a.total || a.subject.localeCompare(b.subject));
}

export function getTodayTimeline(state, date = new Date()) {
  const dateKey = getTodayKey(date);
  const weekday = getDayName(date);
  const taskItems = getTasksForDate(state, dateKey).map((task) => ({
    ...task,
    type: 'task',
    time: task.startTime || blockDefaultTime(task.timeBlock),
  }));
  const courseItems = state.recurringCourses
    .filter((course) => course.weekday === weekday)
    .map((course) => ({
      ...course,
      type: 'course',
      time: course.startTime,
    }));

  return [...taskItems, ...courseItems].sort(compareByTime);
}

export function getWeekSchedule(state, date = new Date()) {
  const start = getMonday(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const dateKey = getTodayKey(day);
    const weekday = getDayName(day);
    const tasks = getTasksForDate(state, dateKey).map((task) => ({
      ...task,
      type: 'task',
      time: task.startTime || blockDefaultTime(task.timeBlock),
    }));
    const courses = state.recurringCourses
      .filter((course) => course.weekday === weekday)
      .map((course) => ({ ...course, type: 'course', time: course.startTime }));

    return {
      dateKey,
      weekday,
      dayLabel: `${day.getMonth() + 1}/${day.getDate()}`,
      items: [...tasks, ...courses].sort(compareByTime),
    };
  });
}

export function upsertTask(state, task) {
  const exists = state.tasks.some((item) => item.id === task.id);
  return {
    ...state,
    tasks: exists ? state.tasks.map((item) => (item.id === task.id ? task : item)) : [...state.tasks, task],
  };
}

export function deleteTask(state, taskId) {
  return {
    ...state,
    tasks: state.tasks.filter((task) => task.id !== taskId),
  };
}

export function cloneTaskForDate(state, taskId, dateKey, newId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return state;
  return {
    ...state,
    tasks: [
      ...state.tasks,
      {
        ...task,
        id: newId,
        date: dateKey,
        status: 'todo',
      },
    ],
  };
}

export function upsertRecurringCourse(state, course) {
  const exists = state.recurringCourses.some((item) => item.id === course.id);
  return {
    ...state,
    recurringCourses: exists
      ? state.recurringCourses.map((item) => (item.id === course.id ? course : item))
      : [...state.recurringCourses, course],
  };
}

export function deleteRecurringCourse(state, courseId) {
  return {
    ...state,
    recurringCourses: state.recurringCourses.filter((course) => course.id !== courseId),
  };
}

export function upsertReview(state, review) {
  const exists = state.reviews.some((item) => item.id === review.id);
  return {
    ...state,
    reviews: exists ? state.reviews.map((item) => (item.id === review.id ? review : item)) : [...state.reviews, review],
  };
}

export function deleteReview(state, reviewId) {
  return {
    ...state,
    reviews: state.reviews.filter((review) => review.id !== reviewId),
  };
}

export function groupTasksByTimeBlock(tasks) {
  return TIME_BLOCKS.reduce((groups, block) => {
    groups[block] = tasks.filter((task) => (task.timeBlock || 'other') === block).sort(compareByTaskTime);
    return groups;
  }, {});
}

export function filterTasks(tasks, filters) {
  return tasks.filter((task) => {
    const subjectMatches = !filters.subject || filters.subject === 'all' || task.subject === filters.subject;
    const statusMatches = !filters.status || filters.status === 'all' || task.status === filters.status;
    return subjectMatches && statusMatches;
  });
}

export function getWeeklyCourses(state) {
  return [...state.recurringCourses].sort((a, b) => {
    const dayDiff = WEEKDAY_ORDER.indexOf(a.weekday) - WEEKDAY_ORDER.indexOf(b.weekday);
    if (dayDiff !== 0) return dayDiff;
    return compareTime(a.startTime, b.startTime);
  });
}

export function getReviewForDate(state, dateKey) {
  return state.reviews.find((review) => review.date === dateKey) || null;
}

export function getNextDateKey(dateKey) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + 1);
  return getTodayKey(date);
}

export function updateSettings(state, settings) {
  return {
    ...state,
    settings: {
      ...state.settings,
      ...settings,
    },
  };
}

function cloneDefaultState() {
  return structuredCloneSafe(getDefaultState());
}

function getDefaultState() {
  return defaultStateBridge();
}

function defaultStateBridge() {
  return globalThis.__LEARNING_DEFAULT_STATE__ || fallbackDefaultState();
}

function fallbackDefaultState() {
  return {
    settings: { childName: '小宇', subjects: ['语文', '数学', '英语', '科学', '阅读', '综合'] },
    tasks: [],
    recurringCourses: [],
    reviews: [],
  };
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function blockDefaultTime(block) {
  return {
    morning: '09:00',
    afternoon: '15:00',
    night: '20:00',
    other: '23:00',
  }[block || 'other'];
}

function compareByTaskTime(a, b) {
  return compareTime(a.startTime || blockDefaultTime(a.timeBlock), b.startTime || blockDefaultTime(b.timeBlock));
}

function compareByTime(a, b) {
  return compareTime(a.time, b.time);
}

function compareTime(a = '23:59', b = '23:59') {
  return a.localeCompare(b);
}

function getMonday(date) {
  const day = new Date(date);
  const dayIndex = day.getDay() === 0 ? 7 : day.getDay();
  day.setDate(day.getDate() - dayIndex + 1);
  day.setHours(0, 0, 0, 0);
  return day;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

import { defaultState } from '../data/defaultData';
globalThis.__LEARNING_DEFAULT_STATE__ = defaultState;
