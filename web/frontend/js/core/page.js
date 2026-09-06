// 页面基类工厂 —— 对应小程序 utils/base-page.js
// 把 DOM 事件包装成小程序风格 (event.currentTarget.dataset / event.detail.value)，
// 使各页面方法能最大程度照搬小程序原代码。
import { getReadyState, saveState } from './store.js';
import { toast, confirm, vibrate } from './ui.js';

function clone(obj) {
  try {
    return structuredClone(obj);
  } catch (e) {
    return JSON.parse(JSON.stringify(obj));
  }
}

const RESERVED = ['data', 'onRefresh', 'template'];

const core = {
  mount(root) {
    this.root = root;
    this._bindEvents();
    this.initPage();
  },

  // 对应小程序 onShow -> initPage
  initPage() {
    const state = getReadyState();
    this.data._state = state;
    if (this._options.onRefresh) {
      const patch = this._options.onRefresh.call(this, state);
      if (patch) this._assign(patch);
    }
    this.render();
  },

  render() {
    if (!this.root) return;
    // 重渲染前记录焦点与光标，渲染后恢复（避免输入时丢焦点）
    const active = document.activeElement;
    const inRoot = active && this.root.contains(active);
    const focusKey = inRoot ? active.getAttribute('data-focus-key') : null;
    const selStart = focusKey && active.selectionStart != null ? active.selectionStart : null;
    const selEnd = focusKey && active.selectionEnd != null ? active.selectionEnd : null;

    this.root.innerHTML = this._options.template.call(this, this.data);

    if (focusKey) {
      const el = this.root.querySelector(`[data-focus-key="${focusKey}"]`);
      if (el) {
        el.focus();
        if (selStart != null) {
          try { el.setSelectionRange(selStart, selEnd); } catch (e) { /* 非文本框忽略 */ }
        }
      }
    }
  },

  // 对应小程序 setData（支持 'a.b' 点路径）
  setData(patch, render = true) {
    this._assign(patch);
    if (render) this.render();
  },

  _assign(patch) {
    Object.keys(patch).forEach((key) => {
      if (key.indexOf('.') !== -1) {
        const parts = key.split('.');
        let obj = this.data;
        for (let i = 0; i < parts.length - 1; i++) {
          if (obj[parts[i]] == null || typeof obj[parts[i]] !== 'object') obj[parts[i]] = {};
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = patch[key];
      } else {
        this.data[key] = patch[key];
      }
    });
  },

  _bindEvents() {
    if (this._bound) return;
    this._bound = true;
    const root = this.root;
    const self = this;

    const dispatch = (attr, e, withValue) => {
      const el = e.target.closest(`[data-${attr}]`);
      if (!el || !root.contains(el)) return;
      const method = el.getAttribute(`data-${attr}`);
      if (typeof self[method] !== 'function') return;
      const ev = {
        currentTarget: { dataset: { ...el.dataset } },
        target: el,
        detail: { value: withValue ? el.value : undefined },
      };
      self[method].call(self, ev);
    };

    root.addEventListener('click', (e) => dispatch('tap', e, false));
    root.addEventListener('input', (e) => dispatch('input', e, true));
    root.addEventListener('change', (e) => dispatch('change', e, true));
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const el = e.target.closest('[data-confirm]');
      if (!el || !root.contains(el)) return;
      if (el.tagName === 'TEXTAREA' && !(e.metaKey || e.ctrlKey)) return; // 多行框需 Ctrl/Cmd+Enter
      e.preventDefault();
      const method = el.getAttribute('data-confirm');
      if (typeof self[method] === 'function') {
        self[method].call(self, {
          currentTarget: { dataset: { ...el.dataset } },
          target: el,
          detail: { value: el.value },
        });
      }
    });
  },

  // 对应 base-page 的通用辅助
  _saveAndRefresh(state, msg) {
    saveState(state);
    if (msg) toast(msg, 'success');
    this.initPage();
  },
  _confirm(title, content) { return confirm(title, content); },
  _vibrate(type) { vibrate(type); },
  navigate(hash) { location.hash = hash; },

  // 通用输入处理（对应 base-page，修正为支持仅 data-key）
  onInput(event) {
    const { form, key } = event.currentTarget.dataset;
    if (form && key) this.setData({ [`${form}.${key}`]: event.detail.value }, false);
    else if (key) this.setData({ [key]: event.detail.value }, false);
  },
  onTextInput(event) {
    const key = event.currentTarget.dataset.key;
    if (key) this.setData({ [key]: event.detail.value }, false);
  },
};

export function definePage(options) {
  return function createInstance(routeParams) {
    const page = {
      _options: options,
      data: { _state: null, _loading: true, ...clone(options.data || {}) },
      routeParams: routeParams || {},
      root: null,
      _bound: false,
    };
    Object.assign(page, core);
    Object.keys(options).forEach((key) => {
      if (RESERVED.indexOf(key) === -1 && typeof options[key] === 'function') {
        page[key] = options[key];
      }
    });
    return page;
  };
}
