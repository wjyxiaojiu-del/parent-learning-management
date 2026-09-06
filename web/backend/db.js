const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// 数据库文件放在 backend 目录下，部署时随项目走
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');

// 确保数据库所在目录存在（持久卷挂载点或自定义 DB_PATH 的父级）
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // 更好的并发读写表现

// 初始化表结构
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS states (
    user_id INTEGER PRIMARY KEY,
    state_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

module.exports = db;
