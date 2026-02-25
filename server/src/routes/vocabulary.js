const express = require('express');
const db = require('../config/db');
const { authenticateToken, validateIdParam } = require('../middleware/auth');
const { isOutOfScope, getWordMorphInfo } = require('../utils/cetWords');
const { normalizeTargetLevel, resolveTargetBaseLevel } = require('../constants/targetLevels');
const { lookupDictByTargetLevel } = require('../utils/cetDictionary');

const router = express.Router();
router.use(authenticateToken);

const TARGET_SCOPE_LABELS = Object.freeze({
  gaokao_national: 'GAOKAO',
  cet4: 'CET4',
  cet6: 'CET6',
  tem4: 'TEM4',
  tem8: 'TEM8',
  toefl: 'TOEFL',
  ielts: 'IELTS',
  cambridge: 'CAMBRIDGE',
});

function resolveScopeLabel(targetLevel, dictEntryLevel) {
  const base = resolveTargetBaseLevel(targetLevel);
  if (TARGET_SCOPE_LABELS[base]) {
    return TARGET_SCOPE_LABELS[base];
  }
  return dictEntryLevel ? String(dictEntryLevel).toUpperCase() : null;
}

function resolveDictEntryWithMorph(wordText, morph, targetLevel) {
  const normalizedWord = String(wordText || '').toLowerCase().trim();
  if (!normalizedWord) {
    return { entry: null, fromLemma: false, directHit: false, matchedLevel: null };
  }
  return lookupDictByTargetLevel(normalizedWord, targetLevel, { lemma: morph?.lemma });
}

