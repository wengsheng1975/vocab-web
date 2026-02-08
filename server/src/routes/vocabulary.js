const express = require('express');
const db = require('../config/db');
const { authenticateToken, validateIdParam } = require('../middleware/auth');
const { isOutOfScope, getWordCETLevel, getWordMorphInfo } = require('../utils/cetWords');
const { lookupDict } = require('../utils/cetDictionary');

const router = express.Router();
router.use(authenticateToken);

// 获取生词库（按词频排序）
router.get('/', (req, res) => {
  const userId = req.user.id;
  const { status = 'active', sort = 'click_count', order = 'DESC', search, page = 1, limit = 50 } = req.query;

  // 参数校验与安全化
  const allowedStatuses = ['active', 'mastered', 'all'];
  const safeStatus = allowedStatuses.includes(status) ? status : 'active';

  const safePage = Math.max(1, Math.min(10000, parseInt(page) || 1));
  const safeLimit = Math.max(1, Math.min(200, parseInt(limit) || 50));

  // 搜索词长度限制 + 转义 SQL LIKE 通配符（% 和 _）
  let safeSearch = '';
  if (typeof search === 'string' && search.length <= 50) {
    safeSearch = search.replace(/[%_]/g, '\\$&');
  }

  let sql = 'SELECT * FROM vocabulary WHERE user_id = ?';
  const params = [userId];

  // 状态过滤
  if (safeStatus !== 'all') {
    sql += ' AND status = ?';
    params.push(safeStatus);
  }

  // 搜索（使用 ESCAPE 确保 % 和 _ 被当作字面量）
  if (safeSearch) {
    sql += " AND word LIKE ? ESCAPE '\\'";
    params.push(`%${safeSearch}%`);
  }

  // 排序：使用参数化映射（避免字符串拼接 SQL）
  const SORT_MAP = {
    click_count: 'click_count',
    word: 'word',
    first_seen_at: 'first_seen_at',
    last_clicked_at: 'last_clicked_at',
    skip_count: 'skip_count',
  };
  const sortField = SORT_MAP[sort] || 'click_count';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  sql += ` ORDER BY ${sortField} ${sortOrder}`;

  // 分页
  const offset = (safePage - 1) * safeLimit;
  sql += ' LIMIT ? OFFSET ?';
  params.push(safeLimit, offset);

  const words = db.prepare(sql).all(...params);

  // 获取用户的目标等级，用于判断超纲
  const userRow = db.prepare('SELECT target_level FROM users WHERE id = ?').get(userId);
  const targetLevel = userRow?.target_level || 'none';

  // 获取每个单词的释义 + 超纲标记
  const wordsWithMeanings = words.map(word => {
    const meanings = db.prepare(`
      SELECT wm.*, a.title as article_title
      FROM word_meanings wm
      LEFT JOIN articles a ON wm.article_id = a.id
      WHERE wm.vocabulary_id = ?
      ORDER BY wm.created_at DESC
    `).all(word.id);

    const morph = getWordMorphInfo(word.word);
    const dictEntry = lookupDict(word.word);
    return {
      ...word,
      meanings,
      cetLevel: getWordCETLevel(word.word),
      outOfScope: isOutOfScope(word.word, targetLevel),
      lemma: morph.lemma,
      wordForm: morph.form,
      dictPhonetic: dictEntry?.ph || null,   // 大纲美式音标
      dictMeaning: dictEntry?.cn || null,    // 大纲中文释义
    };
  });

  // 获取总数
  let countSql = 'SELECT COUNT(*) as total FROM vocabulary WHERE user_id = ?';
  const countParams = [userId];
  if (safeStatus !== 'all') {
    countSql += ' AND status = ?';
    countParams.push(safeStatus);
  }
  if (safeSearch) {
    countSql += " AND word LIKE ? ESCAPE '\\'";
    countParams.push(`%${safeSearch}%`);
  }
  const { total } = db.prepare(countSql).get(...countParams);

  // 统计信息
  const { activeCount } = db.prepare(
    "SELECT COUNT(*) as activeCount FROM vocabulary WHERE user_id = ? AND status = 'active'"
  ).get(userId);
  const { masteredCount } = db.prepare(
    "SELECT COUNT(*) as masteredCount FROM vocabulary WHERE user_id = ? AND status = 'mastered'"
  ).get(userId);
  const { highFreqCount } = db.prepare(
    "SELECT COUNT(*) as highFreqCount FROM vocabulary WHERE user_id = ? AND status = 'active' AND click_count >= 3"
  ).get(userId);

  // 超纲词统计
  let outOfScopeCount = 0;
  if (targetLevel !== 'none') {
    const allActive = db.prepare(
      "SELECT word FROM vocabulary WHERE user_id = ? AND status = 'active'"
    ).all(userId);
    outOfScopeCount = allActive.filter(w => isOutOfScope(w.word, targetLevel)).length;
  }

  res.json({
    words: wordsWithMeanings,
    total,
    stats: { activeCount, masteredCount, highFreqCount, outOfScopeCount },
    targetLevel,
    page: safePage,
    limit: safeLimit,
  });
});

