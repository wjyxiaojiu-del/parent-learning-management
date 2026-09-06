// 固定课程页 —— 移植自小程序 pages/course-manage（picker 改原生 select / time input）
import { definePage } from '../core/page.js';
import { escapeHtml as h, toast } from '../core/ui.js';
import { uuid, updateStateList, deleteFromStateList } from '../lib/data.js';

const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default definePage({
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
      'form.subject': this.data.form.subject || subjects[0] || '数学',
    };
  },

  template(d) {
    const coursesHtml = d.courses.length
      ? `<div class="card">
          <span class="card-title">课程列表（${d.courses.length}）</span>
          ${d.courses.map((item) => `
            <div class="row">
              <div class="row-main"><span class="row-title">${h(item.title)}</span><span class="row-sub">${h(item.weekday)} ${h(item.startTime)}-${h(item.endTime)} · ${h(item.subject)}</span></div>
              <span class="del-btn" data-tap="deleteCourse" data-id="${item.id}">×</span>
            </div>`).join('')}
        </div>`
      : `<div class="empty"><span class="empty-icon">📚</span><span>还没有课程</span></div>`;

    return `
    <div class="page page-course-manage">
      <div class="hero">
        <span class="eyebrow">COURSES</span>
        <span class="title">固定课程</span>
        <span class="subtitle">每周固定的学习安排</span>
      </div>

      <div class="card">
        <span class="card-title">添加课程</span>
        <div class="form">
          <div class="field"><span class="label">课程名称</span>
            <input class="input" data-input="onTitleInput" data-focus-key="cm-title" value="${h(d.form.title)}" placeholder="例如：数学思维课" /></div>
          <div class="field"><span class="label">科目</span>
            <select class="picker" data-change="onSubjectChange">
              ${d.subjects.map((s) => `<option value="${h(s)}" ${s === d.form.subject ? 'selected' : ''}>${h(s)}</option>`).join('')}
            </select></div>
          <div class="field"><span class="label">星期</span>
            <select class="picker" data-change="onWeekdayChange">
              ${d.weekdays.map((w) => `<option value="${w}" ${w === d.form.weekday ? 'selected' : ''}>${w}</option>`).join('')}
            </select></div>
          <div class="field"><span class="label">开始时间</span>
            <input class="picker" type="time" data-change="onStartTimeChange" value="${h(d.form.startTime)}" /></div>
          <div class="field"><span class="label">结束时间</span>
            <input class="picker" type="time" data-change="onEndTimeChange" value="${h(d.form.endTime)}" /></div>
          <button class="button" data-tap="addCourse">添加</button>
        </div>
      </div>

      ${coursesHtml}
    </div>`;
  },

  onTitleInput(event) {
    this.setData({ 'form.title': event.detail.value }, false);
  },
  onSubjectChange(event) {
    this.setData({ 'form.subject': event.detail.value }, false);
  },
  onWeekdayChange(event) {
    this.setData({ 'form.weekday': event.detail.value }, false);
  },
  onStartTimeChange(event) {
    this.setData({ 'form.startTime': event.detail.value }, false);
  },
  onEndTimeChange(event) {
    this.setData({ 'form.endTime': event.detail.value }, false);
  },

  addCourse() {
    if (!this.data.form.title.trim()) {
      toast('填写课程名称');
      return;
    }
    const course = { id: uuid('course'), ...this.data.form };
    const state = updateStateList(this.data._state, 'recurringCourses', course);
    this.setData({
      form: { title: '', subject: this.data.subjects[0] || '数学', weekday: '周一', startTime: '19:00', endTime: '20:30' },
    }, false);
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
});
