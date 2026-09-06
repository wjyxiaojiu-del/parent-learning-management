const path = require('path');
const express = require('express');

const authRoutes = require('./routes/auth');
const stateRoutes = require('./routes/state');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/state', stateRoutes);

// 健康检查
app.get('/api/health', (req, res) => res.json({ ok: true }));

// 托管前端静态文件（单端口同时提供页面 + API）
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// SPA 兜底：非 /api 的路由统一回 index.html，交给前端 hash 路由
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`家长学习管理台 网页版已启动: http://localhost:${PORT}`);
});
