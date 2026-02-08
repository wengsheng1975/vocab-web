const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT 密钥：必须通过环境变量配置，禁止硬编码
// 如未配置，开发模式下自动生成随机密钥（每次重启失效），生产模式直接拒绝启动
const JWT_SECRET = (() => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('严重安全错误：生产环境必须设置 JWT_SECRET 环境变量');
    process.exit(1);
  }
  const devSecret = crypto.randomBytes(64).toString('hex');
  console.warn('警告：未设置 JWT_SECRET，使用随机密钥（仅限开发环境，重启后所有 token 失效）');
  return devSecret;
})();

// ===== Token 黑名单（登出后使 token 失效） =====
// 使用 Map: token -> 过期时间戳，定期清理已过期条目
const tokenBlacklist = new Map();

function blacklistToken(token, expTimestamp) {
  tokenBlacklist.set(token, expTimestamp);
}

function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}

// 每 10 分钟清理已过期的黑名单条目（防止内存泄漏）
// 使用 unref() 确保定时器不阻止 Node.js 进程优雅退出
const cleanupTimer = setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  let cleaned = 0;
  for (const [tok, exp] of tokenBlacklist) {
    if (exp <= now) {
      tokenBlacklist.delete(tok);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[AUTH] 清理 ${cleaned} 条过期黑名单 token`);
  }
}, 10 * 60 * 1000);
cleanupTimer.unref();

// ===== 认证中间件 =====
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  // 检查黑名单
  if (isTokenBlacklisted(token)) {
    return res.status(401).json({ error: '令牌已失效，请重新登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.token = token; // 保存原始 token 供 logout 使用
    next();
  } catch (err) {
    // 区分过期与无效，但不泄露具体错误细节
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期，请重新登录' });
    }
    return res.status(403).json({ error: '令牌无效' });
  }
}

// ===== 路由参数 :id 校验中间件 =====
function validateIdParam(req, res, next) {
  const id = req.params.id;
  if (!/^\d+$/.test(id) || parseInt(id) <= 0) {
    return res.status(400).json({ error: '无效的 ID 参数' });
  }
  next();
}

module.exports = { authenticateToken, JWT_SECRET, blacklistToken, validateIdParam };
