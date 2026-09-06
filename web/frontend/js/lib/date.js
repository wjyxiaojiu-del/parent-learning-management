// 日期工具 —— 从小程序 utils/date.js 原样移植（仅改为 ES Module）
export const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function getTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayName(date = new Date()) {
  return WEEKDAYS[date.getDay()];
}

export function addDays(dateKey, diff) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + diff);
  return getTodayKey(date);
}

export function getNextDateKey(dateKey) {
  return addDays(dateKey, 1);
}
