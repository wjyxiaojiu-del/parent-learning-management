// UI 工具 —— 对应小程序的 wx.showToast / wx.showModal / wx.vibrateShort
// 提供 toast / confirm / alert / vibrate / escapeHtml

let toastTimer = null;

export function toast(title, type = 'none') {
  let el = document.getElementById('pl-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pl-toast';
    el.className = 'pl-toast';
    document.body.appendChild(el);
  }
  const icon = type === 'success' ? '✓ ' : type === 'error' ? '✕ ' : '';
  el.textContent = icon + title;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
}

// 自定义弹窗（确认 / 提示）
function buildModal({ title, content, showCancel = true, confirmText = '确定', cancelText = '取消' }) {
  return new Promise((resolve) => {
    const mask = document.createElement('div');
    mask.className = 'pl-modal-mask';
    mask.innerHTML = `
      <div class="pl-modal">
        ${title ? `<div class="pl-modal-title">${escapeHtml(title)}</div>` : ''}
        ${content ? `<div class="pl-modal-content">${escapeHtml(content)}</div>` : ''}
        <div class="pl-modal-actions">
          ${showCancel ? `<button class="pl-modal-btn cancel">${escapeHtml(cancelText)}</button>` : ''}
          <button class="pl-modal-btn confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(mask);

    const close = (result) => {
      mask.remove();
      resolve(result);
    };
    mask.querySelector('.confirm').addEventListener('click', () => close(true));
    const cancelBtn = mask.querySelector('.cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', () => close(false));
    mask.addEventListener('click', (e) => {
      if (e.target === mask) close(false);
    });
  });
}

export function confirm(title, content) {
  return buildModal({ title, content, showCancel: true });
}

export function alert(title, content) {
  return buildModal({ title, content, showCancel: false });
}

// 输入弹窗：返回字符串或 null（取消）
export function prompt(title, placeholder = '', defaultValue = '') {
  return new Promise((resolve) => {
    const mask = document.createElement('div');
    mask.className = 'pl-modal-mask';
    mask.innerHTML = `
      <div class="pl-modal">
        <div class="pl-modal-title">${escapeHtml(title)}</div>
        <textarea class="pl-modal-input" placeholder="${escapeHtml(placeholder)}">${escapeHtml(defaultValue)}</textarea>
        <div class="pl-modal-actions">
          <button class="pl-modal-btn cancel">取消</button>
          <button class="pl-modal-btn confirm">确定</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
    const input = mask.querySelector('.pl-modal-input');
    input.focus();
    const close = (result) => { mask.remove(); resolve(result); };
    mask.querySelector('.confirm').addEventListener('click', () => close(input.value));
    mask.querySelector('.cancel').addEventListener('click', () => close(null));
    mask.addEventListener('click', (e) => { if (e.target === mask) close(null); });
  });
}

export function vibrate(type = 'light') {
  if (navigator.vibrate) {
    navigator.vibrate(type === 'medium' ? 20 : type === 'heavy' ? 30 : 10);
  }
}

// HTML 转义，防止用户输入破坏模板/XSS
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
