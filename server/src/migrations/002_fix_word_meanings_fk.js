/**
 * 修复 word_meanings 表的外键问题
 *
 * 问题：article_id 原本为 NOT NULL，但删除文章时需要保留释义，
 * 之前代码用 article_id = 0 导致外键约束违反。
 *
 * 修复：将 article_id 改为可 NULL，ON DELETE SET NULL。
 * SQLite 不支持 ALTER COLUMN，需要重建表。
 */

const description = '修复 word_meanings.article_id 外键：改为可 NULL，ON DELETE SET NULL';

function up(db) {
  // SQLite 不支持 ALTER COLUMN，需要通过重建表的方式修改

  // 1. 创建新表（article_id 可为 NULL，ON DELETE SET NULL）
  db.exec(`
    CREATE TABLE IF NOT EXISTS word_meanings_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vocabulary_id INTEGER NOT NULL,
      article_id INTEGER,
      meaning TEXT NOT NULL,
      context_sentence TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
    )
  `);

  // 2. 迁移数据，将 article_id = 0 转为 NULL
  db.exec(`
    INSERT INTO word_meanings_new (id, vocabulary_id, article_id, meaning, context_sentence, created_at)
    SELECT id, vocabulary_id,
      CASE WHEN article_id = 0 THEN NULL ELSE article_id END,
      meaning, context_sentence, created_at
    FROM word_meanings
  `);

  // 3. 删除旧表，重命名新表
  db.exec('DROP TABLE word_meanings');
  db.exec('ALTER TABLE word_meanings_new RENAME TO word_meanings');

  // 4. 重建索引
  db.exec('CREATE INDEX IF NOT EXISTS idx_word_meanings_vocab ON word_meanings(vocabulary_id)');
}

function down(db) {
  // 回滚：恢复为 NOT NULL，将 NULL 转回 0
  db.exec(`
    CREATE TABLE IF NOT EXISTS word_meanings_old (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vocabulary_id INTEGER NOT NULL,
      article_id INTEGER NOT NULL,
      meaning TEXT NOT NULL,
      context_sentence TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    INSERT INTO word_meanings_old (id, vocabulary_id, article_id, meaning, context_sentence, created_at)
    SELECT id, vocabulary_id,
      CASE WHEN article_id IS NULL THEN 0 ELSE article_id END,
      meaning, context_sentence, created_at
    FROM word_meanings
  `);

  db.exec('DROP TABLE word_meanings');
  db.exec('ALTER TABLE word_meanings_old RENAME TO word_meanings');
  db.exec('CREATE INDEX IF NOT EXISTS idx_word_meanings_vocab ON word_meanings(vocabulary_id)');
}

module.exports = { description, up, down };
