const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// 获取当前用户的完整 state（新用户返回 null，由前端填充默认数据）
router.get('/', authRequired, (req, res) => {
  const row = db.prepare('SELECT state_json, updated_at FROM states WHERE user_id = ?').get(req.userId);
  if (!row) {
    return res.json({ state: null, updatedAt: 0 });
  }
  try {
    res.json({ state: JSON.parse(row.state_json), updatedAt: row.updated_at });
  } catch (e) {
    res.json({ state: null, updatedAt: 0 });
  }
});

// 保存（整份覆盖）当前用户的 state
router.put('/', authRequired, (req, res) => {
  const state = req.body.state;
  if (!state || typeof state !== 'object') {
    return res.status(400).json({ error: 'state 不合法' });
  }
  const json = JSON.stringify(state);
  const now = Date.now();
  db.prepare(
    `INSERT INTO states (user_id, state_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at`
  ).run(req.userId, json, now);

  res.json({ ok: true, updatedAt: now });
});

module.exports = router;
