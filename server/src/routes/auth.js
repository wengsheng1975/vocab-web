const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// 注册
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: '用户名、邮箱和密码都是必填项' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度至少为6位' });
  }

  // 检查用户名或邮箱是否已存在
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

// 登录
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

// 一键测试登录（自动创建测试账号）
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
