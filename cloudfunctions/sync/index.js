const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const collection = db.collection('parent_learning_states');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, state } = event;

  try {
    switch (action) {
      case 'get':
        return await getData(openid);
      case 'save':
        return await saveData(openid, state);
      case 'merge':
        return await mergeData(openid, state);
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (err) {
    console.error('云函数执行错误:', err);
    return { success: false, error: err.message };
  }
};

async function getData(openid) {
  const res = await collection.where({ _openid: openid }).get();

  if (res.data.length > 0) {
    return {
      success: true,
      data: res.data[0].state,
      docId: res.data[0]._id,
    };
  }

  return { success: true, data: null };
}

async function saveData(openid, state) {
  const existing = await collection.where({ _openid: openid }).get();
  const timestamp = db.serverDate();

  if (existing.data.length > 0) {
    await collection.doc(existing.data[0]._id).update({
      data: {
        state,
        updatedAt: timestamp,
      },
    });
  } else {
    await collection.add({
      data: {
        _openid: openid,
        state,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });
  }

  return { success: true };
}

async function mergeData(openid, localState) {
  const existing = await collection.where({ _openid: openid }).get();

  if (existing.data.length === 0) {
    // 云端无数据，直接保存本地数据
    return await saveData(openid, localState);
  }

  const cloudState = existing.data[0].state;
  const cloudTime = existing.data[0].updatedAt ? existing.data[0].updatedAt.getTime() : 0;
  const localTime = localState.updatedAt || 0;

  // 比较时间戳，取较新的数据
  if (localTime > cloudTime) {
    await saveData(openid, localState);
    return { success: true, merged: 'local' };
  } else {
    return { success: true, data: cloudState, merged: 'cloud' };
  }
}
