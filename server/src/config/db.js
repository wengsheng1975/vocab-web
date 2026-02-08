const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库存储路径：优先使用 DATA_DIR 环境变量（便携包模式），其次回退项目目录
let dataDir;
if (process.env.DATA_DIR) {
  dataDir = path.resolve(process.env.DATA_DIR);
} else {
  dataDir = path.join(__dirname, '..', '..', 'data');
}

// 确保目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 设置目录权限为仅所有者可读写（Unix 系统）
try {
  fs.chmodSync(dataDir, 0o700);
} catch {
  // Windows 等不支持 chmod 的系统忽略
}

const dbPath = path.join(dataDir, 'vocab.db');
console.log('数据库路径:', dbPath);

const db = new Database(dbPath);

// 启用 WAL 模式以提高并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 安全加固：限制 LIKE 操作的 ESCAPE 字符（防御性设置）
db.pragma('secure_delete = ON');

// 优雅关闭：确保 WAL 被正确 checkpoint
process.on('SIGINT', () => {
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();
  process.exit(0);
});
process.on('SIGTERM', () => {
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();
  process.exit(0);
});

module.exports = db;
