# 家长学习管理台 - 微信小程序云开发版

这是从桌面网页版转换出来的微信小程序 MVP，面向家长管理一个孩子的学习、复盘、身体健康、运动和积分奖励。

## 当前包含

- 微信登录入口
- 云开发初始化入口
- 今日日程
- 每日任务
- 固定课程
- 每日复盘
- 身体健康
- 积分奖励
- 我的/设置
- 云环境未配置时自动使用本地缓存，方便先预览界面

## 打开方式

1. 打开微信开发者工具。
2. 导入本文件夹：`家长学习管理台-微信小程序`。
3. AppID 可以先用测试号，也可以换成你自己的小程序 AppID。
4. 开通云开发后，把 `miniprogram/app.js` 里的 `cloudEnvId` 替换成你的云开发环境 ID。
5. 在开发者工具里上传并部署 `cloudfunctions/login` 云函数。

## 云数据库集合

第一版使用一个集合保存家长数据：

```text
parent_learning_states
```

每个微信用户一条记录，结构大致为：

```js
{
  _openid: "微信 openid",
  state: {
    settings,
    tasks,
    recurringCourses,
    reviews,
    healthRecords,
    workouts,
    rewardItems,
    pointLedger
  },
  updatedAt
}
```

## 说明

现在服务器和域名没备案也能继续做，因为微信云开发不依赖你自己的备案域名。等后续服务器和域名准备好，可以把数据层迁到自有 API。
