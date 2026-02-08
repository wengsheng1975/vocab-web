const express = require('express');
const db = require('../config/db');
const { authenticateToken, validateIdParam } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// 获取综合统计（首页仪表盘）
router.get('/overview', (req, res) => {
  const userId = req.user.id;

  // 不查询 password_hash 等敏感字段
  const user = db.prepare('SELECT id, username, email, estimated_level, target_level, total_articles_read, created_at FROM users WHERE id = ?').get(userId);

  // 生词库统计
  const { activeVocab } = db.prepare(
    "SELECT COUNT(*) as activeVocab FROM vocabulary WHERE user_id = ? AND status = 'active'"
  ).get(userId);

  const { masteredVocab } = db.prepare(
    "SELECT COUNT(*) as masteredVocab FROM vocabulary WHERE user_id = ? AND status = 'mastered'"
  ).get(userId);

  const { highFreqVocab } = db.prepare(
    "SELECT COUNT(*) as highFreqVocab FROM vocabulary WHERE user_id = ? AND status = 'active' AND click_count >= 3"
  ).get(userId);

  // 文章统计
  const { totalArticles } = db.prepare(
    'SELECT COUNT(*) as totalArticles FROM articles WHERE user_id = ?'
  ).get(userId);

  const { completedArticles } = db.prepare(
    'SELECT COUNT(*) as completedArticles FROM articles WHERE user_id = ? AND is_completed = 1'
  ).get(userId);

  // 最近的阅读会话
  const recentSessions = db.prepare(`
    SELECT rs.*, a.title as article_title
    FROM reading_sessions rs
    LEFT JOIN articles a ON rs.article_id = a.id
    WHERE rs.user_id = ?
    ORDER BY rs.created_at DESC
    LIMIT 5
  `).all(userId);

  // 高频生词（需要重点学习的）
  const topHighFreqWords = db.prepare(`
    SELECT * FROM vocabulary
    WHERE user_id = ? AND status = 'active' AND click_count >= 2
    ORDER BY click_count DESC
    LIMIT 10
  `).all(userId);

  res.json({
    user: {
      username: user.username,
      estimatedLevel: user.estimated_level,
      totalArticlesRead: user.total_articles_read,
    },
    vocab: {
      active: activeVocab,
      mastered: masteredVocab,
      highFreq: highFreqVocab,
      total: activeVocab + masteredVocab,
    },
    articles: {
      total: totalArticles,
      completed: completedArticles,
    },
    recentSessions,
    topHighFreqWords,
  });
});

// 获取水平变化趋势
router.get('/level-history', (req, res) => {
  const userId = req.user.id;

  const history = db.prepare(`
    SELECT ulh.*, a.title as article_title
    FROM user_level_history ulh
    LEFT JOIN articles a ON ulh.article_id = a.id
    WHERE ulh.user_id = ?
    ORDER BY ulh.assessed_at ASC
  `).all(userId);

  res.json({ history });
});

// 获取阅读报告详情
router.get('/session/:id', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const sessionId = req.params.id;

  const session = db.prepare(`
    SELECT rs.*, a.title as article_title, a.difficulty_level, a.word_count, a.unique_word_count
    FROM reading_sessions rs
    LEFT JOIN articles a ON rs.article_id = a.id
    WHERE rs.id = ? AND rs.user_id = ?
  `).get(sessionId, userId);

  if (!session) {
    return res.status(404).json({ error: '会话不存在' });
  }

  // 安全解析高频词 JSON
  try {
    session.high_freq_words = JSON.parse(session.high_freq_words || '[]');
  } catch {
    session.high_freq_words = [];
  }

  res.json({ session });
});

// 获取所有阅读会话
router.get('/sessions', (req, res) => {
  const userId = req.user.id;

  const sessions = db.prepare(`
    SELECT rs.*, a.title as article_title
    FROM reading_sessions rs
    LEFT JOIN articles a ON rs.article_id = a.id
    WHERE rs.user_id = ?
    ORDER BY rs.created_at DESC
  `).all(userId);

  sessions.forEach(s => {
    try {
      s.high_freq_words = JSON.parse(s.high_freq_words || '[]');
    } catch {
      s.high_freq_words = [];
    }
  });

  res.json({ sessions });
});

// 获取复习建议（已读文章中仍有未掌握的生词/词组）
router.get('/review-suggestions', (req, res) => {
  const userId = req.user.id;

  // 获取用户当前活跃的生词/词组
  const activeVocab = db.prepare(
    "SELECT word FROM vocabulary WHERE user_id = ? AND status = 'active'"
  ).all(userId).map(v => v.word);

  if (activeVocab.length === 0) {
    return res.json({ suggestions: [] });
  }

  const activeSet = new Set(activeVocab);

  // 获取所有已完成的文章
  const completedArticles = db.prepare(`
    SELECT id, title, difficulty_level, completed_at, unknown_word_count, unknown_percentage
    FROM articles
    WHERE user_id = ? AND is_completed = 1
    ORDER BY completed_at DESC
  `).all(userId);

  const suggestions = [];

  for (const article of completedArticles) {
    // 获取该文章中曾标记的生词/词组
    const clickedInArticle = db.prepare(
      'SELECT DISTINCT word FROM article_clicked_words WHERE article_id = ? AND user_id = ?'
    ).all(article.id, userId).map(r => r.word);

    // 计算这些词中还有多少仍然是 active（未掌握）
    const stillActive = clickedInArticle.filter(w => activeSet.has(w));

    if (stillActive.length > 0) {
      suggestions.push({
        articleId: article.id,
        title: article.title,
        difficultyLevel: article.difficulty_level,
        completedAt: article.completed_at,
        totalClickedWords: clickedInArticle.length,
        stillActiveCount: stillActive.length,
        stillActiveWords: stillActive.slice(0, 5), // 最多展示5个
      });
    }
  }

  res.json({ suggestions });
});

module.exports = router;
