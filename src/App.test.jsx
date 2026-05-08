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
    fireEvent.change(screen.getByLabelText('今日完成情况'), { target: { value: '今天按计划完成了数学和英语。' } });
    fireEvent.click(screen.getByRole('button', { name: /保存复盘/ }));

    expect(screen.getAllByText('今天按计划完成了数学和英语。').length).toBeGreaterThanOrEqual(2);
  });
});

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
