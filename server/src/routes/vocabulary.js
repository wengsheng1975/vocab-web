const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// 获取生词库（按词频排序）
router.get('/', (req, res) => {
  const userId = req.user.id;
  const { status = 'active', sort = 'click_count', order = 'DESC', search, page = 1, limit = 50 } = req.query;

  let sql = 'SELECT * FROM vocabulary WHERE user_id = ?';
  const params = [userId];

  // 状态过滤
  if (status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }

  // 搜索
  if (search) {
    sql += ' AND word LIKE ?';
    params.push(`%${search}%`);
  }

  // 排序：默认按词频降序（高频生词排前面）
  const allowedSorts = ['click_count', 'word', 'first_seen_at', 'last_clicked_at', 'skip_count'];
  const sortField = allowedSorts.includes(sort) ? sort : 'click_count';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  sql += ` ORDER BY ${sortField} ${sortOrder}`;

  // 分页
  const offset = (parseInt(page) - 1) * parseInt(limit);
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const words = db.prepare(sql).all(...params);

  // 批量获取所有单词的释义（消除 N+1 查询）
  let wordsWithMeanings = words;
  if (words.length > 0) {
    const vocabIds = words.map(w => w.id);
    const placeholders = vocabIds.map(() => '?').join(',');
    const allMeanings = db.prepare(`
      SELECT wm.*, a.title as article_title
      FROM word_meanings wm
      LEFT JOIN articles a ON wm.article_id = a.id
      WHERE wm.vocabulary_id IN (${placeholders})
      ORDER BY wm.created_at DESC
    `).all(...vocabIds);

    // 按 vocabulary_id 分组
    const meaningsByVocabId = {};
    for (const m of allMeanings) {
      if (!meaningsByVocabId[m.vocabulary_id]) {
        meaningsByVocabId[m.vocabulary_id] = [];
      }
      meaningsByVocabId[m.vocabulary_id].push(m);
    }

    wordsWithMeanings = words.map(word => ({
      ...word,
      meanings: meaningsByVocabId[word.id] || [],
    }));
  }

  // 获取总数
  let countSql = 'SELECT COUNT(*) as total FROM vocabulary WHERE user_id = ?';
  const countParams = [userId];
  if (status !== 'all') {
    countSql += ' AND status = ?';
    countParams.push(status);
  }
  if (search) {
    countSql += ' AND word LIKE ?';
    countParams.push(`%${search}%`);
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

  res.json({
    words: wordsWithMeanings,
    total,
    stats: { activeCount, masteredCount, highFreqCount },
    page: parseInt(page),
    limit: parseInt(limit),
  });
});

// 获取单个生词详情
router.get('/:id', (req, res) => {
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
router.put('/:id', (req, res) => {
  const userId = req.user.id;
  const vocabId = req.params.id;
  const { phonetic, meaning, context_sentence } = req.body;

  const word = db.prepare(
    'SELECT * FROM vocabulary WHERE id = ? AND user_id = ?'
  ).get(vocabId, userId);

  if (!word) {
    return res.status(404).json({ error: '单词不存在' });
  }

  if (phonetic !== undefined) {
    db.prepare('UPDATE vocabulary SET phonetic = ? WHERE id = ?').run(phonetic, vocabId);
  }

  // 如果提供了新的释义
  if (meaning) {
    db.prepare(`
      INSERT INTO word_meanings (vocabulary_id, article_id, meaning, context_sentence)
      VALUES (?, NULL, ?, ?)
    `).run(vocabId, meaning, context_sentence || '');
  }

  const updated = db.prepare('SELECT * FROM vocabulary WHERE id = ?').get(vocabId);
  res.json(updated);
});

// 手动标记为已掌握
router.post('/:id/master', (req, res) => {
  const userId = req.user.id;
  const vocabId = req.params.id;

  db.prepare(
    "UPDATE vocabulary SET status = 'mastered' WHERE id = ? AND user_id = ?"
  ).run(vocabId, userId);

  res.json({ message: '已标记为已掌握' });
});

// 手动恢复到生词库
router.post('/:id/restore', (req, res) => {
  const userId = req.user.id;
  const vocabId = req.params.id;

  db.prepare(
    "UPDATE vocabulary SET status = 'active', skip_count = 0 WHERE id = ? AND user_id = ?"
  ).run(vocabId, userId);

  res.json({ message: '已恢复到生词库' });
});

module.exports = router;
