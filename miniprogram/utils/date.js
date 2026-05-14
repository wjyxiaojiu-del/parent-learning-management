const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function getTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayName(date = new Date()) {
  return WEEKDAYS[date.getDay()];
}

function addDays(dateKey, diff) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + diff);
  return getTodayKey(date);
}

function getNextDateKey(dateKey) {
  return addDays(dateKey, 1);
}

module.exports = {
  WEEKDAYS,
  getTodayKey,
  getDayName,
  addDays,
  getNextDateKey,
};
