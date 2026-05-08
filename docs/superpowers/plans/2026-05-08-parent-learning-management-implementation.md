# Parent Learning Management MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based parent learning management dashboard for one child with schedule, daily tasks, recurring courses, and daily reviews.

**Architecture:** Create a Vite + React single-page app with focused modules for data shape, local persistence, and UI pages. Persist app state in `localStorage` through one small storage boundary, while React owns editing and filtering state.

**Tech Stack:** React 18, Vite, Tailwind CSS, Lucide React, Vitest, Testing Library.

---

## File Structure

- `package.json`: app scripts and dependencies.
- `index.html`: Vite entry point.
- `vite.config.js`: Vite and Vitest configuration.
- `tailwind.config.js`, `postcss.config.js`: Tailwind setup.
- `src/main.jsx`: React root mounting.
- `src/App.jsx`: application layout, navigation, state orchestration, page switching.
- `src/index.css`: global theme, Tailwind layers, responsive polish.
- `src/data/defaultData.js`: seed data for first-run experience.
- `src/lib/learningData.js`: pure data helpers for state initialization, task summaries, schedule derivation, and CRUD operations.
- `src/lib/storage.js`: localStorage load/save boundary.
- `src/lib/learningData.test.js`: behavior tests for data helpers.

## Tasks

### Task 1: Project Scaffold and Data Tests

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/index.css`
- Create: `src/data/defaultData.js`
- Create: `src/lib/learningData.js`
- Create: `src/lib/learningData.test.js`

- [ ] **Step 1: Write failing tests for learning data behavior**

Create `src/lib/learningData.test.js` with tests for:
- default state includes tasks, recurring courses, reviews, and settings.
- today's summary counts total, completed, incomplete, and pending review tasks.
- today's timeline combines tasks and recurring courses sorted by time.
- task CRUD updates the target task and preserves other tasks.

- [ ] **Step 2: Run tests and verify they fail**

Run: `npm test -- --run`
Expected: FAIL because the project and helper modules do not exist yet.

- [ ] **Step 3: Create project scaffold and implement data helpers**

Add the Vite app files, default data, and pure helper functions:
- `createInitialState()`
- `getTodayKey()`
- `getDayName(date)`
- `getTasksForDate(state, dateKey)`
- `getTaskSummary(tasks)`
- `getTodayTimeline(state, date)`
- `upsertTask(state, task)`
- `deleteTask(state, taskId)`
- `upsertRecurringCourse(state, course)`
- `deleteRecurringCourse(state, courseId)`
- `upsertReview(state, review)`
- `deleteReview(state, reviewId)`

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test -- --run`
Expected: PASS.

### Task 2: App Shell, Schedule Dashboard, and Persistence

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/index.css`
- Create: `src/lib/storage.js`

- [ ] **Step 1: Write failing storage tests**

Add tests in `src/lib/learningData.test.js` proving state can be serialized and restored through a storage adapter.

- [ ] **Step 2: Run tests and verify they fail**

Run: `npm test -- --run`
Expected: FAIL because storage helpers do not exist.

- [ ] **Step 3: Implement local storage helpers and app shell**

Implement:
- `loadLearningState(storage)`
- `saveLearningState(storage, state)`

Build the app shell:
- left navigation with 日程安排, 每日任务, 固定课程, 每日复盘.
- default active page is 日程安排.
- responsive navigation that collapses naturally on narrow widths.
- schedule dashboard with today's timeline, weekly recurring courses, task summary, and review reminder.

- [ ] **Step 4: Run tests and build**

Run: `npm test -- --run`
Run: `npm run build`
Expected: both PASS.

### Task 3: Daily Task Management

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/index.css`
- Modify: `src/lib/learningData.test.js`

- [ ] **Step 1: Add tests for task filtering and grouping**

Add tests for:
- grouping tasks by 上午 / 下午 / 晚上 / 其他.
- filtering by subject.
- filtering by status.

- [ ] **Step 2: Run tests and verify they fail**

Run: `npm test -- --run`
Expected: FAIL because filtering helpers are not implemented.

- [ ] **Step 3: Implement task helpers and task page**

Add:
- `groupTasksByTimeBlock(tasks)`
- `filterTasks(tasks, filters)`

Build 每日任务 page:
- date picker.
- quick add/edit form.
- subject and status filters.
- time-block grouped task list.
- completion/status controls.
- delete action.

- [ ] **Step 4: Run tests and build**

Run: `npm test -- --run`
Run: `npm run build`
Expected: both PASS.

### Task 4: Fixed Courses and Daily Reviews

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/index.css`
- Modify: `src/lib/learningData.test.js`

- [ ] **Step 1: Add tests for course sorting and review lookup**

Add tests for:
- weekly courses are ordered by weekday and start time.
- today's review is found by date key.

- [ ] **Step 2: Run tests and verify they fail**

Run: `npm test -- --run`
Expected: FAIL because helpers do not exist.

- [ ] **Step 3: Implement helpers and management pages**

Add:
- `getWeeklyCourses(state)`
- `getReviewForDate(state, dateKey)`

Build 固定课程 page:
- add/edit form.
- weekly course list.
- delete action.

Build 每日复盘 page:
- date picker.
- review form.
- review history list.
- delete action.

- [ ] **Step 4: Run tests and build**

Run: `npm test -- --run`
Run: `npm run build`
Expected: both PASS.

### Task 5: Final Verification

**Files:**
- All app files.

- [ ] **Step 1: Run full verification**

Run:
- `npm test -- --run`
- `npm run build`

Expected: both PASS.

- [ ] **Step 2: Start local app**

Run: `npm run dev -- --host 127.0.0.1 --port 5173`
Expected: local URL opens and shows 日程安排 by default.

- [ ] **Step 3: Manual smoke check**

Verify:
- default page is 日程安排.
- clicking 每日任务 switches page.
- adding a task updates task summary.
- adding a fixed course appears in weekly course list.
- adding a review persists after refresh.
