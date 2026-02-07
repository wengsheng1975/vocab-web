const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ===== 工具函数 =====

/** 将密码记录到 password_history */
function recordPasswordHistory(userId, passwordHash) {
  try {
    db.prepare(
      'INSERT INTO password_history (user_id, password_hash) VALUES (?, ?)'
    ).run(userId, passwordHash);
  } catch { /* 表不存在时静默忽略（兼容旧数据库） */ }
}

/** 检查新密码是否与历史密码重复，返回匹配的记录或 null */
function checkPasswordHistory(userId, newPassword) {
  try {
    const history = db.prepare(
      'SELECT password_hash FROM password_history WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);
    for (const row of history) {
      if (bcrypt.compareSync(newPassword, row.password_hash)) {
        return true; // 密码曾使用过
      }
    }
  } catch { /* 表不存在时忽略 */ }
  return false;
}

// ===== 注册 =====
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: '用户名、邮箱和密码都是必填项' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度至少为6位' });
  }

  const existingUser = db.prepare(
    'SELECT id FROM users WHERE username = ? OR email = ?'
  ).get(username, email);

  if (existingUser) {
    return res.status(409).json({ error: '用户名或邮箱已被注册' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
  ).run(username, email, passwordHash);

  // 记录到密码历史
  recordPasswordHistory(result.lastInsertRowid, passwordHash);

  const token = jwt.sign(
    { id: result.lastInsertRowid, username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    message: '注册成功',
    token,
    user: { id: result.lastInsertRowid, username, email }
  });
});

// ===== 登录 =====
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码都是必填项' });
  }

  const user = db.prepare(
    'SELECT * FROM users WHERE username = ? OR email = ?'
  ).get(username, username);

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: '登录成功',
    token,
    user: { id: user.id, username: user.username, email: user.email }
  });
});

// ===== 获取已注册用户数量（无需认证） =====
router.get('/user-count', (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM users').get();
  res.json({ count });
});

// ===== 检查用户名是否存在（无需认证） =====
router.get('/check-username/:username', (req, res) => {
  const { username } = req.params;
  if (!username || username.trim().length === 0) {
    return res.json({ exists: false });
  }
  const user = db.prepare(
    'SELECT id FROM users WHERE username = ? OR email = ?'
  ).get(username.trim(), username.trim());
  res.json({ exists: !!user });
});

// ===== 忘记密码 — 生成重置令牌，模拟发送邮件 =====
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: '请提供注册邮箱' });
  }

  const user = db.prepare('SELECT id, username, email FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(404).json({ error: '该邮箱未注册' });
  }

  // 使旧令牌失效
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0').run(user.id);

  // 生成新令牌（32 字节随机 hex），有效期 30 分钟
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, token, expiresAt);

  // 构建重置链接（实际生产环境中这里会发送真实邮件）
  const resetLink = `/reset-password?token=${token}`;

  console.log(`[密码重置] 用户 ${user.username} 的重置链接: ${resetLink}`);

  res.json({
    message: `密码重置链接已发送到 ${email}`,
    // 开发模式下返回链接以便测试；生产环境应移除此字段
    resetLink,
  });
});

// ===== 验证重置令牌 =====
router.get('/verify-reset-token/:token', (req, res) => {
  const { token } = req.params;

  const record = db.prepare(`
    SELECT prt.*, u.username, u.email
    FROM password_reset_tokens prt
    JOIN users u ON prt.user_id = u.id
    WHERE prt.token = ? AND prt.used = 0
  `).get(token);

  if (!record) {
    return res.status(400).json({ error: '重置链接无效或已使用' });
  }

  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: '重置链接已过期，请重新申请' });
  }

  res.json({
    valid: true,
    username: record.username,
    email: record.email,
  });
});

// ===== 重置密码（通过令牌） =====
router.post('/reset-password', (req, res) => {
  const { token, newPassword, forceReset } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: '令牌和新密码都是必填项' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '密码长度至少为6位' });
  }

  // 验证令牌
  const record = db.prepare(`
    SELECT prt.*, u.id as uid
    FROM password_reset_tokens prt
    JOIN users u ON prt.user_id = u.id
    WHERE prt.token = ? AND prt.used = 0
  `).get(token);

  if (!record) {
    return res.status(400).json({ error: '重置链接无效或已使用' });
  }

  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: '重置链接已过期，请重新申请' });
  }

  const userId = record.uid;

  // 检查新密码是否在历史中使用过
  if (!forceReset) {
    const isOldPassword = checkPasswordHistory(userId, newPassword);
    if (isOldPassword) {
      // 检查是否就是当前密码
      const currentUser = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
      const isCurrentPassword = bcrypt.compareSync(newPassword, currentUser.password_hash);

      return res.status(409).json({
        error: '该密码已被使用过',
        code: 'PASSWORD_USED',
        isCurrentPassword,
      });
    }
  }

  // 执行密码重置
  const passwordHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);

  // 记录到密码历史
  recordPasswordHistory(userId, passwordHash);

  // 标记令牌已使用
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(record.id);

  res.json({ message: '密码重置成功，请使用新密码登录' });
});

// ===== 一键测试登录（自动创建测试账号） =====
router.post('/demo', (req, res) => {
  const username = 'tester';
  const email = 'tester@demo.com';
  const password = '123456';

  let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username, email, passwordHash);
    recordPasswordHistory(result.lastInsertRowid, passwordHash);
    user = { id: result.lastInsertRowid, username, email };
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: '测试登录成功',
    token,
    user: { id: user.id, username: user.username, email: user.email || email }
  });
});

module.exports = router;
