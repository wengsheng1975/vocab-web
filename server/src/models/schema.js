const db = require('../config/db');
const { runMigrations } = require('../migrations');

function initDatabase() {
  // 使用迁移系统初始化和升级数据库
  runMigrations(db);
}

module.exports = { initDatabase };