// 获取单个生词详情
router.get('/:id', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const vocabId = req.params.id;

  const word = db.prepare(
    'SELECT * FROM vocabulary WHERE id = ? AND user_id = ?'
  ).get(vocabId, userId);

  if (!word) {
    return res.status(404).json({ error: '单词不存在' });
  }

  const meanings = db.prepare(`
    SELECT wm.*, a.title as article_title
    FROM word_meanings wm
    LEFT JOIN articles a ON wm.article_id = a.id
    WHERE wm.vocabulary_id = ?
    ORDER BY wm.created_at DESC
  `).all(vocabId);

  res.json({ ...word, meanings });
});

// 更新生词信息（音标、释义等）
router.put('/:id', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const vocabId = req.params.id;
  const { phonetic, meaning, context_sentence } = req.body;

  const word = db.prepare(
    'SELECT * FROM vocabulary WHERE id = ? AND user_id = ?'
  ).get(vocabId, userId);

  if (!word) {
    return res.status(404).json({ error: '单词不存在' });
  }

  // 输入长度校验
  if (phonetic !== undefined) {
    if (typeof phonetic !== 'string' || phonetic.length > 100) {
      return res.status(400).json({ error: '音标格式错误' });
    }
    db.prepare('UPDATE vocabulary SET phonetic = ? WHERE id = ?').run(phonetic, vocabId);
  }

  // 如果提供了新的释义
  if (meaning) {
    if (typeof meaning !== 'string' || meaning.length > 500) {
      return res.status(400).json({ error: '释义过长' });
    }
    const safeContext = (typeof context_sentence === 'string' && context_sentence.length <= 1000)
      ? context_sentence : '';
    db.prepare(`
      INSERT INTO word_meanings (vocabulary_id, article_id, meaning, context_sentence)
      VALUES (?, NULL, ?, ?)
    `).run(vocabId, meaning, safeContext);
  }

  const updated = db.prepare('SELECT * FROM vocabulary WHERE id = ?').get(vocabId);
  res.json(updated);
});

// 手动标记为已掌握
router.post('/:id/master', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const vocabId = req.params.id;

  db.prepare(
    "UPDATE vocabulary SET status = 'mastered' WHERE id = ? AND user_id = ?"
  ).run(vocabId, userId);

  res.json({ message: '已标记为已掌握' });
});

// 手动恢复到生词库
router.post('/:id/restore', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const vocabId = req.params.id;

  db.prepare(
    "UPDATE vocabulary SET status = 'active', skip_count = 0 WHERE id = ? AND user_id = ?"
  ).run(vocabId, userId);

  res.json({ message: '已恢复到生词库' });
});

// 更新单条释义（需属于当前用户的生词）
router.put('/:id/meanings/:meaningId', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const vocabId = req.params.id;
  const meaningId = req.params.meaningId;
  if (!/^\d+$/.test(meaningId) || parseInt(meaningId, 10) <= 0) {
    return res.status(400).json({ error: '无效的释义 ID' });
  }
  const { meaning, context_sentence } = req.body;

  const vocab = db.prepare('SELECT id FROM vocabulary WHERE id = ? AND user_id = ?').get(vocabId, userId);
  if (!vocab) return res.status(404).json({ error: '单词不存在' });

  const row = db.prepare('SELECT id FROM word_meanings WHERE id = ? AND vocabulary_id = ?').get(meaningId, vocabId);
  if (!row) return res.status(404).json({ error: '释义不存在' });

  if (typeof meaning !== 'string' || meaning.trim().length === 0) {
    return res.status(400).json({ error: '释义不能为空' });
  }
  if (meaning.length > 500) return res.status(400).json({ error: '释义过长' });
  const safeContext = (typeof context_sentence === 'string' && context_sentence.length <= 1000) ? context_sentence : '';

  db.prepare('UPDATE word_meanings SET meaning = ?, context_sentence = ? WHERE id = ?').run(meaning.trim(), safeContext, meaningId);
  const updated = db.prepare('SELECT * FROM word_meanings WHERE id = ?').get(meaningId);
  res.json(updated);
});

// 删除单条释义
router.delete('/:id/meanings/:meaningId', validateIdParam, (req, res) => {
  try {
    const userId = req.user.id;
    const vocabId = req.params.id;
    const meaningId = req.params.meaningId;
    
    if (!/^\d+$/.test(meaningId) || parseInt(meaningId, 10) <= 0) {
      return res.status(400).json({ error: '无效的释义 ID' });
    }

    const vocab = db.prepare('SELECT id FROM vocabulary WHERE id = ? AND user_id = ?').get(vocabId, userId);
    if (!vocab) {
      return res.status(404).json({ error: '单词不存在' });
    }

    const row = db.prepare('SELECT id FROM word_meanings WHERE id = ? AND vocabulary_id = ?').get(meaningId, vocabId);
    if (!row) {
      return res.status(404).json({ error: '释义不存在' });
    }

    const result = db.prepare('DELETE FROM word_meanings WHERE id = ?').run(meaningId);
    if (result.changes === 0) {
      return res.status(404).json({ error: '删除失败，释义可能已被删除' });
    }
    
    res.json({ message: '已删除' });
  } catch (err) {
    console.error('删除释义错误:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
