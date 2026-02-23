const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { JWT_SECRET, authenticateToken, blacklistToken } = require('../middleware/auth');

const router = express.Router();

// ===== 输入校验工具 =====

// 用户名：2-30位，字母数字下划线
function isValidUsername(username) {
  return typeof username === 'string' && /^[a-zA-Z0-9_\u4e00-\u9fa5]{2,30}$/.test(username);
}

// 邮箱：基本格式校验
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 100;
}

// 密码策略：至少 6 位，须包含字母和数字
function validatePassword(password) {
  if (typeof password !== 'string') return '密码格式错误';
  if (password.length < 6) return '密码长度至少为 6 位';
  if (password.length > 100) return '密码长度不能超过 100 位';
  if (!/[a-zA-Z]/.test(password)) return '密码必须包含至少一个字母';
  if (!/[0-9]/.test(password)) return '密码必须包含至少一个数字';
  return null;
}

// ===== 安全审计日志 =====
function logAuthEvent(event, details) {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH] ${timestamp} ${event}:`, JSON.stringify(details));
}

// ===== 注册 =====
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: '用户名、邮箱和密码都是必填项' });
  }

  if (!isValidUsername(username)) {
    return res.status(400).json({ error: '用户名为 2-30 位字母、数字、下划线或中文' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: '邮箱格式不正确' });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  // 检查用户名或邮箱是否已存在
  const existingUser = db.prepare(
    'SELECT id FROM users WHERE username = ? OR email = ?'
  ).get(username, email);

  if (existingUser) {
    return res.status(409).json({ error: '用户名或邮箱已被注册' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  // 使用 try-catch 处理并发注册的竞态条件（两个请求同时通过上面的检查）
  let result;
  try {
    result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username, email, passwordHash);
  } catch (err) {
    // UNIQUE 约束冲突（SQLite error code: SQLITE_CONSTRAINT_UNIQUE）
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: '用户名或邮箱已被注册' });
    }
    throw err; // 其他错误继续抛出
  }

  const token = jwt.sign(
    { id: result.lastInsertRowid, username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  logAuthEvent('REGISTER_SUCCESS', { username, email });

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

  // 限制输入长度防止超大 payload
  if (typeof username !== 'string' || username.length > 100 ||
      typeof password !== 'string' || password.length > 100) {
    return res.status(400).json({ error: '输入格式错误' });
  }

  const user = db.prepare(
    'SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?'
  ).get(username, username);

  if (!user) {
    logAuthEvent('LOGIN_FAILED', { username, reason: 'user_not_found' });
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    logAuthEvent('LOGIN_FAILED', { username, reason: 'wrong_password' });
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  logAuthEvent('LOGIN_SUCCESS', { username: user.username, userId: user.id });

  // 响应中不包含 password_hash
  res.json({
    message: '登录成功',
    token,
    user: { id: user.id, username: user.username, email: user.email }
  });
});

// ===== 一键测试登录 — 仅在非生产环境或独立模式下可用 =====
router.post('/demo', (req, res) => {
  const isStandalone = process.env.STANDALONE === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  // 生产环境下必须是独立模式才允许 demo 登录
  if (isProduction && !isStandalone) {
    return res.status(403).json({ error: '该功能在生产环境中已禁用' });
  }

  const username = 'tester';
  const email = 'tester@demo.com';

  let user = db.prepare('SELECT id, username, email FROM users WHERE username = ?').get(username);

  if (!user) {
    // 使用随机密码，而非硬编码弱密码
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = bcrypt.hashSync(randomPassword, 10);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username, email, passwordHash);
    user = { id: result.lastInsertRowid, username, email };
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '1d' } // Demo token 有效期缩短为 1 天
  );

  logAuthEvent('DEMO_LOGIN', { userId: user.id });

  res.json({
    message: '测试登录成功',
    token,
    user: { id: user.id, username: user.username, email: user.email || email }
  });
});

// ===== 登出（使当前 token 失效） =====
// ===== 获取/设置目标英语等级 =====
router.get('/target-level', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT target_level FROM users WHERE id = ?').get(req.user.id);
  res.json({ targetLevel: user?.target_level || 'none' });
});

router.put('/target-level', authenticateToken, (req, res) => {
  const { targetLevel } = req.body;
  const valid = ['none', 'cet4', 'cet6'];
  if (!valid.includes(targetLevel)) {
    return res.status(400).json({ error: '无效的目标等级，可选值: none, cet4, cet6' });
  }
  db.prepare('UPDATE users SET target_level = ? WHERE id = ?').run(targetLevel, req.user.id);
  res.json({ message: '目标等级已更新', targetLevel });
});

router.post('/logout', authenticateToken, (req, res) => {
  // 将当前 token 加入黑名单，直到其自然过期
  const decoded = jwt.decode(req.token);
  const expTimestamp = decoded?.exp || (Math.floor(Date.now() / 1000) + 7 * 24 * 3600);
  blacklistToken(req.token, expTimestamp);

  logAuthEvent('LOGOUT', { userId: req.user.id, username: req.user.username });

  res.json({ message: '已安全退出' });
});

module.exports = router;
