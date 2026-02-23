/**
 * 轻量级 SQLite 数据库迁移框架
 *
 * 核心机制：
 * - 使用 schema_migrations 表记录已执行的迁移版本
 * - 每个迁移文件导出 up() 和 down() 方法
 * - 启动时自动运行未执行的迁移
 * - 所有迁移在事务中执行，失败自动回滚
 */
const path = require('path');
const fs = require('fs');

/**
 * 运行所有未执行的迁移
 * @param {import('better-sqlite3').Database} db - 数据库实例
 */
function runMigrations(db) {
  // 确保迁移记录表存在
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 获取已执行的迁移版本
  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map(r => r.version)
  );

  // 扫描迁移文件（按文件名排序保证执行顺序）
  const migrationsDir = __dirname;
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => /^\d{3}_.*\.js$/.test(f) && f !== 'index.js')
    .sort();

  let appliedCount = 0;

  for (const file of migrationFiles) {
    const version = file.replace('.js', '');

    if (applied.has(version)) {
      continue; // 已执行，跳过
    }

    const migration = require(path.join(migrationsDir, file));

    if (typeof migration.up !== 'function') {
      console.error(`迁移文件 ${file} 缺少 up() 方法，跳过`);
      continue;
    }

    console.log(`执行迁移: ${version} ...`);

    // 在事务中执行迁移
    const runMigration = db.transaction(() => {
      migration.up(db);
      db.prepare(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)'
      ).run(version, migration.description || version);
    });

    try {
      runMigration();
      appliedCount++;
      console.log(`迁移完成: ${version}`);
    } catch (err) {
      console.error(`迁移失败: ${version}`, err.message);
      throw err; // 迁移失败应阻止应用启动
    }
  }

  if (appliedCount > 0) {
    console.log(`共执行 ${appliedCount} 个迁移`);
  } else {
    console.log('数据库已是最新版本');
  }
}

/**
 * 回滚最近一次迁移
 * @param {import('better-sqlite3').Database} db - 数据库实例
 */
function rollbackLastMigration(db) {
  const last = db.prepare(
    'SELECT version FROM schema_migrations ORDER BY id DESC LIMIT 1'
  ).get();

  if (!last) {
    console.log('没有可回滚的迁移');
    return;
  }

  const file = `${last.version}.js`;
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.error(`迁移文件不存在: ${file}`);
    return;
  }

  const migration = require(filePath);

  if (typeof migration.down !== 'function') {
    console.error(`迁移文件 ${file} 缺少 down() 方法，无法回滚`);
    return;
  }

  console.log(`回滚迁移: ${last.version} ...`);

  const rollback = db.transaction(() => {
    migration.down(db);
    db.prepare('DELETE FROM schema_migrations WHERE version = ?').run(last.version);
  });

  try {
    rollback();
    console.log(`回滚完成: ${last.version}`);
  } catch (err) {
    console.error(`回滚失败: ${last.version}`, err.message);
    throw err;
  }
}

module.exports = { runMigrations, rollbackLastMigration };
