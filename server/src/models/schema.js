const db = require('../config/db');

function initDatabase() {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      estimated_level TEXT DEFAULT 'unknown',
      target_level TEXT DEFAULT 'none',
      total_articles_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 文章文件夹（用户自定义分类）
  db.exec(`
    CREATE TABLE IF NOT EXISTS article_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, name)
    )
  `);

  // 兼容旧数据库：如果 target_level 列不存在则添加
  try {
    db.exec(`ALTER TABLE users ADD COLUMN target_level TEXT DEFAULT 'none'`);
  } catch { /* 列已存在，忽略 */ }

  // 文章表
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      difficulty_level TEXT DEFAULT 'unknown',
      difficulty_score REAL DEFAULT 0,
      word_count INTEGER DEFAULT 0,
      unique_word_count INTEGER DEFAULT 0,
      unknown_word_count INTEGER DEFAULT 0,
      unknown_percentage REAL DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      source_site TEXT DEFAULT '',
      source_url TEXT DEFAULT '',
      source_author TEXT DEFAULT '',
      published_at DATETIME,
      imported_via TEXT DEFAULT 'manual',
      folder_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (folder_id) REFERENCES article_folders(id) ON DELETE SET NULL
    )
  `);

  // 兼容旧数据库：补齐 articles 来源字段
  try { db.exec(`ALTER TABLE articles ADD COLUMN source_site TEXT DEFAULT ''`); } catch { /* 列已存在，忽略 */ }
  try { db.exec(`ALTER TABLE articles ADD COLUMN source_url TEXT DEFAULT ''`); } catch { /* 列已存在，忽略 */ }
  try { db.exec(`ALTER TABLE articles ADD COLUMN source_author TEXT DEFAULT ''`); } catch { /* 列已存在，忽略 */ }
  try { db.exec(`ALTER TABLE articles ADD COLUMN published_at DATETIME`); } catch { /* 列已存在，忽略 */ }
  try { db.exec(`ALTER TABLE articles ADD COLUMN imported_via TEXT DEFAULT 'manual'`); } catch { /* 列已存在，忽略 */ }
  try { db.exec(`ALTER TABLE articles ADD COLUMN folder_id INTEGER`); } catch { /* 列已存在，忽略 */ }

  // 生词库（核心表：跨文章合并的用户生词）
  db.exec(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      phonetic TEXT DEFAULT '',
      click_count INTEGER DEFAULT 1,
      skip_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      first_seen_article_id INTEGER,
      last_seen_article_id INTEGER,
      first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, word)
    )
  `);

  // 爬虫来源配置（按用户保存启用状态、抓取频率、每次抓取数量）
  db.exec(`
    CREATE TABLE IF NOT EXISTS crawler_source_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      source_key TEXT NOT NULL,
      enabled INTEGER DEFAULT 0,
      interval_minutes INTEGER DEFAULT 180,
      limit_per_run INTEGER DEFAULT 3,
      last_run_at DATETIME,
      next_run_at DATETIME,
      last_status TEXT DEFAULT 'never',
      last_error TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, source_key)
    )
  `);

  // 爬虫任务日志（记录手动/定时抓取执行结果）
  db.exec(`
    CREATE TABLE IF NOT EXISTS crawler_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      source_key TEXT NOT NULL,
      trigger_mode TEXT DEFAULT 'manual',
      status TEXT DEFAULT 'success',
      requested_count INTEGER DEFAULT 0,
      fetched_count INTEGER DEFAULT 0,
      imported_count INTEGER DEFAULT 0,
      skipped_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      error_message TEXT DEFAULT '',
      details_json TEXT DEFAULT '{}',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 单词释义（上下文相关，每篇文章可能带来不同释义）
  // article_id 可为 NULL，表示手动添加的释义或文章已删除
  db.exec(`
    CREATE TABLE IF NOT EXISTS word_meanings (
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

  // 文章中被点击的单词记录
  db.exec(`
    CREATE TABLE IF NOT EXISTS article_clicked_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      word_index INTEGER DEFAULT 0,
      clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 阅读会话报告
  db.exec(`
    CREATE TABLE IF NOT EXISTS reading_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      article_id INTEGER NOT NULL,
      article_difficulty TEXT,
      new_words_count INTEGER DEFAULT 0,
      repeated_words_count INTEGER DEFAULT 0,
      mastered_words_count INTEGER DEFAULT 0,
      high_freq_words TEXT DEFAULT '[]',
      total_vocab_size INTEGER DEFAULT 0,
      unknown_percentage REAL DEFAULT 0,
      estimated_level TEXT DEFAULT 'unknown',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    )
  `);

  // 用户水平历史记录
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_level_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      level TEXT NOT NULL,
      level_score REAL DEFAULT 0,
      article_id INTEGER,
      unknown_percentage REAL DEFAULT 0,
      vocab_size INTEGER DEFAULT 0,
      assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ===== 兼容迁移：修复旧数据库中 word_meanings.article_id NOT NULL 问题 =====
  try {
    // 检查 word_meanings 表的 article_id 是否还是 NOT NULL
    const tableInfo = db.prepare("PRAGMA table_info(word_meanings)").all();
    const articleIdCol = tableInfo.find(c => c.name === 'article_id');
    if (articleIdCol && articleIdCol.notnull === 1) {
      console.log('迁移：修复 word_meanings.article_id 为可 NULL...');
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
      // 迁移数据：将 article_id = 0 或不存在的外键转为 NULL
      db.exec(`
        INSERT INTO word_meanings_new (id, vocabulary_id, article_id, meaning, context_sentence, created_at)
        SELECT id, vocabulary_id,
          CASE WHEN article_id = 0 OR article_id NOT IN (SELECT id FROM articles) THEN NULL ELSE article_id END,
          meaning, context_sentence, created_at
        FROM word_meanings
      `);
      db.exec('DROP TABLE word_meanings');
      db.exec('ALTER TABLE word_meanings_new RENAME TO word_meanings');
      console.log('迁移完成：word_meanings.article_id 已改为可 NULL');
    }
  } catch (err) {
    console.error('word_meanings 迁移出错（可忽略）:', err.message);
  }

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_articles_user ON articles(user_id);
    CREATE INDEX IF NOT EXISTS idx_articles_source_site ON articles(source_site);
    CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
    CREATE INDEX IF NOT EXISTS idx_articles_folder_id ON articles(folder_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_user_source_url_unique
      ON articles(user_id, source_url)
      WHERE source_url IS NOT NULL AND TRIM(source_url) <> '';
    CREATE INDEX IF NOT EXISTS idx_article_folders_user ON article_folders(user_id);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_user ON vocabulary(user_id);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_status ON vocabulary(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_word ON vocabulary(user_id, word);
    CREATE INDEX IF NOT EXISTS idx_word_meanings_vocab ON word_meanings(vocabulary_id);
    CREATE INDEX IF NOT EXISTS idx_clicked_words_article ON article_clicked_words(article_id);
    CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON reading_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_level_history_user ON user_level_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_crawler_settings_user ON crawler_source_settings(user_id);
    CREATE INDEX IF NOT EXISTS idx_crawler_settings_due
      ON crawler_source_settings(enabled, next_run_at);
    CREATE INDEX IF NOT EXISTS idx_crawler_jobs_user ON crawler_jobs(user_id, started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_crawler_jobs_source ON crawler_jobs(source_key, started_at DESC);
  `);

  console.log('数据库表初始化完成');
}

module.exports = { initDatabase };
