import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    const storage = new MemoryStorage();
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      configurable: true,
    });
    vi.stubGlobal('crypto', {
      randomUUID: () => `id-${Math.random().toString(16).slice(2)}`,
    });
  });

  it('opens on the schedule dashboard by default', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '日程安排' })).toBeInTheDocument();
    expect(screen.getByText('今日时间线')).toBeInTheDocument();
    expect(screen.getByText('本周固定课程')).toBeInTheDocument();
    expect(screen.getByText('本周日历')).toBeInTheDocument();
    expect(screen.getByText('科目完成概览')).toBeInTheDocument();
  });

  it('switches to daily tasks and adds a task', () => {
    render(<App />);

    fireEvent.click(screen.getAllByText('每日任务')[0]);
    fireEvent.change(screen.getByLabelText('任务标题'), { target: { value: '背诵古诗一首' } });
    fireEvent.click(screen.getByRole('button', { name: /保存任务/ }));

    expect(screen.getByText('背诵古诗一首')).toBeInTheDocument();
  });

  it('adds a recurring course', () => {
    render(<App />);

    fireEvent.click(screen.getAllByText('固定课程')[0]);
    fireEvent.change(screen.getByLabelText('课程名称'), { target: { value: '科学实验课' } });
    fireEvent.click(screen.getByRole('button', { name: /保存课程/ }));

    const list = screen.getByText('本周固定安排').closest('section');
    expect(within(list).getByText('科学实验课')).toBeInTheDocument();
  });

  it('saves a daily review', () => {
    render(<App />);

    fireEvent.click(screen.getAllByText('每日复盘')[0]);
    fireEvent.change(screen.getByLabelText('完成情况'), { target: { value: 'complete' } });
    fireEvent.change(screen.getByLabelText('完成程度'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('学习状态'), { target: { value: 'excellent' } });
    fireEvent.change(screen.getByLabelText('主要问题'), { target: { value: '审题仍然偏快。' } });
    fireEvent.click(screen.getByRole('button', { name: /保存复盘/ }));

    expect(screen.getByText(/完成 · 100%/)).toBeInTheDocument();
    expect(screen.getByText('点赞！今天完成得很好')).toBeInTheDocument();
  });

  it('records health and workout data', () => {
    render(<App />);

    fireEvent.click(screen.getAllByText('身体运动')[0]);
    fireEvent.change(screen.getByLabelText('身高 cm'), { target: { value: '152' } });
    fireEvent.change(screen.getByLabelText('体重 kg'), { target: { value: '43' } });
    fireEvent.click(screen.getByRole('button', { name: /保存身体记录/ }));
    fireEvent.change(screen.getByLabelText('运动项目'), { target: { value: '篮球' } });
    fireEvent.change(screen.getByLabelText('运动分钟'), { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: /保存运动/ }));

    expect(screen.getByText('身体趋势')).toBeInTheDocument();
    expect(screen.getByText('篮球')).toBeInTheDocument();
  });

  it('clones a task to tomorrow from the task row', () => {
    render(<App />);

    fireEvent.click(screen.getAllByText('每日任务')[0]);
    fireEvent.click(screen.getAllByLabelText('复制到明天')[0]);

    fireEvent.change(screen.getByLabelText('日期'), { target: { value: nextDateKey() } });
    expect(screen.getAllByText('数学口算 30 题').length).toBeGreaterThanOrEqual(1);
  });

  it('updates the child name in settings', () => {
    render(<App />);

    fireEvent.click(screen.getAllByText('设置')[0]);
    fireEvent.change(screen.getByLabelText('孩子姓名'), { target: { value: '宁宁' } });
    fireEvent.click(screen.getByRole('button', { name: /保存设置/ }));

    expect(screen.getAllByText(/宁宁 的学习节奏/).length).toBeGreaterThanOrEqual(1);
  });
});

function nextDateKey() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

class MemoryStorage {
  constructor() {
    this.items = new Map();
  }

  getItem(key) {
    return this.items.get(key) ?? null;
  }

  setItem(key, value) {
    this.items.set(key, value);
  }

  removeItem(key) {
    this.items.delete(key);
  }

  clear() {
    this.items.clear();
  }
}
