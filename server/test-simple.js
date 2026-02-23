console.log('开始测试...');

// 测试基本模块加载
try {
  console.log('1. 测试 express...');
  const express = require('express');
  console.log('✅ express 加载成功');
} catch (e) {
  console.error('❌ express 加载失败:', e.message);
  process.exit(1);
}

try {
  console.log('2. 测试 dotenv...');
  require('dotenv').config();
  console.log('✅ dotenv 加载成功');
} catch (e) {
  console.error('❌ dotenv 加载失败:', e.message);
}

try {
  console.log('3. 测试 better-sqlite3...');
  const Database = require('better-sqlite3');
  console.log('✅ better-sqlite3 加载成功');
} catch (e) {
  console.error('❌ better-sqlite3 加载失败:', e.message);
}

try {
  console.log('4. 测试数据库配置...');
  const db = require('./src/config/db');
  console.log('✅ 数据库配置加载成功');
} catch (e) {
  console.error('❌ 数据库配置加载失败:', e.message);
}

try {
  console.log('5. 测试数据库初始化...');
  const { initDatabase } = require('./src/models/schema');
  initDatabase();
  console.log('✅ 数据库初始化成功');
} catch (e) {
  console.error('❌ 数据库初始化失败:', e.message);
}

try {
  console.log('6. 测试创建简单服务器...');
  const express = require('express');
  const app = express();
  
  app.get('/test', (req, res) => {
    res.json({ message: '测试成功!', time: new Date().toISOString() });
  });
  
  const PORT = 3001; // 使用不同端口避免冲突
  
  app.listen(PORT, () => {
    console.log(`✅ 测试服务器运行在 http://localhost:${PORT}`);
    console.log('请访问 http://localhost:3001/test 测试');
  });
  
} catch (e) {
  console.error('❌ 创建服务器失败:', e.message);
}

console.log('测试完成');
