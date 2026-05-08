const today = getDateKey(new Date());

export const defaultState = {
  settings: {
    childName: '小宇',
    age: 12,
    sex: 'male',
    activityLevel: 'moderate',
    subjects: ['语文', '数学', '英语', '科学', '阅读', '综合'],
  },
  tasks: [
    {
      id: 'task-math-oral',
      date: today,
      title: '数学口算 30 题',
      subject: '数学',
      status: 'todo',
      priority: '高',
      timeBlock: 'morning',
      startTime: '08:20',
      duration: 25,
      note: '重点观察正确率和速度。',
    },
    {
      id: 'task-english-reading',
      date: today,
      title: '英语分级阅读 2 篇',
      subject: '英语',
      status: 'doing',
      priority: '中',
      timeBlock: 'afternoon',
      startTime: '16:30',
      duration: 35,
      note: '读完后口头复述主要内容。',
    },
    {
      id: 'task-review',
      date: today,
      title: '整理今日错题',
      subject: '综合',
      status: 'review',
      priority: '高',
      timeBlock: 'night',
      startTime: '20:30',
      duration: 30,
      note: '只整理高频错误，不追求数量。',
    },
  ],
  recurringCourses: [
    {
      id: 'course-math-tue',
      title: '数学思维课',
      subject: '数学',
      weekday: '周二',
      startTime: '19:00',
      endTime: '20:30',
      location: '线下教室',
      note: '课前带错题本。',
    },
    {
      id: 'course-english-sat',
      title: '英语口语课',
      subject: '英语',
      weekday: '周六',
      startTime: '10:00',
      endTime: '11:30',
      location: '线上',
      note: '提前 10 分钟进入会议。',
    },
  ],
  reviews: [
    {
      id: 'review-today',
      date: today,
      completion: 'partial',
      completionPercent: 65,
      learningState: 'good',
      problems: '数学应用题审题容易跳步骤。',
      tomorrowPlan: '明天减少机械刷题，增加 2 道讲解型题目。',
    },
  ],
  healthRecords: [
    { id: 'health-1', date: addDays(today, -60), heightCm: 149, weightKg: 40.8 },
    { id: 'health-2', date: addDays(today, -30), heightCm: 150.4, weightKg: 41.6 },
    { id: 'health-3', date: today, heightCm: 151.2, weightKg: 42.1 },
  ],
  workouts: [
    {
      id: 'workout-1',
      date: today,
      type: '跳绳',
      duration: 25,
      intensity: 'medium',
      note: '完成 5 组，每组 2 分钟。',
      points: 25,
    },
  ],
};

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateKey, diff) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + diff);
  return getDateKey(date);
}
