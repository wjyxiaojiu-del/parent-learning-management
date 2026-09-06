// 奖励兑换页 —— 移植自小程序 pages/reward-exchange
import { definePage } from '../core/page.js';
import { escapeHtml as h, toast } from '../core/ui.js';
import { getTodayKey } from '../lib/date.js';
import { uuid, updateStateList, deleteFromStateList, getTotalLearningPoints } from '../lib/data.js';

export default definePage({
  data: {
    totalPoints: 0,
    rewards: [],
    redeemHistory: [],
    form: { title: '', cost: '' },
  },

  onRefresh(state) {
    const totalPoints = getTotalLearningPoints(state);
    const rewards = (state.rewardItems || []).map((r) => ({ ...r, canRedeem: totalPoints >= r.cost }));
    const redeemHistory = (state.pointLedger || []).filter((e) => e.points < 0);
    return { totalPoints, rewards, redeemHistory };
  },

  template(d) {
    const rewardsHtml = d.rewards.length
      ? `<div class="card">
          <span class="card-title">奖励列表</span>
          ${d.rewards.map((item) => `
            <div class="row">
              <div class="row-main"><span class="row-title">${h(item.title)}</span><span class="row-sub">${item.cost} 积分</span></div>
              <div class="reward-btns">
                <button class="${item.canRedeem ? 'button-light' : 'btn-grey'}" data-tap="redeem" data-id="${item.id}" ${item.canRedeem ? '' : 'disabled'}>兑换</button>
                <span class="del-btn" data-tap="deleteReward" data-id="${item.id}">×</span>
              </div>
            </div>`).join('')}
        </div>`
      : `<div class="empty"><span class="empty-icon">🎁</span><span>还没有奖励，添加一个吧</span></div>`;

    const historyHtml = d.redeemHistory.length
      ? `<div class="card">
          <span class="card-title">兑换记录</span>
          ${d.redeemHistory.map((item) => `
            <div class="row"><div class="row-main"><span class="row-title">${h(item.reason)}</span><span class="row-sub">${item.date} · ${item.points}积分</span></div></div>`).join('')}
        </div>`
      : '';

    return `
    <div class="page page-reward-exchange">
      <div class="hero">
        <span class="eyebrow">REWARDS</span>
        <span class="title">奖励兑换</span>
        <span class="subtitle">当前积分 ${d.totalPoints}</span>
      </div>

      <div class="card">
        <span class="card-title">添加奖励</span>
        <div class="form">
          <div class="field"><span class="label">奖励名称</span>
            <input class="input" data-input="onTitleInput" data-focus-key="re-title" value="${h(d.form.title)}" placeholder="例如：周末自由阅读" /></div>
          <div class="field"><span class="label">所需积分</span>
            <input class="input" type="number" inputmode="numeric" data-input="onCostInput" data-focus-key="re-cost" value="${h(d.form.cost)}" placeholder="20" /></div>
          <button class="button" data-tap="addReward">添加</button>
        </div>
      </div>

      ${rewardsHtml}
      ${historyHtml}
    </div>`;
  },

  onTitleInput(event) {
    this.setData({ 'form.title': event.detail.value }, false);
  },

  onCostInput(event) {
    this.setData({ 'form.cost': event.detail.value }, false);
  },

  addReward() {
    const title = (this.data.form.title || '').trim();
    const cost = Number(this.data.form.cost);
    if (!title || !cost) {
      toast('填写奖励名称和积分');
      return;
    }
    const reward = { id: uuid('reward'), title, cost };
    const state = updateStateList(this.data._state, 'rewardItems', reward);
    this.setData({ form: { title: '', cost: '' } }, false);
    this._saveAndRefresh(state, '已添加');
  },

  redeem(event) {
    const id = event.currentTarget.dataset.id;
    const reward = this.data.rewards.find((r) => r.id === id);
    if (!reward || !reward.canRedeem) return;
    this._confirm('兑换', `用 ${reward.cost} 积分兑换「${reward.title}」？`).then((confirmed) => {
      if (!confirmed) return;
      const entry = { id: uuid('redeem'), points: -reward.cost, reason: reward.title, date: getTodayKey() };
      const state = updateStateList(this.data._state, 'pointLedger', entry);
      this._saveAndRefresh(state, '兑换成功');
    });
  },

  deleteReward(event) {
    const id = event.currentTarget.dataset.id;
    this._confirm('删除', '删除这个奖励？').then((confirmed) => {
      if (!confirmed) return;
      const state = deleteFromStateList(this.data._state, 'rewardItems', id);
      this._saveAndRefresh(state, '已删除');
    });
  },
});
