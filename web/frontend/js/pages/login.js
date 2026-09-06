// 登录 / 注册页（前置于鉴权，不走 definePage 状态模型）
import { apiFetch, setAuth } from '../core/api.js';
import { loadState } from '../core/store.js';
import { escapeHtml } from '../core/ui.js';

export function createLoginPage() {
  return {
    mode: 'login', // login | register
    root: null,

    mount(root) {
      this.root = root;
      this.render();
    },

    template() {
      const isLogin = this.mode === 'login';
      return `
        <div class="login-wrap">
          <div class="login-logo">📚</div>
          <div class="login-title">家长学习管理台</div>
          <div class="login-sub">陪孩子把每天的学习管起来</div>
          <div class="login-card">
            <div class="login-tabs">
              <div class="login-tab ${isLogin ? 'active' : ''}" data-mode="login">登录</div>
              <div class="login-tab ${!isLogin ? 'active' : ''}" data-mode="register">注册</div>
            </div>
            <div class="form">
              <div class="field">
                <label class="label">用户名</label>
                <input class="input" id="login-username" placeholder="请输入用户名" autocomplete="username" />
              </div>
              <div class="field">
                <label class="label">密码</label>
                <input class="input" id="login-password" type="password" placeholder="${isLogin ? '请输入密码' : '至少 6 位'}" autocomplete="${isLogin ? 'current-password' : 'new-password'}" />
              </div>
            </div>
            <div class="login-error" id="login-error"></div>
            <button class="button login-submit" id="login-submit">${isLogin ? '登录' : '注册并进入'}</button>
          </div>
        </div>`;
    },

    render() {
      this.root.innerHTML = this.template();
      this.root.querySelectorAll('.login-tab').forEach((el) => {
        el.addEventListener('click', () => {
          this.mode = el.getAttribute('data-mode');
          this.render();
        });
      });
      const submit = () => this.submit();
      this.root.querySelector('#login-submit').addEventListener('click', submit);
      this.root.querySelector('#login-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
      });
    },

    async submit() {
      const username = this.root.querySelector('#login-username').value.trim();
      const password = this.root.querySelector('#login-password').value;
      const errEl = this.root.querySelector('#login-error');
      const btn = this.root.querySelector('#login-submit');
      errEl.textContent = '';

      if (!username || !password) {
        errEl.textContent = '请输入用户名和密码';
        return;
      }

      btn.disabled = true;
      btn.textContent = '请稍候...';
      try {
        const path = this.mode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const res = await apiFetch(path, { method: 'POST', body: { username, password } });
        setAuth(res.token, res.username);
        await loadState();
        location.hash = '#/today';
      } catch (e) {
        errEl.textContent = e.message || '操作失败';
        btn.disabled = false;
        btn.textContent = this.mode === 'login' ? '登录' : '注册并进入';
      }
    },
  };
}
