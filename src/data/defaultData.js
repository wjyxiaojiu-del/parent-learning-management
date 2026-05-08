const today = getDateKey(new Date());

export const defaultState = {
  settings: {
    childName: '小宇',
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
      completed: '数学口算完成一半，英语阅读进入状态较快。',
      mood: '整体稳定，晚上略疲惫。',
      problems: '数学应用题审题容易跳步骤。',
      tomorrowPlan: '明天减少机械刷题，增加 2 道讲解型题目。',
      parentNote: '表扬主动复述英语文章的表现。',
    },
  ],
};

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
