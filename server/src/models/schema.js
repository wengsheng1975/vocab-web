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
      total_articles_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

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

  // 单词释义（上下文相关，每篇文章可能带来不同释义）
  db.exec(`
    CREATE TABLE IF NOT EXISTS word_meanings (
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

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_articles_user ON articles(user_id);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_user ON vocabulary(user_id);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_status ON vocabulary(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_word ON vocabulary(user_id, word);
    CREATE INDEX IF NOT EXISTS idx_word_meanings_vocab ON word_meanings(vocabulary_id);
    CREATE INDEX IF NOT EXISTS idx_clicked_words_article ON article_clicked_words(article_id);
    CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON reading_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_level_history_user ON user_level_history(user_id);
  `);

  console.log('数据库表初始化完成');
}

module.exports = { initDatabase };
