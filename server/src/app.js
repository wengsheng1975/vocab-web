const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const crypto = require('crypto');
const { initDatabase } = require('./models/schema');

const authRoutes = require('./routes/auth');
const articlesRoutes = require('./routes/articles');
const vocabularyRoutes = require('./routes/vocabulary');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ===== 安全中间件 =====

// Helmet: 设置安全 HTTP 头（CSP、X-Frame-Options、HSTS 等）
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false, // 开发模式下关闭 CSP 以兼容 Vite HMR
  crossOriginEmbedderPolicy: false, // 允许加载外部资源
}));

// 隐藏 X-Powered-By 头（helmet 已处理，显式确保）
app.disable('x-powered-by');

// CORS: 限制允许的来源
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000']; // 开发默认值

app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如同源请求、curl、移动端等）
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('不允许的跨域请求来源'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 速率限制：全局 API（每个 IP 每 15 分钟最多 300 次请求）
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
});
app.use('/api', globalLimiter);

// 速率限制：认证端点（每个 IP 每 15 分钟最多 20 次 — 防暴力破解）
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '登录尝试过于频繁，请 15 分钟后再试' },
  skipSuccessfulRequests: true, // 成功的请求不计入限制
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 请求体限制
app.use(express.json({ limit: '2mb' })); // 从 5mb 降低到 2mb，仍可支持长文章

// ===== 初始化数据库 =====
initDatabase();

// ===== 独立模式配置 =====
const isStandalone = process.env.STANDALONE === 'true';
app.get('/api/config', (req, res) => {
  res.json({ standalone: isStandalone });
});

// 独立模式：启动时自动创建默认用户（使用随机密码，非硬编码）
if (isStandalone) {
  const db = require('./config/db');
  const bcrypt = require('bcryptjs');
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('user');
  if (!existing) {
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hash = bcrypt.hashSync(randomPassword, 10);
    db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run('user', 'user@local', hash);
    console.log('独立模式：已创建默认用户（密码通过 demo 端点自动登录）');
  }
}

// ===== API 路由 =====
app.use('/api/auth', authRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/stats', statsRoutes);

// ===== API 404 处理：未匹配的 /api/* 返回明确的 404 =====
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// ===== 全局错误处理 =====
app.use((err, req, res, _next) => {
  // CORS 错误
  if (err.message === '不允许的跨域请求来源') {
    return res.status(403).json({ error: '跨域请求被拒绝' });
  }
  // 不在响应中泄露内部错误细节
  console.error('服务器内部错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// ===== 静态文件与前端路由 =====
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientBuildPath, {
  dotfiles: 'deny', // 拒绝访问 .env、.git 等隐藏文件
}));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT} [${isProduction ? '生产' : '开发'}模式]`);
});
