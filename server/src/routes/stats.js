const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { safeJsonParse } = require('../utils/helpers');

const router = express.Router();
router.use(authenticateToken);

// 获取综合统计（首页仪表盘）
router.get('/overview', (req, res) => {
  const userId = req.user.id;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  // 合并生词库统计为一条聚合查询
  const vocabStats = db.prepare(`
    SELECT
      COUNT(CASE WHEN status = 'active' THEN 1 END) as activeVocab,
      COUNT(CASE WHEN status = 'mastered' THEN 1 END) as masteredVocab,
      COUNT(CASE WHEN status = 'active' AND click_count >= 3 THEN 1 END) as highFreqVocab
    FROM vocabulary WHERE user_id = ?
  `).get(userId);

  // 合并文章统计为一条聚合查询
  const articleStats = db.prepare(`
    SELECT
      COUNT(*) as totalArticles,
      COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completedArticles
    FROM articles WHERE user_id = ?
  `).get(userId);

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
      active: vocabStats.activeVocab,
      mastered: vocabStats.masteredVocab,
      highFreq: vocabStats.highFreqVocab,
      total: vocabStats.activeVocab + vocabStats.masteredVocab,
    },
    articles: {
      total: articleStats.totalArticles,
      completed: articleStats.completedArticles,
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
router.get('/session/:id', (req, res) => {
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

  // 解析高频词
  session.high_freq_words = safeJsonParse(session.high_freq_words, []);

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
    s.high_freq_words = safeJsonParse(s.high_freq_words, []);
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

  if (completedArticles.length === 0) {
    return res.json({ suggestions: [] });
  }

  // 批量获取所有已完成文章的点击词（消除 N+1 查询）
  const articleIds = completedArticles.map(a => a.id);
  const placeholders = articleIds.map(() => '?').join(',');
  const allClicked = db.prepare(`
    SELECT DISTINCT article_id, word
    FROM article_clicked_words
    WHERE article_id IN (${placeholders}) AND user_id = ?
  `).all(...articleIds, userId);

  // 按 article_id 分组
  const clickedByArticle = {};
  for (const row of allClicked) {
    if (!clickedByArticle[row.article_id]) {
      clickedByArticle[row.article_id] = [];
    }
    clickedByArticle[row.article_id].push(row.word);
  }

  const suggestions = [];

  for (const article of completedArticles) {
    const clickedInArticle = clickedByArticle[article.id] || [];
    const stillActive = clickedInArticle.filter(w => activeSet.has(w));

    if (stillActive.length > 0) {
      suggestions.push({
        articleId: article.id,
        title: article.title,
        difficultyLevel: article.difficulty_level,
        completedAt: article.completed_at,
        totalClickedWords: clickedInArticle.length,
        stillActiveCount: stillActive.length,
        stillActiveWords: stillActive.slice(0, 5),
      });
    }
  }

  res.json({ suggestions });
});

module.exports = router;
