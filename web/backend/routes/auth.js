const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken } = require('../middleware/auth');

const router = express.Router();

function validateCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') return '参数错误';
  if (username.trim().length < 2) return '用户名至少 2 个字符';
  if (password.length < 6) return '密码至少 6 位';
  return null;
}

// 注册
router.post('/register', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  const err = validateCredentials(username, password);
  if (err) return res.status(400).json({ error: err });

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: '用户名已被占用' });

  const hash = bcrypt.hashSync(password, 10);
  const now = Date.now();
  const info = db
    .prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)')
    .run(username, hash, now);

  const token = signToken({ uid: info.lastInsertRowid, username });
  res.json({ token, username });
});

// 登录
router.post('/login', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = signToken({ uid: user.id, username: user.username });
  res.json({ token, username: user.username });
});

module.exports = router;
