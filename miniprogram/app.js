const { loadLocalState } = require('./utils/store');

App({
  globalData: {
    state: null,
  },

  onLaunch() {
    this.globalData.state = loadLocalState();
  },
});
