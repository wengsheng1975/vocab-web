const express = require('express');
const db = require('../config/db');
const { authenticateToken, validateIdParam } = require('../middleware/auth');
const { normalizeTargetLevel, resolveTargetBaseLevel, TARGET_LEVEL_TO_CEFR } = require('../constants/targetLevels');

const router = express.Router();
router.use(authenticateToken);

const LEVEL_COMPARE_COLUMNS = Object.freeze([
  Object.freeze({ key: 'cefr', label: 'CEFR' }),
  Object.freeze({ key: 'gaokao', label: '高考英语全国卷' }),
  Object.freeze({ key: 'cet', label: 'CET' }),
  Object.freeze({ key: 'tem', label: 'TEM' }),
  Object.freeze({ key: 'toefl', label: '托福 iBT' }),
  Object.freeze({ key: 'ielts', label: '雅思 A/G' }),
  Object.freeze({ key: 'cambridge', label: '剑桥英语' }),
  Object.freeze({ key: 'capability', label: '能力定位' }),
]);

const LEVEL_COMPARE_ROWS = Object.freeze([
  Object.freeze({
    cefr: 'C2',
    gaokao: '—',
    cet: '—',
    tem: 'TEM-8 优秀',
    toefl: '110-120',
    ielts: '8.5-9.0',
    cambridge: 'CPE',
    capability: '精通，接近母语者',
  }),
  Object.freeze({
    cefr: 'C1',
    gaokao: '140+',
    cet: '—',
    tem: 'TEM-8 合格',
    toefl: '95-109',
    ielts: '7.0-8.0',
    cambridge: 'CAE',
    capability: '熟练，胜任学术与专业高阶使用',
  }),
  Object.freeze({
    cefr: 'B2',
    gaokao: '120-139',
    cet: 'CET-6 500+',
    tem: 'TEM-4 优秀',
    toefl: '72-94',
    ielts: '5.5-6.5',
    cambridge: 'FCE',
    capability: '中高阶，独立使用，本科/研究生常见门槛',
  }),
  Object.freeze({
    cefr: 'B1',
    gaokao: '90-119',
    cet: 'CET-4 425+',
    tem: 'TEM-4 合格',
    toefl: '46-71',
    ielts: '4.5-5.0',
    cambridge: 'PET',
    capability: '中级，能应对日常交流与基础学术任务',
  }),
  Object.freeze({
    cefr: 'A2',
    gaokao: '60-89',
    cet: 'CET-4 300-424',
    tem: '—',
    toefl: '20-45',
    ielts: '3.5-4.0',
    cambridge: 'KET',
    capability: '基础，能进行简单对话与读写',
  }),
  Object.freeze({
    cefr: 'A1',
    gaokao: '<60',
    cet: '未达 CET-4 300',
    tem: '—',
    toefl: '0-19',
    ielts: '2.0-3.0',
    cambridge: 'YLE Movers',
    capability: '入门，掌握基础词汇与句型',
  }),
]);

const TARGET_COLUMN_BY_BASE = Object.freeze({
  gaokao_national: 'gaokao',
  cet4: 'cet',
  cet6: 'cet',
  tem4: 'tem',
  tem8: 'tem',
  toefl: 'toefl',
  ielts: 'ielts',
  cambridge: 'cambridge',
});

const TARGET_LEVEL_LABELS = Object.freeze({
  none: '未设定',
  gaokao_national_a1: '高考英语全国卷 <60 (A1)',
  gaokao_national_a2: '高考英语全国卷 60-89 (A2)',
  gaokao_national_b1: '高考英语全国卷 90-119 (B1)',
  gaokao_national_b2: '高考英语全国卷 120-139 (B2)',
  gaokao_national_c1: '高考英语全国卷 140+ (C1 入门)',
  cet4_a1: '未达 CET-4 300 (A1)',
  cet4_a2: 'CET-4 300-424 (A2)',
  cet4_b1: 'CET-4 425+ (B1)',
  cet6_b2: 'CET-6 500+ (B2)',
  tem4_b1: 'TEM-4 合格 (B1)',
  tem4_b2: 'TEM-4 优秀 (B2)',
  tem8_c1: 'TEM-8 合格 (C1)',
  tem8_c2: 'TEM-8 优秀 (C2)',
  toefl_a1: 'TOEFL 0-19 (A1)',
  toefl_a2: 'TOEFL 20-45 (A2)',
  toefl_b1: 'TOEFL 46-71 (B1)',
  toefl_b2: 'TOEFL 72-94 (B2)',
  toefl_c1: 'TOEFL 95-109 (C1)',
  toefl_c2: 'TOEFL 110-120 (C2)',
  ielts_a1: 'IELTS 2.0-3.0 (A1)',
  ielts_a2: 'IELTS 3.5-4.0 (A2)',
  ielts_b1: 'IELTS 4.5-5.0 (B1)',
  ielts_b2: 'IELTS 5.5-6.5 (B2)',
  ielts_c1: 'IELTS 7.0-8.0 (C1)',
  ielts_c2: 'IELTS 8.5-9.0 (C2)',
  cambridge_a1: 'YLE Movers (A1)',
  cambridge_a2: 'KET (A2)',
  cambridge_b1: 'PET (B1)',
  cambridge_b2: 'FCE (B2)',
  cambridge_c1: 'CAE (C1)',
  cambridge_c2: 'CPE (C2)',
});

function resolveTargetMeta(targetLevel) {
  const normalized = normalizeTargetLevel(targetLevel);
  if (normalized === 'none') {
    return { label: '未设定', columnKey: null, referenceCefr: null };
  }
  const base = resolveTargetBaseLevel(normalized);
  return {
    label: TARGET_LEVEL_LABELS[normalized] || '未设定',
    columnKey: TARGET_COLUMN_BY_BASE[base] || null,
    referenceCefr: TARGET_LEVEL_TO_CEFR[normalized] || null,
  };
}

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
    LEFT JOIN users u ON u.id = rs.user_id
    WHERE rs.user_id = ?
      AND (u.level_reset_at IS NULL OR rs.created_at >= u.level_reset_at)
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
      targetLevel: normalizeTargetLevel(user.target_level || 'none'),
      // 兼容旧前端字段名
      target_level: normalizeTargetLevel(user.target_level || 'none'),
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

// 获取核心水平对比总表
router.get('/level-compare-table', (req, res) => {
  const userId = req.user.id;
  const user = db.prepare('SELECT estimated_level, target_level FROM users WHERE id = ?').get(userId);
  const normalizedTargetLevel = normalizeTargetLevel(user?.target_level || 'none');
  const targetMeta = resolveTargetMeta(normalizedTargetLevel);

  res.json({
    columns: LEVEL_COMPARE_COLUMNS,
    rows: LEVEL_COMPARE_ROWS,
    currentEstimatedLevel: user?.estimated_level || 'unknown',
    targetLevel: normalizedTargetLevel,
    targetMeta,
  });
});

// 获取水平变化趋势
router.get('/level-history', (req, res) => {
  const userId = req.user.id;

  const history = db.prepare(`
    SELECT ulh.*, a.title as article_title
    FROM user_level_history ulh
    LEFT JOIN articles a ON ulh.article_id = a.id
    LEFT JOIN users u ON u.id = ulh.user_id
    WHERE ulh.user_id = ?
      AND (u.level_reset_at IS NULL OR ulh.assessed_at >= u.level_reset_at)
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
    LEFT JOIN users u ON u.id = rs.user_id
    WHERE rs.user_id = ?
      AND (u.level_reset_at IS NULL OR rs.created_at >= u.level_reset_at)
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
