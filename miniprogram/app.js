const { loadLocalState, saveLocalState } = require('./utils/store');

App({
  globalData: {
    state: null,
    userInfo: null,
    cloudReady: false,
    syncStatus: 'idle', // idle, syncing, success, error
  },

  onLaunch() {
    // 加载本地数据
    this.globalData.state = loadLocalState();

    // 初始化云开发
    this.initCloud();
  },

  initCloud() {
    if (!wx.cloud) {
      console.warn('当前环境不支持云开发');
      return;
    }

    // 请替换为你的云开发环境 ID
    const cloudEnvId = 'your-cloud-env-id';

    if (cloudEnvId === 'your-cloud-env-id') {
      console.log('云开发环境未配置，使用本地存储模式');
      return;
    }

    wx.cloud.init({
      env: cloudEnvId,
      traceUser: true,
    });

    this.globalData.cloudReady = true;

    // 自动同步数据
    this.autoSync();
  },

  async autoSync() {
    if (!this.globalData.cloudReady) return;

    try {
      this.globalData.syncStatus = 'syncing';

      // 获取云端数据
      const db = wx.cloud.database();
      const res = await db.collection('parent_learning_states')
        .where({
          _openid: '{openid}', // 云开发会自动替换
        })
        .get();

      if (res.data.length > 0) {
        const cloudState = res.data[0].state;
        const localState = this.globalData.state;

        // 简单合并策略：取更新时间较新的
        if (cloudState && this._isNewer(cloudState, localState)) {
          this.globalData.state = cloudState;
          saveLocalState(cloudState);
          console.log('从云端恢复数据');
        } else {
          // 本地数据较新，上传到云端
          await this.uploadToCloud(localState);
          console.log('本地数据已同步到云端');
        }
      } else {
        // 云端无数据，上传本地数据
        await this.uploadToCloud(this.globalData.state);
        console.log('首次同步数据到云端');
      }

      this.globalData.syncStatus = 'success';
    } catch (err) {
      console.error('自动同步失败:', err);
      this.globalData.syncStatus = 'error';
    }
  },

  _isNewer(state1, state2) {
    const time1 = state1.updatedAt || 0;
    const time2 = state2.updatedAt || 0;
    return time1 > time2;
  },

  async uploadToCloud(state) {
    if (!this.globalData.cloudReady) return;

    try {
      const db = wx.cloud.database();
      const dataToUpload = {
        ...state,
        updatedAt: Date.now(),
      };

      // 检查是否已有记录
      const res = await db.collection('parent_learning_states')
        .where({
          _openid: '{openid}',
        })
        .get();

      if (res.data.length > 0) {
        // 更新已有记录
        await db.collection('parent_learning_states')
          .doc(res.data[0]._id)
          .update({
            data: {
              state: dataToUpload,
              updatedAt: db.serverDate(),
            },
          });
      } else {
        // 创建新记录
        await db.collection('parent_learning_states')
          .add({
            data: {
              state: dataToUpload,
              createdAt: db.serverDate(),
              updatedAt: db.serverDate(),
            },
          });
      }
    } catch (err) {
      console.error('上传数据失败:', err);
      throw err;
    }
  },

  // 手动同步
  async manualSync() {
    if (!this.globalData.cloudReady) {
      wx.showToast({
        title: '云开发未配置',
        icon: 'none',
      });
      return false;
    }

    try {
      await this.uploadToCloud(this.globalData.state);
      wx.showToast({
        title: '同步成功',
        icon: 'success',
      });
      return true;
    } catch (err) {
      wx.showToast({
        title: '同步失败',
        icon: 'none',
      });
      return false;
    }
  },
});
