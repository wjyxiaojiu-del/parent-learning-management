const { createBasePage } = require('../../utils/base-page');
const { getTotalLearningPoints } = require('../../utils/data');

Page(createBasePage({
  data: {
    totalPoints: 0,
    childName: '',
  },

  onRefresh(state) {
    return {
      totalPoints: getTotalLearningPoints(state),
      childName: state.settings.childName || '小宇',
    };
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },
}));
