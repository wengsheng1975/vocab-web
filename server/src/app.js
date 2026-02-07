const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./models/schema');

const authRoutes = require('./routes/auth');
const articlesRoutes = require('./routes/articles');
const vocabularyRoutes = require('./routes/vocabulary');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '5mb' })); // 增大限制以支持长文章

// 初始化数据库
initDatabase();

// 独立模式配置接口（STANDALONE=true 时跳过登录）
const isStandalone = process.env.STANDALONE === 'true';
app.get('/api/config', (req, res) => {
  res.json({ standalone: isStandalone });
});

// 独立模式：启动时自动创建默认用户
if (isStandalone) {
  const db = require('./config/db');
  const bcrypt = require('bcryptjs');
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('user');
  if (!existing) {
    const hash = bcrypt.hashSync('standalone', 10);
    db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run('user', 'user@local', hash);
    console.log('独立模式：已创建默认用户');
  }
}

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/stats', statsRoutes);

// 在生产环境中提供前端静态文件
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  }
});

// 全局错误处理中间件（必须在所有路由之后）
app.use((err, req, res, _next) => {
  console.error('未处理的错误:', err);

  // multer 文件大小超限
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: '文件大小超过限制（最大 10MB）' });
  }

  // multer 其他错误
  if (err.message && err.message.includes('不支持的文件格式')) {
    return res.status(400).json({ error: err.message });
  }

  // 通用错误
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message || '服务器内部错误',
  });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
