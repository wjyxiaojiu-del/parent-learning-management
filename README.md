# 家长学习管理台 - 微信小程序云开发版

这是从桌面网页版转换出来的微信小程序 MVP，面向家长管理一个孩子的学习、复盘、身体健康、运动和积分奖励。

## 功能特性

### 核心功能
- 今日日程和任务管理
- 固定课程安排
- 每日复盘记录
- 身高体重记录（含趋势图表）
- 运动打卡
- 积分奖励系统

### 新增功能
- 下拉刷新支持
- 任务快捷添加（预设模板）
- 任务排序（按科目/状态）
- 批量完成任务
- 连续打卡天数统计
- 本周学习统计
- 成就徽章系统
- 数据云端同步
- 数据导出/导入

## 打开方式

1. 打开微信开发者工具。
2. 导入本文件夹：`家长学习管理台-微信小程序`。
3. AppID 可以先用测试号，也可以换成你自己的小程序 AppID。
4. 开通云开发后，把 `miniprogram/app.js` 里的 `cloudEnvId` 替换成你的云开发环境 ID。
5. 在开发者工具里上传并部署 `cloudfunctions/login` 和 `cloudfunctions/sync` 云函数。

## 云开发配置

详见 [云开发配置说明.md](云开发配置说明.md)

### 快速配置

1. 开通云开发，获取环境 ID
2. 修改 `miniprogram/app.js` 中的 `cloudEnvId`
3. 创建数据库集合 `parent_learning_states`
4. 部署云函数 `login` 和 `sync`

## 云数据库集合

使用一个集合保存家长数据：

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
  createdAt,
  updatedAt
}
```

## 项目结构

```
├── cloudfunctions/
│   ├── login/          # 登录云函数
│   └── sync/           # 数据同步云函数
├── miniprogram/
│   ├── app.js          # 应用入口
│   ├── app.json        # 应用配置
│   ├── app.wxss        # 全局样式
│   ├── assets/         # 图标资源
│   ├── pages/
│   │   ├── today/      # 今日页面
│   │   ├── records/    # 记录页面
│   │   ├── profile/    # 我的页面
│   │   ├── settings/   # 设置页面
│   │   ├── workout/    # 运动打卡
│   │   ├── health-growth/  # 身高体重
│   │   ├── reward-exchange/ # 奖励兑换
│   │   ├── course-manage/   # 课程管理
│   │   └── review-detail/   # 复盘详情
│   └── utils/
│       ├── base-page.js    # 页面基类
│       ├── data.js         # 数据处理
│       ├── date.js         # 日期工具
│       ├── defaultData.js  # 默认数据
│       └── store.js        # 数据存储
└── 云开发配置说明.md
```

## 技术特点

- **本地优先**：无网络也能正常使用
- **云端同步**：配置云开发后自动同步
- **数据安全**：本地 + 云端双重备份
- **响应式设计**：适配各种屏幕尺寸
- **流畅动画**：丰富的交互动画效果

## 更新日志

### v1.1.0
- 新增下拉刷新功能
- 新增任务快捷添加（预设模板）
- 新增任务排序功能
- 新增批量完成任务
- 新增连续打卡天数统计
- 新增本周学习统计
- 新增成就徽章系统
- 新增数据云端同步
- 新增数据导出/导入功能
- 优化身高体重页面（新增趋势图表）
- 优化我的页面（新增统计和成就）
- 优化设置页面（新增数据管理）
- 修复 onInput 方法缺失问题

### v1.0.0
- 初始版本发布
- 基础功能完整实现

## 说明

现在服务器和域名没备案也能继续做，因为微信云开发不依赖你自己的备案域名。等后续服务器和域名准备好，可以把数据层迁到自有 API。
