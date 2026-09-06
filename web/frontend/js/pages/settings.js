// 设置页 —— 移植自小程序 pages/settings（数据同步/导入导出适配网页）
import { definePage } from '../core/page.js';
import { escapeHtml as h, toast, prompt, alert } from '../core/ui.js';
import { createDefaultState } from '../lib/defaultData.js';
import { exportData, importData, clearAllData, syncNow } from '../core/store.js';
import { clearAuth, getUsername } from '../core/api.js';

export default definePage({
  data: {
    childName: '',
    age: 12,
    subjects: [],
    newSubject: '',
    username: '',
    syncStatusText: '已绑定账号',
    showDataPanel: false,
  },

  onRefresh(state) {
    const settings = state.settings || {};
    return {
      childName: settings.childName || '小宇',
      age: settings.age || 12,
      subjects: settings.subjects || [],
      username: getUsername(),
    };
  },

  template(d) {
    return `
    <div class="page page-settings">
      <div class="hero"><span class="eyebrow">SETTINGS</span><span class="title">设置</span></div>

      <div class="card">
        <span class="card-title">孩子信息</span>
        <div class="form">
          <div class="field"><span class="label">姓名</span>
            <input class="input" data-input="onInput" data-key="childName" data-focus-key="s-name" value="${h(d.childName)}" /></div>
          <div class="field"><span class="label">年龄</span>
            <input class="input" type="number" data-input="onInput" data-key="age" data-focus-key="s-age" value="${h(d.age)}" /></div>
          <button class="button" data-tap="saveSettings">保存</button>
        </div>
      </div>

      <div class="card">
        <span class="card-title">科目</span>
        <div class="subject-tags">
          ${d.subjects.map((item) => `<div class="subject-tag"><span>${h(item)}</span><span class="tag-x" data-tap="removeSubject" data-name="${h(item)}">×</span></div>`).join('')}
        </div>
        <div class="add-row" style="display:flex;gap:8px;margin-top:10px;">
          <input class="input" data-input="onInput" data-key="newSubject" data-confirm="addSubject" data-focus-key="s-subject" value="${h(d.newSubject)}" placeholder="新科目" />
          <button class="button" data-tap="addSubject" style="flex-shrink:0;">添加</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">数据同步</span><div class="sync-status success"><span>${h(d.syncStatusText)}</span></div></div>
        <button class="button" data-tap="syncToCloud">立即同步到服务器</button>
        <span class="hint-text hint-line">数据已绑定账号「${h(d.username)}」，每次修改都会自动保存到服务器，换设备登录同一账号即可继续。</span>
      </div>

      <div class="card">
        <div class="card-header" data-tap="toggleDataPanel">
          <span class="card-title">数据管理</span><span class="toggle-icon">${d.showDataPanel ? '▲' : '▼'}</span>
        </div>
        ${d.showDataPanel ? `
        <div class="data-panel">
          <div class="data-actions" style="display:flex;gap:8px;">
            <button class="button-light" data-tap="exportData" style="flex:1;">导出数据</button>
            <button class="button-light" data-tap="importData" style="flex:1;">导入数据</button>
          </div>
          <span class="hint-text hint-line">导出：复制到剪贴板并下载 JSON 备份文件</span>
          <span class="hint-text hint-line">导入：粘贴之前导出的 JSON（会覆盖当前数据）</span>
          <button class="button reset-btn" data-tap="resetData" style="margin-top:10px;background:linear-gradient(135deg,#94a3b8,#cbd5e1);">恢复默认数据</button>
          <button class="button reset-btn" data-tap="clearData" style="margin-top:10px;background:linear-gradient(135deg,#ef4444,#f87171);">清除所有数据</button>
        </div>` : ''}
      </div>

      <div class="card">
        <button class="button-light" data-tap="logout" style="width:100%;color:#ef4444;border-color:#fecaca;">退出登录</button>
      </div>
    </div>`;
  },

  addSubject() {
    const name = (this.data.newSubject || '').trim();
    if (!name) return;
    if (this.data.subjects.includes(name)) {
      toast('已存在');
      return;
    }
    const subjects = [...this.data.subjects, name];
    const state = { ...this.data._state, settings: { ...this.data._state.settings, subjects } };
    this.data.newSubject = '';
    this._saveAndRefresh(state, '已添加');
  },

  removeSubject(e) {
    const name = e.currentTarget.dataset.name;
    const subjects = this.data.subjects.filter((s) => s !== name);
    const state = { ...this.data._state, settings: { ...this.data._state.settings, subjects } };
    this._saveAndRefresh(state, '已删除');
  },

  saveSettings() {
    const state = {
      ...this.data._state,
      settings: {
        ...this.data._state.settings,
        childName: this.data.childName || '小宇',
        age: Number(this.data.age) || 12,
      },
    };
    this._saveAndRefresh(state, '已保存');
  },

  resetData() {
    this._confirm('恢复默认', '所有数据恢复默认，确定？').then((confirmed) => {
      if (!confirmed) return;
      this._saveAndRefresh(createDefaultState(), '已恢复默认');
    });
  },

  toggleDataPanel() {
    this.setData({ showDataPanel: !this.data.showDataPanel });
  },

  async syncToCloud() {
    try {
      await syncNow();
      toast('已同步', 'success');
    } catch (e) {
      toast('同步失败：' + e.message, 'error');
    }
  },

  async exportData() {
    const data = exportData();
    // 复制到剪贴板
    try {
      await navigator.clipboard.writeText(data);
      toast('已复制到剪贴板', 'success');
    } catch (e) {
      /* 剪贴板不可用则仅下载 */
    }
    // 下载备份文件
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `家长学习管理台-备份-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importData() {
    const text = await prompt('导入数据', '粘贴之前导出的 JSON 内容…');
    if (text == null) return;
    if (!text.trim()) return;
    const ok = importData(text);
    if (ok) {
      toast('导入成功', 'success');
      this.initPage();
    } else {
      alert('导入失败', '数据格式错误，请检查 JSON 是否完整');
    }
  },

  clearData() {
    this._confirm('清除数据', '确定清除所有数据？此操作不可恢复！').then((confirmed) => {
      if (!confirmed) return;
      this._confirm('再次确认', '真的要删除所有数据吗？').then((confirmed2) => {
        if (!confirmed2) return;
        clearAllData();
        toast('已清除', 'success');
        this.initPage();
      });
    });
  },

  logout() {
    this._confirm('退出登录', '确定退出当前账号？数据已保存在服务器，重新登录即可恢复。').then((confirmed) => {
      if (!confirmed) return;
      clearAuth();
      location.hash = '#/login';
    });
  },
});
