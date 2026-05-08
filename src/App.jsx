import { useEffect, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ClipboardCheck,
  Copy,
  FileText,
  LayoutDashboard,
  ListChecks,
  Plus,
  RotateCcw,
  Settings,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import {
  cloneTaskForDate,
  deleteRecurringCourse,
  deleteReview,
  deleteTask,
  filterTasks,
  getCompletionRate,
  getNextDateKey,
  getReviewForDate,
  getSubjectSummary,
  getTaskSummary,
  getTasksForDate,
  getTodayKey,
  getTodayTimeline,
  getWeekSchedule,
  getWeeklyCourses,
  groupTasksByTimeBlock,
  updateSettings,
  upsertRecurringCourse,
  upsertReview,
  upsertTask,
} from './lib/learningData';
import { loadLearningState, saveLearningState } from './lib/storage';

const navItems = [
  { id: 'schedule', label: '日程安排', icon: LayoutDashboard },
  { id: 'tasks', label: '每日任务', icon: ListChecks },
  { id: 'courses', label: '固定课程', icon: CalendarDays },
  { id: 'reviews', label: '每日复盘', icon: FileText },
  { id: 'settings', label: '设置', icon: Settings },
];

const statusLabels = {
  todo: '待完成',
  doing: '进行中',
  done: '已完成',
  review: '待复盘',
};

const timeBlockLabels = {
  morning: '上午',
  afternoon: '下午',
  night: '晚上',
  other: '其他',
};

const emptyTask = {
  title: '',
  subject: '数学',
  status: 'todo',
  priority: '中',
  timeBlock: 'morning',
  startTime: '08:30',
  duration: 30,
  note: '',
};

const emptyCourse = {
  title: '',
  subject: '数学',
  weekday: '周一',
  startTime: '19:00',
  endTime: '20:30',
  location: '',
  note: '',
};

export default function App() {
  const [activePage, setActivePage] = useState('schedule');
  const [state, setState] = useState(() => loadLearningState());
  const [selectedDate, setSelectedDate] = useState(getTodayKey(new Date()));
  const [filters, setFilters] = useState({ subject: 'all', status: 'all' });

  useEffect(() => {
    saveLearningState(window.localStorage, state);
  }, [state]);

  const todayTasks = getTasksForDate(state, getTodayKey(new Date()));
  const selectedTasks = getTasksForDate(state, selectedDate);
  const selectedReview = getReviewForDate(state, selectedDate);
  const summary = getTaskSummary(todayTasks);

  return (
    <div className="min-h-screen bg-[#faf5ef] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r border-sky-300/30 bg-[#68b9ea] px-4 py-5 shadow-xl shadow-sky-900/10 lg:block">
        <Brand childName={state.settings.childName} inverse />
        <nav className="mt-8 space-y-2">
          {navItems.map((item) => (
            <NavButton key={item.id} item={item} active={activePage === item.id} onClick={() => setActivePage(item.id)} />
          ))}
        </nav>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-10 border-b border-orange-100 bg-[#faf5ef]/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
          <Brand childName={state.settings.childName} compact />
          <div className="mt-3 grid grid-cols-5 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`mobile-tab ${activePage === item.id ? 'mobile-tab-active' : ''}`}
                onClick={() => setActivePage(item.id)}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {activePage === 'schedule' && (
            <SchedulePage state={state} summary={summary} todayTasks={todayTasks} onNavigate={setActivePage} />
          )}
          {activePage === 'tasks' && (
            <TasksPage
              state={state}
              date={selectedDate}
              filters={filters}
              tasks={selectedTasks}
              onDateChange={setSelectedDate}
              onFiltersChange={setFilters}
              onStateChange={setState}
            />
          )}
          {activePage === 'courses' && <CoursesPage state={state} onStateChange={setState} />}
          {activePage === 'reviews' && (
            <ReviewsPage
              state={state}
              date={selectedDate}
              review={selectedReview}
              onDateChange={setSelectedDate}
              onStateChange={setState}
            />
          )}
          {activePage === 'settings' && <SettingsPage state={state} onStateChange={setState} />}
        </main>
      </div>
    </div>
  );
}

function Brand({ childName, compact = false, inverse = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-mark">
        <BookOpen size={22} />
      </div>
      <div>
        <p className={`font-semibold ${compact ? 'text-base' : 'text-lg'} ${inverse ? 'text-white' : 'text-slate-950'}`}>家长学习管理台</p>
        <p className={`text-sm ${inverse ? 'text-slate-400' : 'text-slate-500'}`}>{childName} 的学习节奏</p>
      </div>
    </div>
  );
}

function NavButton({ item, active, onClick }) {
  return (
    <button className={`nav-button ${active ? 'nav-button-active' : ''}`} onClick={onClick}>
      <item.icon size={19} />
      <span>{item.label}</span>
      {active && <ChevronRight className="ml-auto" size={17} />}
    </button>
  );
}

function SchedulePage({ state, summary, todayTasks, onNavigate }) {
  const timeline = getTodayTimeline(state, new Date());
  const weeklyCourses = getWeeklyCourses(state);
  const weekSchedule = getWeekSchedule(state, new Date());
  const subjectSummary = getSubjectSummary(todayTasks);
  const completionRate = getCompletionRate(todayTasks);
  const hasReview = Boolean(getReviewForDate(state, getTodayKey(new Date())));

  return (
    <section className="space-y-6">
      <PageTitle title="日程安排" subtitle="先看今天怎么排，再看本周固定课表。" />

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="今日任务" value={summary.total} />
        <Metric label="已完成" value={summary.completed} tone="green" />
        <Metric label="未完成" value={summary.incomplete} tone="amber" />
        <Metric label="完成率" value={`${completionRate}%`} tone="blue" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="今日时间线" action={<Clock3 size={18} />}>
          <div className="space-y-3">
            {timeline.map((item) => (
              <div key={`${item.type}-${item.id}`} className="timeline-item">
                <div className="time-pill">{item.time}</div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-slate-500">
                    {item.type === 'course' ? `${item.subject} · ${item.location || '固定课程'}` : `${item.subject} · ${statusLabels[item.status]}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="今日任务摘要" action={<ClipboardCheck size={18} />}>
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <div key={task.id} className="summary-row">
                <CheckCircle2 className={task.status === 'done' ? 'text-emerald-500' : 'text-slate-300'} size={19} />
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-slate-500">{task.subject} · {task.startTime} · {statusLabels[task.status]}</p>
                </div>
              </div>
            ))}
            <div className="reminder-stack">
              <Reminder active={!hasReview} text={hasReview ? '今日复盘已记录' : '今天还需要填写复盘'} />
              <Reminder active={summary.incomplete > 0} text={`${summary.incomplete} 个任务仍未完成`} />
            </div>
            <button className="primary-button w-full" onClick={() => onNavigate('tasks')}>
              <ListChecks size={18} />
              进入每日任务
            </button>
          </div>
        </Panel>
      </div>

      <Panel title="本周固定课程" action={<CalendarDays size={18} />}>
        <div className="course-strip">
          {weeklyCourses.map((course) => (
            <div key={course.id} className="course-strip-item">
              <span>{course.weekday}</span>
              <strong>{course.title}</strong>
              <p>{course.startTime}-{course.endTime} · {course.subject}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="secondary-grid">
        <Panel title="本周日历" action={<CalendarDays size={18} />}>
          <div className="week-grid">
            {weekSchedule.map((day) => (
              <div key={day.dateKey} className="week-day">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{day.weekday}</p>
                    <p className="text-xs text-slate-400">{day.dayLabel}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">{day.items.length}</span>
                </div>
                <div className="space-y-2">
                  {day.items.slice(0, 2).map((item) => (
                    <div key={`${day.dateKey}-${item.type}-${item.id}`} className={`mini-event mini-event-${item.type}`}>
                      <span>{item.time}</span>
                      <p>{item.title}</p>
                    </div>
                  ))}
                  {day.items.length === 0 && <p className="text-xs text-slate-400">暂无安排</p>}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="科目完成概览" action={<TrendingUp size={18} />}>
          <div className="space-y-3">
            {subjectSummary.map((item) => (
              <div key={item.subject}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.subject}</span>
                  <span className="text-slate-400">{item.completed}/{item.total}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-900"
                    style={{ width: `${Math.round((item.completed / item.total) * 100)}%` }}
                  />
                </div>
                {item.pendingReview > 0 && <p className="mt-1 text-xs text-sky-600">{item.pendingReview} 项待复盘</p>}
              </div>
            ))}
            {subjectSummary.length === 0 && <p className="text-sm text-slate-400">今天还没有任务。</p>}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function TasksPage({ state, date, filters, tasks, onDateChange, onFiltersChange, onStateChange }) {
  const [form, setForm] = useState(emptyTask);
  const filteredTasks = filterTasks(tasks, filters);
  const grouped = groupTasksByTimeBlock(filteredTasks);

  function submitTask(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    onStateChange((current) =>
      upsertTask(current, {
        ...form,
        id: form.id || crypto.randomUUID(),
        date,
        duration: Number(form.duration) || 0,
      }),
    );
    setForm(emptyTask);
  }

  return (
    <section className="space-y-6">
      <PageTitle title="每日任务" subtitle="按时间段安排任务，同时保留科目和状态筛选。" />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Panel title={form.id ? '编辑任务' : '新增任务'} action={<Plus size={18} />}>
          <form className="form-grid" onSubmit={submitTask}>
            <Input label="日期" type="date" value={date} onChange={onDateChange} />
            <Input label="任务标题" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
            <Select label="科目" value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} options={state.settings.subjects} />
            <Select label="状态" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={Object.keys(statusLabels)} labels={statusLabels} />
            <Select label="时间段" value={form.timeBlock} onChange={(value) => setForm({ ...form, timeBlock: value })} options={Object.keys(timeBlockLabels)} labels={timeBlockLabels} />
            <Input label="开始时间" type="time" value={form.startTime} onChange={(value) => setForm({ ...form, startTime: value })} />
            <Input label="预计分钟" type="number" value={form.duration} onChange={(value) => setForm({ ...form, duration: value })} />
            <Select label="优先级" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} options={['高', '中', '低']} />
            <Textarea label="备注" value={form.note} onChange={(value) => setForm({ ...form, note: value })} />
            <button className="primary-button" type="submit"><Plus size={18} />保存任务</button>
          </form>
        </Panel>

        <div className="space-y-4">
          <div className="filter-bar">
            <Select compact label="科目" value={filters.subject} onChange={(subject) => onFiltersChange({ ...filters, subject })} options={['all', ...state.settings.subjects]} labels={{ all: '全部科目' }} />
            <Select compact label="状态" value={filters.status} onChange={(status) => onFiltersChange({ ...filters, status })} options={['all', ...Object.keys(statusLabels)]} labels={{ all: '全部状态', ...statusLabels }} />
          </div>
          {Object.entries(timeBlockLabels).map(([block, label]) => (
            <TaskGroup
              key={block}
              title={label}
              tasks={grouped[block] || []}
              onEdit={setForm}
              onDelete={(id) => onStateChange((current) => deleteTask(current, id))}
              onClone={(id) => onStateChange((current) => cloneTaskForDate(current, id, getNextDateKey(date), crypto.randomUUID()))}
              onStatus={(task, status) => onStateChange((current) => upsertTask(current, { ...task, status }))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CoursesPage({ state, onStateChange }) {
  const [form, setForm] = useState(emptyCourse);
  const weeklyCourses = getWeeklyCourses(state);

  function submitCourse(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    onStateChange((current) => upsertRecurringCourse(current, { ...form, id: form.id || crypto.randomUUID() }));
    setForm(emptyCourse);
  }

  return (
    <section className="space-y-6">
      <PageTitle title="固定课程" subtitle="维护每周重复的辅导班和固定学习安排。" />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Panel title={form.id ? '编辑课程' : '新增课程'} action={<CalendarDays size={18} />}>
          <form className="form-grid" onSubmit={submitCourse}>
            <Input label="课程名称" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
            <Select label="科目" value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} options={state.settings.subjects} />
            <Select label="星期" value={form.weekday} onChange={(value) => setForm({ ...form, weekday: value })} options={['周一', '周二', '周三', '周四', '周五', '周六', '周日']} />
            <Input label="开始时间" type="time" value={form.startTime} onChange={(value) => setForm({ ...form, startTime: value })} />
            <Input label="结束时间" type="time" value={form.endTime} onChange={(value) => setForm({ ...form, endTime: value })} />
            <Input label="地点/方式" value={form.location} onChange={(value) => setForm({ ...form, location: value })} />
            <Textarea label="备注" value={form.note} onChange={(value) => setForm({ ...form, note: value })} />
            <button className="primary-button" type="submit"><Plus size={18} />保存课程</button>
          </form>
        </Panel>

        <Panel title="本周固定安排" action={<BookOpen size={18} />}>
          <div className="space-y-3">
            {weeklyCourses.map((course) => (
              <div key={course.id} className="management-row">
                <div>
                  <p className="font-semibold">{course.title}</p>
                  <p className="text-sm text-slate-500">{course.weekday} {course.startTime}-{course.endTime} · {course.subject} · {course.location || '未填写地点'}</p>
                  {course.note && <p className="mt-1 text-sm text-slate-500">{course.note}</p>}
                </div>
                <RowActions onEdit={() => setForm(course)} onDelete={() => onStateChange((current) => deleteRecurringCourse(current, course.id))} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function ReviewsPage({ state, date, review, onDateChange, onStateChange }) {
  const [form, setForm] = useState(() => review || createBlankReview(date));

  useEffect(() => {
    setForm(review || createBlankReview(date));
  }, [date, review]);

  function submitReview(event) {
    event.preventDefault();
    onStateChange((current) => upsertReview(current, { ...form, id: form.id || crypto.randomUUID(), date }));
  }

  return (
    <section className="space-y-6">
      <PageTitle title="每日复盘" subtitle="记录完成情况、学习状态和明天调整。" />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title="填写复盘" action={<FileText size={18} />}>
          <form className="form-grid" onSubmit={submitReview}>
            <Input label="日期" type="date" value={date} onChange={onDateChange} />
            <Textarea label="今日完成情况" value={form.completed} onChange={(value) => setForm({ ...form, completed: value })} />
            <Textarea label="学习状态" value={form.mood} onChange={(value) => setForm({ ...form, mood: value })} />
            <Textarea label="主要问题" value={form.problems} onChange={(value) => setForm({ ...form, problems: value })} />
            <Textarea label="明天调整" value={form.tomorrowPlan} onChange={(value) => setForm({ ...form, tomorrowPlan: value })} />
            <Textarea label="家长备注" value={form.parentNote} onChange={(value) => setForm({ ...form, parentNote: value })} />
            <button className="primary-button" type="submit"><FileText size={18} />保存复盘</button>
          </form>
        </Panel>

        <Panel title="复盘记录" action={<RotateCcw size={18} />}>
          <div className="space-y-3">
            {[...state.reviews].sort((a, b) => b.date.localeCompare(a.date)).map((item) => (
              <div key={item.id} className="management-row">
                <div>
                  <p className="font-semibold">{item.date}</p>
                  <p className="text-sm text-slate-600">{item.completed || '未填写完成情况'}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.tomorrowPlan || '未填写明天调整'}</p>
                </div>
                <RowActions onEdit={() => onDateChange(item.date)} onDelete={() => onStateChange((current) => deleteReview(current, item.id))} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function SettingsPage({ state, onStateChange }) {
  const [form, setForm] = useState(state.settings);

  useEffect(() => {
    setForm(state.settings);
  }, [state.settings]);

  function submitSettings(event) {
    event.preventDefault();
    onStateChange((current) => updateSettings(current, form));
  }

  return (
    <section className="space-y-6">
      <PageTitle title="设置" subtitle="调整孩子姓名和默认科目，让系统更贴近家庭使用。" />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title="基础信息" action={<Settings size={18} />}>
          <form className="form-grid" onSubmit={submitSettings}>
            <Input label="孩子姓名" value={form.childName} onChange={(value) => setForm({ ...form, childName: value })} />
            <Textarea
              label="默认科目"
              value={form.subjects.join('、')}
              onChange={(value) => setForm({ ...form, subjects: value.split(/[、,，\s]+/).filter(Boolean) })}
            />
            <button className="primary-button" type="submit"><Settings size={18} />保存设置</button>
          </form>
        </Panel>
        <Panel title="当前科目" action={<BookOpen size={18} />}>
          <div className="flex flex-wrap gap-2">
            {form.subjects.map((subject) => <span key={subject} className="subject-chip">{subject}</span>)}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function TaskGroup({ title, tasks, onEdit, onDelete, onClone, onStatus }) {
  return (
    <Panel title={`${title} · ${tasks.length} 项`}>
      <div className="space-y-3">
        {tasks.length === 0 && <p className="text-sm text-slate-400">这个时间段暂无任务。</p>}
        {tasks.map((task) => (
          <div key={task.id} className="task-row">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{task.title}</p>
                <span className="tag">{task.subject}</span>
                <span className="tag">{task.priority}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{task.startTime} · {task.duration} 分钟 · {task.note || '无备注'}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <select className="small-select" value={task.status} onChange={(event) => onStatus(task, event.target.value)}>
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <button className="icon-button" onClick={() => onClone(task.id)} type="button" aria-label="复制到明天"><Copy size={16} /></button>
              <RowActions onEdit={() => onEdit(task)} onDelete={() => onDelete(task.id)} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PageTitle({ title, subtitle }) {
  return (
    <div className="page-hero">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8ba3c9]">Parent Console</p>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">{subtitle}</p>
      </div>
      <div className="hero-date">
        <CalendarDays size={18} />
        <span>{getTodayKey(new Date())}</span>
      </div>
    </div>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className="panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {action && <div className="panel-icon">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, tone = 'slate' }) {
  const toneClass = {
    slate: 'text-slate-900 bg-slate-100',
    green: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    blue: 'text-sky-700 bg-sky-50',
  }[tone];
  return (
    <div className="metric-card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-3 inline-flex min-w-14 justify-center rounded-lg px-3 py-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function Reminder({ active, text }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${active ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
      {text}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, options, labels = {}, compact = false }) {
  return (
    <label className={`field ${compact ? 'field-compact' : ''}`}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{labels[option] || option}</option>)}
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <label className="field md:col-span-2">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} />
    </label>
  );
}

function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-2">
      <button className="icon-button" onClick={onEdit} type="button" aria-label="编辑"><FileText size={16} /></button>
      <button className="icon-button danger" onClick={onDelete} type="button" aria-label="删除"><Trash2 size={16} /></button>
    </div>
  );
}

function createBlankReview(date) {
  return {
    date,
    completed: '',
    mood: '',
    problems: '',
    tomorrowPlan: '',
    parentNote: '',
  };
}
