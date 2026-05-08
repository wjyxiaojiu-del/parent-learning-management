import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  deleteTask,
  filterTasks,
  getDayName,
  getCompletionRate,
  getCoursesForDate,
  getHealthTrendPoints,
  getLatestHealthRecord,
  getNextDateKey,
  getNutritionEstimate,
  getReviewForDate,
  getSubjectSummary,
  getTaskSummary,
  getTasksForDate,
  getTodayKey,
  getTodayTimeline,
  getTotalLearningPoints,
  getWeekSchedule,
  getWeeklyCourses,
  groupTasksByTimeBlock,
  cloneTaskForDate,
  upsertHealthRecord,
  upsertWorkout,
  redeemReward,
  updateSettings,
  upsertTask,
  upsertRewardItem,
} from './learningData';
import { loadLearningState, saveLearningState } from './storage';

describe('learning data helpers', () => {
  it('creates a useful first-run state', () => {
    const state = createInitialState();

    expect(state.settings.childName).toBe('小宇');
    expect(state.tasks.length).toBeGreaterThan(0);
    expect(state.recurringCourses.length).toBeGreaterThan(0);
    expect(state.reviews.length).toBeGreaterThan(0);
    expect(state.healthRecords.length).toBeGreaterThan(0);
    expect(state.workouts.length).toBeGreaterThan(0);
  });

  it('counts today task summary by status', () => {
    const summary = getTaskSummary([
      { status: 'done' },
      { status: 'todo' },
      { status: 'doing' },
      { status: 'review' },
    ]);

    expect(summary).toEqual({
      total: 4,
      completed: 1,
      incomplete: 2,
      pendingReview: 1,
    });
  });

  it('builds a timeline from tasks and recurring courses sorted by time', () => {
    const state = createInitialState();
    const date = new Date('2026-05-09T08:00:00');
    const dateKey = getTodayKey(date);
    const saturday = getDayName(date);
    const nextState = {
      ...state,
      tasks: [
        { id: 't2', date: dateKey, title: '英语阅读', startTime: '16:30', timeBlock: 'afternoon', subject: '英语', status: 'todo' },
        { id: 't1', date: dateKey, title: '数学口算', startTime: '08:20', timeBlock: 'morning', subject: '数学', status: 'todo' },
      ],
      recurringCourses: [
        { id: 'c1', title: '英语辅导班', subject: '英语', weekday: saturday, startTime: '10:00', endTime: '11:30' },
      ],
    };

    expect(getTodayTimeline(nextState, date).map((item) => item.title)).toEqual([
      '数学口算',
      '英语辅导班',
      '英语阅读',
    ]);
  });

  it('returns fixed courses for a target date', () => {
    const state = {
      ...createInitialState(),
      recurringCourses: [
        { id: 'c1', title: '周五课程', weekday: '周五', startTime: '18:30' },
        { id: 'c2', title: '周六课程', weekday: '周六', startTime: '10:00' },
      ],
    };

    expect(getCoursesForDate(state, new Date('2026-05-08T08:00:00')).map((course) => course.title)).toEqual(['周五课程']);
  });

  it('updates a target task without losing other tasks', () => {
    const state = {
      ...createInitialState(),
      tasks: [
        { id: 'a', title: '旧任务', date: '2026-05-08', status: 'todo' },
        { id: 'b', title: '保留任务', date: '2026-05-08', status: 'todo' },
      ],
    };

    const updated = upsertTask(state, { id: 'a', title: '新任务', date: '2026-05-08', status: 'done' });

    expect(updated.tasks).toHaveLength(2);
    expect(updated.tasks.find((task) => task.id === 'a')).toMatchObject({ title: '新任务', status: 'done' });
    expect(updated.tasks.find((task) => task.id === 'b')).toMatchObject({ title: '保留任务' });
  });

  it('deletes only the selected task', () => {
    const state = {
      ...createInitialState(),
      tasks: [
        { id: 'a', title: '删除', date: '2026-05-08' },
        { id: 'b', title: '保留', date: '2026-05-08' },
      ],
    };

    expect(deleteTask(state, 'a').tasks).toEqual([{ id: 'b', title: '保留', date: '2026-05-08' }]);
  });

  it('groups tasks by time block', () => {
    const grouped = groupTasksByTimeBlock([
      { id: '1', title: 'A', timeBlock: 'night' },
      { id: '2', title: 'B', timeBlock: 'morning' },
      { id: '3', title: 'C', timeBlock: 'other' },
    ]);

    expect(grouped.morning.map((task) => task.title)).toEqual(['B']);
    expect(grouped.night.map((task) => task.title)).toEqual(['A']);
    expect(grouped.other.map((task) => task.title)).toEqual(['C']);
  });

  it('filters tasks by subject and status', () => {
    const tasks = [
      { id: '1', subject: '数学', status: 'todo' },
      { id: '2', subject: '英语', status: 'todo' },
      { id: '3', subject: '数学', status: 'done' },
    ];

    expect(filterTasks(tasks, { subject: '数学', status: 'todo' })).toEqual([{ id: '1', subject: '数学', status: 'todo' }]);
    expect(filterTasks(tasks, { subject: 'all', status: 'done' })).toEqual([{ id: '3', subject: '数学', status: 'done' }]);
  });

  it('orders weekly courses by weekday and start time', () => {
    const state = {
      ...createInitialState(),
      recurringCourses: [
        { id: 'c3', title: '周三晚课', weekday: '周三', startTime: '19:00' },
        { id: 'c1', title: '周一晚课', weekday: '周一', startTime: '20:00' },
        { id: 'c2', title: '周一早课', weekday: '周一', startTime: '08:00' },
      ],
    };

    expect(getWeeklyCourses(state).map((course) => course.title)).toEqual(['周一早课', '周一晚课', '周三晚课']);
  });

  it('finds a review by date key', () => {
    const state = {
      ...createInitialState(),
      reviews: [{ id: 'r1', date: '2026-05-08', completed: '完成不错' }],
    };

    expect(getReviewForDate(state, '2026-05-08')).toMatchObject({ completed: '完成不错' });
    expect(getReviewForDate(state, '2026-05-09')).toBeNull();
  });

  it('supports structured review values', () => {
    const state = {
      ...createInitialState(),
      reviews: [{ id: 'r1', date: '2026-05-08', completion: 'complete', completionPercent: 100, learningState: 'excellent' }],
    };

    expect(getReviewForDate(state, '2026-05-08')).toMatchObject({
      completion: 'complete',
      completionPercent: 100,
      learningState: 'excellent',
    });
  });

  it('calculates a completion rate rounded to whole percent', () => {
    expect(getCompletionRate([{ status: 'done' }, { status: 'todo' }, { status: 'done' }])).toBe(67);
    expect(getCompletionRate([])).toBe(0);
  });

  it('summarizes tasks by subject', () => {
    const summary = getSubjectSummary([
      { subject: '数学', status: 'done' },
      { subject: '数学', status: 'todo' },
      { subject: '英语', status: 'review' },
    ]);

    expect(summary).toEqual([
      { subject: '数学', total: 2, completed: 1, pendingReview: 0 },
      { subject: '英语', total: 1, completed: 0, pendingReview: 1 },
    ]);
  });

  it('builds a seven day schedule from a Monday start', () => {
    const state = {
      ...createInitialState(),
      tasks: [{ id: 't1', date: '2026-05-12', title: '周二任务', startTime: '09:00' }],
      recurringCourses: [{ id: 'c1', weekday: '周三', title: '周三课程', startTime: '19:00' }],
    };

    const schedule = getWeekSchedule(state, new Date('2026-05-13T08:00:00'));

    expect(schedule).toHaveLength(7);
    expect(schedule[0]).toMatchObject({ dateKey: '2026-05-11', weekday: '周一' });
    expect(schedule[1].items.map((item) => item.title)).toEqual(['周二任务']);
    expect(schedule[2].items.map((item) => item.title)).toEqual(['周三课程']);
  });

  it('clones a task to another date as a new todo task', () => {
    const state = {
      ...createInitialState(),
      tasks: [{ id: 'old', date: '2026-05-08', title: '复习单词', status: 'done', startTime: '20:00' }],
    };

    const cloned = cloneTaskForDate(state, 'old', '2026-05-09', 'new-id');

    expect(cloned.tasks).toHaveLength(2);
    expect(cloned.tasks[1]).toMatchObject({ id: 'new-id', date: '2026-05-09', title: '复习单词', status: 'todo' });
  });

  it('gets the next date key and updates settings', () => {
    expect(getNextDateKey('2026-05-08')).toBe('2026-05-09');

    const state = createInitialState();
    const updated = updateSettings(state, { childName: '宁宁' });

    expect(updated.settings.childName).toBe('宁宁');
    expect(updated.tasks).toBe(state.tasks);
  });

  it('upserts health records and reads the latest record', () => {
    const state = { ...createInitialState(), healthRecords: [] };
    const updated = upsertHealthRecord(state, { id: 'h1', date: '2026-05-08', heightCm: 150, weightKg: 42 });
    const next = upsertHealthRecord(updated, { id: 'h2', date: '2026-06-08', heightCm: 151, weightKg: 43 });

    expect(next.healthRecords).toHaveLength(2);
    expect(getLatestHealthRecord(next)).toMatchObject({ id: 'h2', heightCm: 151, weightKg: 43 });
  });

  it('creates trend points sorted by date', () => {
    const state = {
      ...createInitialState(),
      healthRecords: [
        { id: 'h2', date: '2026-06-08', heightCm: 151, weightKg: 43 },
        { id: 'h1', date: '2026-05-08', heightCm: 150, weightKg: 42 },
      ],
    };

    expect(getHealthTrendPoints(state).map((point) => point.date)).toEqual(['2026-05-08', '2026-06-08']);
  });

  it('estimates TDEE and macros from settings and latest health record', () => {
    const state = {
      ...createInitialState(),
      settings: { ...createInitialState().settings, age: 12, sex: 'male', activityLevel: 'moderate' },
      healthRecords: [{ id: 'h1', date: '2026-05-08', heightCm: 150, weightKg: 42 }],
    };

    const estimate = getNutritionEstimate(state);

    expect(estimate.tdee).toBeGreaterThan(1000);
    expect(estimate.proteinG).toBeGreaterThan(0);
    expect(estimate.fatG).toBeGreaterThan(0);
    expect(estimate.carbG).toBeGreaterThan(0);
  });

  it('upserts workouts and assigns duration based points', () => {
    const state = { ...createInitialState(), workouts: [] };
    const updated = upsertWorkout(state, { id: 'w1', date: '2026-05-08', type: '篮球', duration: 45, intensity: 'medium' });

    expect(updated.workouts[0]).toMatchObject({ type: '篮球', points: 45 });
  });

  it('calculates task level points and reward redemption balance', () => {
    const state = {
      ...createInitialState(),
      tasks: [
        { id: 't1', status: 'done', priority: '高', completionLevel: 'excellent' },
        { id: 't2', status: 'done', priority: '中', completionLevel: 'standard' },
        { id: 't3', status: 'todo', priority: '高', completionLevel: 'excellent' },
      ],
      workouts: [],
      pointLedger: [],
    };

    expect(getTotalLearningPoints(state)).toBe(37);
  });

  it('adds reward items and subtracts points when redeemed', () => {
    const state = { ...createInitialState(), tasks: [], workouts: [], rewardItems: [], pointLedger: [{ id: 'bonus', type: 'bonus', points: 50, note: '家长奖励' }] };
    const withReward = upsertRewardItem(state, { id: 'r1', title: '周末电影', cost: 30 });
    const redeemed = redeemReward(withReward, 'r1', 'ledger-1');

    expect(withReward.rewardItems[0]).toMatchObject({ title: '周末电影', cost: 30 });
    expect(redeemed.pointLedger).toContainEqual(expect.objectContaining({ id: 'ledger-1', type: 'redeem', points: -30, rewardTitle: '周末电影' }));
    expect(getTotalLearningPoints(redeemed)).toBe(20);
  });

  it('loads saved state from a storage adapter', () => {
    const storage = new MapStorage();
    const state = createInitialState();

    saveLearningState(storage, { ...state, settings: { ...state.settings, childName: '安安' } });

    expect(loadLearningState(storage).settings.childName).toBe('安安');
  });

  it('falls back to initial state when storage is empty or broken', () => {
    expect(loadLearningState(new MapStorage()).settings.childName).toBe('小宇');
    expect(loadLearningState({ getItem: () => '{broken', setItem: () => {} }).settings.childName).toBe('小宇');
  });
});

class MapStorage {
  constructor() {
    this.items = new Map();
  }

  getItem(key) {
    return this.items.get(key) ?? null;
  }

  setItem(key, value) {
    this.items.set(key, value);
  }
}
