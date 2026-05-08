import { createInitialState } from './learningData';

const STORAGE_KEY = 'parent-learning-management-state';

export function loadLearningState(storage = window.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    return { ...createInitialState(), ...JSON.parse(raw) };
  } catch {
    return createInitialState();
  }
}

export function saveLearningState(storage = window.localStorage, state) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
