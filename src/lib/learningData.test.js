import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  deleteTask,
  filterTasks,
  getDayName,
  getReviewForDate,
  getTaskSummary,
  getTasksForDate,
  getTodayKey,
  getTodayTimeline,
  getWeeklyCourses,
  groupTasksByTimeBlock,
  upsertTask,
} from './learningData';
import { loadLearningState, saveLearningState } from './storage';

describe('learning data helpers', () => {
  it('creates a useful first-run state', () => {
    const state = createInitialState();

    expect(state.settings.childName).toBe('小宇');
    expect(state.tasks.length).toBeGreaterThan(0);
    expect(state.recurringCourses.length).toBeGreaterThan(0);
    expect(state.reviews.length).toBeGreaterThan(0);
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
