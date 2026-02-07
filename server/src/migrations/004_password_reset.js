/**
 * 添加密码重置令牌表和密码历史表
 * 支持：邮件链接重置密码、历史密码复用检测
 */

const description = '添加 password_reset_tokens 和 password_history 表';

function up(db) {
  // 密码重置令牌（邮件链接中携带）
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 密码历史（用于检测用户是否复用旧密码）
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);
  `);

  // 将现有用户的当前密码写入历史（初始化）
  db.exec(`
    INSERT INTO password_history (user_id, password_hash, created_at)
    SELECT id, password_hash, created_at FROM users
  `);
}

function down(db) {
  db.exec(`
    DROP TABLE IF EXISTS password_reset_tokens;
    DROP TABLE IF EXISTS password_history;
  `);
}

module.exports = { description, up, down };
