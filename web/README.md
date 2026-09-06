# 家长学习管理台 · 网页版

由微信小程序版转换而来的全栈网页应用，面向家长管理孩子的学习、复盘、身高体重、运动和积分奖励。

- **前端**：原生 HTML / CSS / ES Module，无需构建工具，哈希路由单页应用
- **后端**：Node.js + Express + SQLite（单文件数据库）
- **登录**：账号密码（bcrypt 加密 + JWT），每个家长一个账号、数据隔离
- **部署**：Express 同时托管前端静态页面和 API，**一个端口、`node server.js` 即可运行**

业务逻辑（`frontend/js/lib/` 下的 `data.js` / `date.js` / `defaultData.js`）直接复用自小程序，未改动算法。

---

## 一、本地运行

需要 Node.js 18+（推荐 20+）。

```bash
cd web/backend
npm install          # 安装依赖（含原生模块 better-sqlite3）
npm start            # 启动，默认 http://localhost:3000
```

浏览器打开 `http://localhost:3000`，首次使用点「注册」创建账号即可。

数据保存在 `web/backend/data.db`（SQLite 文件，已被 .gitignore 忽略）。

---

## 二、目录结构

```
web/
├── backend/                 # Express + SQLite 后端
│   ├── server.js            # 入口：托管前端静态文件 + 挂载 API
│   ├── db.js                # SQLite 初始化（users / states 两张表）
│   ├── middleware/auth.js   # JWT 签发与校验
│   ├── routes/
│   │   ├── auth.js          # 注册 / 登录
│   │   └── state.js         # 获取 / 保存当前用户的整份 state
│   ├── test/                # 无头测试（jsdom）
│   └── package.json
├── frontend/                # 纯静态前端
│   ├── index.html           # 外壳：手机框 + 顶部栏 + 底部 Tab
│   ├── css/
│   │   ├── global.css       # 全局组件样式（由小程序 app.wxss 转换）
│   │   └── pages.css        # 各页面样式（自动生成，勿手改）
│   └── js/
│       ├── lib/             # 复用自小程序的纯逻辑层
│       ├── core/            # 框架层：api / store / ui / page / router
│       ├── pages/           # 9 个页面 + 登录页
│       └── app.js           # 注册路由并启动
└── tools/
    └── convert-wxss.js      # 一次性脚本：把小程序 .wxss 转成 pages.css
```

数据模型：每个用户一条记录，整份 `state`（settings / tasks / recurringCourses / reviews / healthRecords / workouts / rewardItems / pointLedger）以 JSON 存储，与小程序完全一致。

---

## 三、部署到阿里云 ECS（47.114.72.251）

### 1. 安装 Node（若服务器尚未安装）

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs          # CentOS/Alibaba Cloud Linux
# Ubuntu/Debian 用： sudo apt install -y nodejs
```

### 2. 上传代码并安装依赖

```bash
# 本机：把 web 目录传到服务器（data.db、node_modules 不用传）
scp -r web root@47.114.72.251:/var/parent-learning-web

# 服务器：
cd /var/parent-learning-web/backend
npm install --production
```

### 3. 设置生产环境密钥（重要）

JWT 密钥默认值仅用于开发，生产务必通过环境变量覆盖：

```bash
export JWT_SECRET="换成一段足够长的随机字符串"
export PORT=3000           # 可选，默认 3000
```

### 4. 用 pm2 常驻运行

```bash
sudo npm install -g pm2
cd /var/parent-learning-web/backend
JWT_SECRET="你的密钥" pm2 start server.js --name parent-learning
pm2 save                    # 保存进程列表
pm2 startup                 # 生成开机自启脚本（按提示执行输出的命令）
```

此时 `http://47.114.72.251:3000` 已可访问。

### 5. （推荐）用 Nginx 反代到 80/443

```nginx
server {
    listen 80;
    server_name your-domain.com;   # 或直接用 IP

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

如需 HTTPS，用 `certbot --nginx` 申请免费证书即可。注意在阿里云安全组放行对应端口。

---

## 四、数据备份与迁移

- **整库备份**：直接复制 `backend/data.db`（含全部用户）。
- **单账号导出**：登录后进入「我的 → 设置 → 数据管理 → 导出数据」，会复制到剪贴板并下载一份 JSON 备份。
- **导入**：同一面板「导入数据」，粘贴之前导出的 JSON（会覆盖当前账号数据）。

---

## 五、开发测试

无头测试基于 jsdom，验证 9 个页面渲染、交互闭环、前后端往返：

```bash
cd web/backend
npm install                 # 含 devDependency: jsdom
npm test                    # 渲染 + 交互测试
npm run test:integration    # 前后端联调（需先 npm start 启动服务）
```

修改了小程序端样式后，重新生成页面 CSS：

```bash
node web/tools/convert-wxss.js
```

---

## 与小程序版的差异

| 能力 | 小程序版 | 网页版 |
|---|---|---|
| 数据存储 | 本地 + 微信云开发 | SQLite（账号隔离）|
| 登录 | 微信 openid | 账号密码 + JWT |
| 弹窗 / Toast | wx API | 自定义组件 |
| 选择器 | picker | 原生 select / date / time |
| 导出导入 | 剪贴板 | 剪贴板 + JSON 文件下载 |
| 退出登录 | 无 | 设置页支持 |

功能与交互逻辑与小程序保持一致。
