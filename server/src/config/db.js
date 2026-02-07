const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库存储路径：优先使用 DATA_DIR 环境变量（便携包模式），其次回退项目目录
let dataDir;
if (process.env.DATA_DIR) {
  dataDir = process.env.DATA_DIR;
} else {
  dataDir = path.join(__dirname, '..', '..');
}

// 确保目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'vocab.db');
console.log('数据库路径:', dbPath);

const db = new Database(dbPath);

// 启用 WAL 模式以提高并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
