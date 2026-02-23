/**
 * 添加阅读进度表：保存用户中途离开时的阅读位置
 */

const description = '添加 reading_progress 表，支持暂停/恢复阅读';

function up(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reading_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      article_id INTEGER NOT NULL,
      scroll_position REAL DEFAULT 0,
      scroll_percentage REAL DEFAULT 0,
      last_visible_word_index INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      UNIQUE(user_id, article_id)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reading_progress_user
      ON reading_progress(user_id);
  `);
}

function down(db) {
  db.exec('DROP TABLE IF EXISTS reading_progress');
}

module.exports = { description, up, down };
