const { createBasePage } = require('../../utils/base-page');
const { getTodayKey } = require('../../utils/date');
const {
  uuid,
  updateStateList,
  deleteFromStateList,
  getTotalLearningPoints,
} = require('../../utils/data');

Page(createBasePage({
  data: {
    totalPoints: 0,
    rewards: [],
    redeemHistory: [],
    form: { title: '', cost: '' },
  },

  onRefresh(state) {
    const totalPoints = getTotalLearningPoints(state);
    const rewards = (state.rewardItems || []).map((r) => ({
      ...r,
      canRedeem: totalPoints >= r.cost,
    }));
    const redeemHistory = (state.pointLedger || []).filter((e) => e.points < 0);
    return { totalPoints, rewards, redeemHistory };
  },

  onTitleInput(event) {
    this.setData({ 'form.title': event.detail.value });
  },

  onCostInput(event) {
    this.setData({ 'form.cost': event.detail.value });
  },

  addReward() {
    const title = this.data.form.title.trim();
    const cost = Number(this.data.form.cost);
    if (!title || !cost) {
      wx.showToast({ title: '填写奖励名称和积分', icon: 'none' });
      return;
    }
    const reward = { id: uuid('reward'), title, cost };
    const state = updateStateList(this.data._state, 'rewardItems', reward);
    this.setData({ form: { title: '', cost: '' } });
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
}));
