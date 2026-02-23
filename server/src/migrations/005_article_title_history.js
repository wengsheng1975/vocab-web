/**
 * 添加 article_title_history 表
 * 记录用户所有文章的标题（含已删除），用于账号申诉验证身份
 */

const description = '添加 article_title_history 表用于账号申诉';

function up(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS article_title_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      article_id INTEGER,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_title_history_user ON article_title_history(user_id);
  `);

  // 将现有文章标题同步到历史表
  db.exec(`
    INSERT INTO article_title_history (user_id, article_id, title, created_at)
    SELECT user_id, id, title, created_at FROM articles
  `);
}

function down(db) {
  db.exec('DROP TABLE IF EXISTS article_title_history');
}

module.exports = { description, up, down };
