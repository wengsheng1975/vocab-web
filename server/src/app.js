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

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