function extractAdjectiveMeaning(baseMeaning) {
  const text = String(baseMeaning || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';

  const posBoundary = '(?:n\\.|v\\.|vi\\.|vt\\.|a\\.|adj\\.|ad\\.|adv\\.|pron\\.|prep\\.|conj\\.|num\\.|int\\.|aux\\.|art\\.)';
  const re = new RegExp(`(a\\.|adj\\.)(.*?)(?=\\s${posBoundary}|$)`, 'i');
  const match = text.match(re);
  if (!match) return '';

  const marker = match[1].toLowerCase() === 'adj.' ? 'adj.' : 'a.';
  const content = String(match[2] || '').trim();
  return content ? `${marker}${content}` : marker;
}

function getFallbackMeaningText(dictEntry, wordText, morph, fromLemma, directHit, { inScope }) {
  if (!inScope) return '';
  const baseMeaning = String(dictEntry?.cn || '').trim();
  const normalizedWord = String(wordText || '').toLowerCase().trim();
  const lemma = String(morph?.lemma || '').toLowerCase().trim();
  const form = String(morph?.form || '');
  const isComparative = form.includes('比较级');
  const isSuperlative = form.includes('最高级');

  // 比较级/最高级单独规则：
  // 1) 只保留形容词义（a./adj.）
  // 2) 大纲无形容词义时，兜底（更）/（最）+ lemma
  if (isComparative || isSuperlative) {
    const adjectiveMeaning = extractAdjectiveMeaning(baseMeaning);
    if (adjectiveMeaning) {
      if (directHit) return adjectiveMeaning;
      return isComparative ? `（更）${adjectiveMeaning}` : `（最）${adjectiveMeaning}`;
    }

    if (lemma) {
      return isComparative ? `（更）${lemma}` : `（最）${lemma}`;
    }
  }

  const shouldMarkLemma = Boolean(lemma && lemma !== normalizedWord && (fromLemma || morph?.form));

  if (baseMeaning) {
    return shouldMarkLemma ? `${baseMeaning}（原型：${lemma}）` : baseMeaning;
  }

  // 比较级/最高级在词典缺失时，也保持有内容
  if (!baseMeaning && isComparative && lemma) {
    return `（更）${lemma}`;
  }
  if (!baseMeaning && isSuperlative && lemma) {
    return `（最）${lemma}`;
  }

  // 其他词形在词典缺失时，给出原型提示，避免释义栏为空
  if (shouldMarkLemma) {
    return `词典暂无释义（原型：${lemma}）`;
  }

  // 纲内词兜底：即使词典遗漏，也不返回空释义
  return '纲内词（词典待补充）';
}

function getDisplayDictMeaning(dictEntry, wordText, morph, directHit, { inScope }) {
  if (!inScope) return null;
  const baseMeaning = String(dictEntry?.cn || '').trim();
  const normalizedWord = String(wordText || '').toLowerCase().trim();
  const lemma = String(morph?.lemma || '').toLowerCase().trim();
  const form = String(morph?.form || '');
  const isComparative = form.includes('比较级');
  const isSuperlative = form.includes('最高级');

  if (!baseMeaning) {
    if ((isComparative || isSuperlative) && lemma) {
      return isComparative ? `（更）${lemma}` : `（最）${lemma}`;
    }
    return '纲内词（词典待补充）';
  }

  if (isComparative || isSuperlative) {
    const adjectiveMeaning = extractAdjectiveMeaning(baseMeaning);
    if (adjectiveMeaning) {
      if (directHit) return adjectiveMeaning;
      return isComparative ? `（更）${adjectiveMeaning}` : `（最）${adjectiveMeaning}`;
    }
    if (lemma) {
      return isComparative ? `（更）${lemma}` : `（最）${lemma}`;
    }
  }

  return baseMeaning;
}

function withFallbackMeaning(meanings, dictEntry, wordText, morph, fromLemma, directHit, { inScope, scopeLabel }) {
  const normalizedMeanings = (meanings || []).filter(
    (m) => String(m?.meaning || '').trim().length > 0
  );

  // 纲外词：默认不提供系统释义，仅展示用户自定义释义
  if (!inScope) return normalizedMeanings;

  // 纲内词：始终按当前等级词库释义展示，避免历史自定义释义混淆
  const fallbackMeaning = getFallbackMeaningText(dictEntry, wordText, morph, fromLemma, directHit, { inScope: true });
  if (!fallbackMeaning) return [];

  const lemma = String(morph?.lemma || '').toLowerCase().trim();
  const form = String(morph?.form || '');
  const isComparativeOrSuperlative = form.includes('比较级') || form.includes('最高级');
  const baseSource = scopeLabel ? `词典释义（${scopeLabel}）` : '词典释义';

  return [{
    id: null,
    vocabulary_id: null,
    article_id: null,
    meaning: fallbackMeaning,
    context_sentence: '',
    created_at: null,
    article_title: !isComparativeOrSuperlative && lemma && lemma !== String(wordText || '').toLowerCase().trim()
      ? `${baseSource}（原型：${lemma}）`
      : baseSource,
    is_dict_fallback: true,
  }];
}

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
  const targetLevel = normalizeTargetLevel(userRow?.target_level || 'none');

  // 获取每个单词的释义 + 超纲标记
  const wordsWithMeanings = words.map(word => {
    const outOfScope = isOutOfScope(word.word, targetLevel);
    const inScope = !outOfScope;
    const dbMeanings = db.prepare(`
      SELECT wm.*, a.title as article_title
      FROM word_meanings wm
      LEFT JOIN articles a ON wm.article_id = a.id
      WHERE wm.vocabulary_id = ?
      ORDER BY wm.created_at DESC
    `).all(word.id);

    const morph = getWordMorphInfo(word.word);
    const { entry: dictEntry, fromLemma, directHit } = resolveDictEntryWithMorph(word.word, morph, targetLevel);
    const scopeLevel = resolveScopeLabel(targetLevel, dictEntry?.lv);
    const meanings = withFallbackMeaning(
      dbMeanings,
      dictEntry,
      word.word,
      morph,
      fromLemma,
      directHit,
      { inScope, scopeLabel: scopeLevel }
    );

    return {
      ...word,
      meanings,
      outOfScope,
      lemma: morph.lemma,
      wordForm: morph.form,
      dictPhonetic: dictEntry?.ph || null,   // 大纲美式音标
      dictLevel: scopeLevel,
      dictMeaning: getDisplayDictMeaning(dictEntry, word.word, morph, directHit, { inScope }),
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

  const userRow = db.prepare('SELECT target_level FROM users WHERE id = ?').get(userId);
  const targetLevel = normalizeTargetLevel(userRow?.target_level || 'none');
  const outOfScope = isOutOfScope(word.word, targetLevel);
  const inScope = !outOfScope;

  const dbMeanings = db.prepare(`
    SELECT wm.*, a.title as article_title
    FROM word_meanings wm
    LEFT JOIN articles a ON wm.article_id = a.id
    WHERE wm.vocabulary_id = ?
    ORDER BY wm.created_at DESC
  `).all(vocabId);

  const morph = getWordMorphInfo(word.word);
  const { entry: dictEntry, fromLemma, directHit } = resolveDictEntryWithMorph(word.word, morph, targetLevel);
  const scopeLevel = resolveScopeLabel(targetLevel, dictEntry?.lv);
  const meanings = withFallbackMeaning(
    dbMeanings,
    dictEntry,
    word.word,
    morph,
    fromLemma,
    directHit,
    { inScope, scopeLabel: scopeLevel }
  );

  res.json({
    ...word,
    meanings,
    outOfScope,
    lemma: morph.lemma,
    wordForm: morph.form,
    dictPhonetic: dictEntry?.ph || null,
    dictLevel: scopeLevel,
    dictMeaning: getDisplayDictMeaning(dictEntry, word.word, morph, directHit, { inScope }),
  });
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
    const userRow = db.prepare('SELECT target_level FROM users WHERE id = ?').get(userId);
    const targetLevel = normalizeTargetLevel(userRow?.target_level || 'none');
    const outOfScope = isOutOfScope(word.word, targetLevel);
    if (!outOfScope) {
      return res.status(400).json({ error: '纲内词使用系统词典释义，不支持自定义释义' });
    }
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

  const word = db.prepare('SELECT id FROM vocabulary WHERE id = ? AND user_id = ?').get(vocabId, userId);
  if (!word) {
    return res.status(404).json({ error: '单词不存在' });
  }

  db.prepare(
    "UPDATE vocabulary SET status = 'mastered' WHERE id = ? AND user_id = ?"
  ).run(vocabId, userId);

  res.json({ message: '已标记为已掌握' });
});

// 手动恢复到生词库
router.post('/:id/restore', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const vocabId = req.params.id;

  const word = db.prepare('SELECT id FROM vocabulary WHERE id = ? AND user_id = ?').get(vocabId, userId);
  if (!word) {
    return res.status(404).json({ error: '单词不存在' });
  }

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

  const vocab = db.prepare('SELECT id, word FROM vocabulary WHERE id = ? AND user_id = ?').get(vocabId, userId);
  if (!vocab) return res.status(404).json({ error: '单词不存在' });

  const userRow = db.prepare('SELECT target_level FROM users WHERE id = ?').get(userId);
  const targetLevel = normalizeTargetLevel(userRow?.target_level || 'none');
  const outOfScope = isOutOfScope(vocab.word, targetLevel);
  if (!outOfScope) {
    return res.status(400).json({ error: '纲内词使用系统词典释义，不支持编辑自定义释义' });
  }

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
