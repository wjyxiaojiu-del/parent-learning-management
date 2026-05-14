const { createBasePage } = require('../../utils/base-page');
const {
  uuid,
  updateStateList,
  deleteFromStateList,
} = require('../../utils/data');

const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

Page(createBasePage({
  data: {
    weekdays,
    subjects: [],
    courses: [],
    form: { title: '', subject: '数学', weekday: '周一', startTime: '19:00', endTime: '20:30' },
  },

  onRefresh(state) {
    const subjects = state.settings.subjects || [];
    const courses = [...(state.recurringCourses || [])];
    return {
      subjects,
      courses,
      'form.subject': subjects[0] || '数学',
    };
  },

  onTitleInput(event) {
    this.setData({ 'form.title': event.detail.value });
  },

  onSubjectChange(event) {
    this.setData({ 'form.subject': this.data.subjects[event.detail.value] });
  },

  onWeekdayChange(event) {
    this.setData({ 'form.weekday': weekdays[event.detail.value] });
  },

  onStartTimeChange(event) {
    this.setData({ 'form.startTime': event.detail.value });
  },

  onEndTimeChange(event) {
    this.setData({ 'form.endTime': event.detail.value });
  },

  addCourse() {
    if (!this.data.form.title.trim()) {
      wx.showToast({ title: '填写课程名称', icon: 'none' });
      return;
    }
    const course = {
      id: uuid('course'),
      ...this.data.form,
    };
    const state = updateStateList(this.data._state, 'recurringCourses', course);
    this.setData({
      form: { title: '', subject: this.data.subjects[0] || '数学', weekday: '周一', startTime: '19:00', endTime: '20:30' },
    });
    this._saveAndRefresh(state, '已添加');
  },

  deleteCourse(event) {
    const id = event.currentTarget.dataset.id;
    this._confirm('删除', '删除这个课程？').then((confirmed) => {
      if (!confirmed) return;
      const state = deleteFromStateList(this.data._state, 'recurringCourses', id);
      this._saveAndRefresh(state, '已删除');
    });
  },
}));
