const express = require('express');
const path = require('path');
const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { extractWords, assessDifficulty, isDifficultyAppropriate } = require('../utils/difficulty');

const router = express.Router();
router.use(authenticateToken);

// 文件上传配置（内存存储，最大10MB）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.txt', '.docx', '.pdf'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，请上传 .txt、.docx 或 .pdf 文件'));
    }
  },
});

// 上传文件并解析为纯文本
router.post('/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择文件' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = path.basename(req.file.originalname, ext);
    let text = '';

    if (ext === '.txt') {
      text = req.file.buffer.toString('utf-8');
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else if (ext === '.pdf') {
      const result = await pdfParse(req.file.buffer);
      text = result.text;
    }

    // 清理文本：去掉多余空行，保留段落结构
    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    if (!text) {
      return res.status(400).json({ error: '文件内容为空或无法解析' });
    }

    res.json({ text, filename });
  } catch (err) {
    console.error('文件解析失败:', err);
    res.status(500).json({ error: '文件解析失败: ' + err.message });
  }
});

// ===== 本地语法规则检查（断网回退） =====
function localGrammarCheck(text) {
  const issues = [];

  // 1. 句首未大写
  const sentenceStarts = text.matchAll(/(?:^|[.!?]\s+)([a-z])/gm);
  for (const m of sentenceStarts) {
    issues.push({
      offset: m.index + m[0].length - 1,
      length: 1,
      message: '句首字母应大写',
      rule: 'UPPERCASE_SENTENCE_START',
      severity: 'auto',
      suggestions: [m[1].toUpperCase()],
    });
  }

  // 2. 标点后缺少空格 (. , ! ? ; : 后面紧跟字母)
  const missingSpace = text.matchAll(/([.,!?;:])([A-Za-z])/g);
  for (const m of missingSpace) {
    issues.push({
      offset: m.index,
      length: 2,
      message: `"${m[1]}" 后应加空格`,
      rule: 'MISSING_SPACE_AFTER_PUNCT',
      severity: 'auto',
      suggestions: [m[1] + ' ' + m[2]],
    });
  }

  // 3. 多余连续空格
  const multiSpace = text.matchAll(/( {2,})/g);
  for (const m of multiSpace) {
    issues.push({
      offset: m.index,
      length: m[1].length,
      message: '多余空格',
      rule: 'MULTIPLE_SPACES',
      severity: 'auto',
      suggestions: [' '],
    });
  }

  // 4. 缺少句末标点（最后一段文字没有 . ! ? 结尾）
  const trimmed = text.trimEnd();
  if (trimmed.length > 0 && !/[.!?]$/.test(trimmed)) {
    issues.push({
      offset: trimmed.length - 1,
      length: 1,
      message: '文章末尾可能缺少句号',
      rule: 'MISSING_END_PUNCT',
      severity: 'warning',
      suggestions: [trimmed[trimmed.length - 1] + '.'],
    });
  }

  // 5. 常见 "i" 未大写
  const lowI = text.matchAll(/\b(i)\b(?!')/g);
  for (const m of lowI) {
    // 排除在词中间的 i（确保是独立的 "i"）
    issues.push({
      offset: m.index,
      length: 1,
      message: '人称代词 "I" 应大写',
      rule: 'I_LOWERCASE',
      severity: 'auto',
      suggestions: ['I'],
    });
  }

  return issues;
}

// 语法检查 API
router.post('/grammar-check', async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.json({ source: 'none', issues: [] });
  }

  // 先尝试 LanguageTool API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        text: text,
        language: 'en-US',
        enabledOnly: 'false',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const issues = (data.matches || []).map(m => {
        // 判断严重程度：简单格式可自动修复，其他仅提示
        const autoFixRules = [
          'UPPERCASE_SENTENCE_START', 'WHITESPACE_RULE', 'COMMA_PARENTHESIS_WHITESPACE',
          'DOUBLE_PUNCTUATION', 'UNPAIRED_BRACKETS', 'EN_UNPAIRED_QUOTES',
        ];
        const isAuto = autoFixRules.some(r => m.rule?.id?.includes(r)) ||
                        m.rule?.issueType === 'typographical';

        return {
          offset: m.offset,
          length: m.length,
          message: m.message,
          rule: m.rule?.id || 'UNKNOWN',
          severity: isAuto ? 'auto' : 'warning',
          suggestions: (m.replacements || []).slice(0, 3).map(r => r.value),
        };
      });

      return res.json({ source: 'languagetool', issues });
    }

    throw new Error('LanguageTool API 返回非200状态');
  } catch (err) {
    // LanguageTool 不可用，回退本地检查
    console.log('LanguageTool 不可用，使用本地检查:', err.message);
    const issues = localGrammarCheck(text);
    return res.json({ source: 'local', issues });
  }
});

// 导入文章
router.post('/import', (req, res) => {
  const userId = req.user.id;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容都是必填项' });
  }

  // 评估文章难度
  const difficulty = assessDifficulty(content);
  const words = extractWords(content);
  const uniqueWords = [...new Set(words)];

  // 获取用户当前水平
  const user = db.prepare('SELECT estimated_level FROM users WHERE id = ?').get(userId);
  const appropriateness = isDifficultyAppropriate(difficulty.level, user.estimated_level);

  // 存入数据库
  const result = db.prepare(`
    INSERT INTO articles (user_id, title, content, difficulty_level, difficulty_score, word_count, unique_word_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, title, content, difficulty.level, difficulty.score, words.length, uniqueWords.length);

  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({
    article,
    difficulty,
    appropriateness,
  });
});

// 获取文章详情（用于阅读界面）
router.get('/:id', (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;

  const article = db.prepare(
    'SELECT * FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);

  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  // 获取该文章已标记的单词和词组
  const entries = db.prepare(
    'SELECT word, word_index FROM article_clicked_words WHERE article_id = ? AND user_id = ?'
  ).all(articleId, userId);

  const clickedWords = entries.filter(e => !e.word.includes(' ')).map(e => e.word);
  const clickedPhrases = entries.filter(e => e.word.includes(' ')).map(e => ({
    text: e.word,
    indices: String(e.word_index || '').split(',').map(Number).filter(n => !isNaN(n) && n >= 0),
  }));

  // 获取用户已掌握的单词和词组（用于重读时过滤）
  const masteredEntries = db.prepare(
    "SELECT word FROM vocabulary WHERE user_id = ? AND status = 'mastered'"
  ).all(userId);
  const masteredWords = masteredEntries.filter(e => !e.word.includes(' ')).map(e => e.word);
  const masteredPhrases = masteredEntries.filter(e => e.word.includes(' ')).map(e => e.word);

  res.json({ article, clickedWords, clickedPhrases, masteredWords, masteredPhrases });
});

// 获取用户所有文章列表
router.get('/', (req, res) => {
  const userId = req.user.id;

  const articles = db.prepare(`
    SELECT id, title, difficulty_level, difficulty_score, word_count, unique_word_count,
           unknown_word_count, unknown_percentage, is_completed, created_at, completed_at
    FROM articles WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId);

  res.json({ articles });
});

// 在阅读过程中点击标记单词
router.post('/:id/click-word', (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;
  const { word, wordIndex } = req.body;

  if (!word) {
    return res.status(400).json({ error: '请提供单词' });
  }

  const article = db.prepare(
    'SELECT * FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);

  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  const cleanWord = word.toLowerCase().trim();

  // 检查是否已经在该文章中点击过
  const existing = db.prepare(
    'SELECT id FROM article_clicked_words WHERE article_id = ? AND user_id = ? AND word = ?'
  ).get(articleId, userId, cleanWord);

  if (existing) {
    return res.json({ message: '该单词已标记', word: cleanWord, alreadyClicked: true });
  }

  // 记录点击
  db.prepare(
    'INSERT INTO article_clicked_words (article_id, user_id, word, word_index) VALUES (?, ?, ?, ?)'
  ).run(articleId, userId, cleanWord, wordIndex || 0);

  res.json({ message: '已标记', word: cleanWord, alreadyClicked: false });
});

// 标记词组
router.post('/:id/click-phrase', (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;
  const { phrase, indices } = req.body;

  if (!phrase || !indices) {
    return res.status(400).json({ error: '请提供词组和位置' });
  }

  const indicesStr = Array.isArray(indices) ? indices.join(',') : String(indices);

  // 删除旧条目（如果更新词组）
  db.prepare(
    'DELETE FROM article_clicked_words WHERE article_id = ? AND user_id = ? AND word = ?'
  ).run(articleId, userId, phrase);

  db.prepare(
    'INSERT INTO article_clicked_words (article_id, user_id, word, word_index) VALUES (?, ?, ?, ?)'
  ).run(articleId, userId, phrase, indicesStr);

  res.json({ message: '词组已标记', phrase });
});

// 取消标记词组
router.post('/:id/unclick-phrase', (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;
  const { phrase } = req.body;

  db.prepare(
    'DELETE FROM article_clicked_words WHERE article_id = ? AND user_id = ? AND word = ?'
  ).run(articleId, userId, phrase);

  res.json({ message: '词组已取消标记', phrase });
});

// 取消标记单词
router.post('/:id/unclick-word', (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;
  const { word } = req.body;

  const cleanWord = word.toLowerCase().trim();

  db.prepare(
    'DELETE FROM article_clicked_words WHERE article_id = ? AND user_id = ? AND word = ?'
  ).run(articleId, userId, cleanWord);

  res.json({ message: '已取消标记', word: cleanWord });
});

// 完成阅读 — 这是核心逻辑：合并生词库 + 生成报告
router.post('/:id/finish', (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;
  const { wordMeanings } = req.body; // { word: { meaning, context_sentence } }

  const article = db.prepare(
    'SELECT * FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);

  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  const isReread = article.is_completed === 1;

  // 获取本次阅读中点击的所有生词
  const clickedWords = db.prepare(
    'SELECT DISTINCT word FROM article_clicked_words WHERE article_id = ? AND user_id = ?'
  ).all(articleId, userId).map(r => r.word);

  const clickedSet = new Set(clickedWords);

  // 获取文章中所有唯一单词
  const articleWords = [...new Set(extractWords(article.content))];

  // 获取用户当前生词库中所有词（active + mastered，重读时可能重新标记mastered的词）
  const currentVocab = db.prepare(
    "SELECT * FROM vocabulary WHERE user_id = ?"
  ).all(userId);
  const vocabMap = {};
  currentVocab.forEach(v => { vocabMap[v.word] = v; });

  let newWordsCount = 0;
  let repeatedWordsCount = 0;
  let masteredWordsCount = 0;
  const highFreqWords = [];

  // 使用事务处理生词库合并
  const processVocab = db.transaction(() => {
    // 1. 处理点击的单词（生词）
    for (const word of clickedWords) {
      const existing = vocabMap[word];

      if (existing) {
        // 已在生词库中（可能是 active 或 mastered）— 词频+1，重置skip_count，恢复为active
        const newClickCount = existing.click_count + 1;
        const wasMastered = existing.status === 'mastered';
        db.prepare(`
          UPDATE vocabulary SET 
            click_count = ?,
            skip_count = 0,
            last_seen_article_id = ?,
            last_clicked_at = CURRENT_TIMESTAMP,
            status = 'active'
          WHERE id = ?
        `).run(newClickCount, articleId, existing.id);

        repeatedWordsCount++;
        if (newClickCount >= 3) {
          highFreqWords.push({ word, count: newClickCount });
        }
      } else {
        // 新生词 — 加入生词库
        const result = db.prepare(`
          INSERT INTO vocabulary (user_id, word, click_count, skip_count, status, first_seen_article_id, last_seen_article_id)
          VALUES (?, ?, 1, 0, 'active', ?, ?)
        `).run(userId, word, articleId, articleId);

        newWordsCount++;

        // 如果提供了释义，存入 word_meanings
        if (wordMeanings && wordMeanings[word]) {
          db.prepare(`
            INSERT INTO word_meanings (vocabulary_id, article_id, meaning, context_sentence)
            VALUES (?, ?, ?, ?)
          `).run(
            result.lastInsertRowid,
            articleId,
            wordMeanings[word].meaning || '',
            wordMeanings[word].context_sentence || ''
          );
        }
      }
    }

    // 2. 处理未点击但在生词库中的词（可能已掌握）— 只处理active状态的
    for (const word of articleWords) {
      if (clickedSet.has(word)) continue; // 跳过已点击的

      const existing = vocabMap[word];
      if (!existing) continue; // 不在生词库中，跳过
      if (existing.status !== 'active') continue; // 已mastered的不再处理skip

      // 这个词出现在文章中但用户没有点击 => skip_count + 1
      const newSkipCount = existing.skip_count + 1;

      if (newSkipCount >= 3) {
        // 连续3次以上未点击 => 掌握，标记为 mastered
        db.prepare(`
          UPDATE vocabulary SET skip_count = ?, status = 'mastered'
          WHERE id = ?
        `).run(newSkipCount, existing.id);
        masteredWordsCount++;
      } else {
        db.prepare(`
          UPDATE vocabulary SET skip_count = ?
          WHERE id = ?
        `).run(newSkipCount, existing.id);
      }
    }

    // 3. 为已存在的生词添加新的上下文释义
    for (const word of clickedWords) {
      if (wordMeanings && wordMeanings[word]) {
        const vocab = db.prepare(
          'SELECT id FROM vocabulary WHERE user_id = ? AND word = ?'
        ).get(userId, word);

        if (vocab) {
          // 检查是否已有该文章的释义
          const existingMeaning = db.prepare(
            'SELECT id FROM word_meanings WHERE vocabulary_id = ? AND article_id = ?'
          ).get(vocab.id, articleId);

          if (!existingMeaning && wordMeanings[word].meaning) {
            db.prepare(`
              INSERT INTO word_meanings (vocabulary_id, article_id, meaning, context_sentence)
              VALUES (?, ?, ?, ?)
            `).run(
              vocab.id,
              articleId,
              wordMeanings[word].meaning,
              wordMeanings[word].context_sentence || ''
            );
          }
        }
      }
    }

    // 4. 更新文章状态
    const unknownPercentage = articleWords.length > 0
      ? (clickedWords.length / articleWords.length) * 100
      : 0;

    db.prepare(`
      UPDATE articles SET 
        is_completed = 1,
        unknown_word_count = ?,
        unknown_percentage = ?,
        completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(clickedWords.length, Math.round(unknownPercentage * 10) / 10, articleId);

    // 5. 获取最新的生词库总数
    const { totalVocab } = db.prepare(
      "SELECT COUNT(*) as totalVocab FROM vocabulary WHERE user_id = ? AND status = 'active'"
    ).get(userId);

    // 6. 评估用户水平
    const recentSessions = db.prepare(`
      SELECT * FROM reading_sessions WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 10
    `).all(userId);

    const { estimateUserLevel } = require('../utils/difficulty');
    const allSessions = [...recentSessions, {
      article_difficulty: article.difficulty_level,
      unknown_percentage: unknownPercentage,
    }];
    const userLevelResult = estimateUserLevel(allSessions);

    // 7. 保存阅读会话报告
    db.prepare(`
      INSERT INTO reading_sessions (
        user_id, article_id, article_difficulty,
        new_words_count, repeated_words_count, mastered_words_count,
        high_freq_words, total_vocab_size, unknown_percentage, estimated_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId, articleId, article.difficulty_level,
      newWordsCount, repeatedWordsCount, masteredWordsCount,
      JSON.stringify(highFreqWords), totalVocab,
      Math.round(unknownPercentage * 10) / 10,
      userLevelResult.level
    );

    // 8. 更新用户水平（重读不增加文章计数）
    if (isReread) {
      db.prepare('UPDATE users SET estimated_level = ? WHERE id = ?')
        .run(userLevelResult.level, userId);
    } else {
      db.prepare('UPDATE users SET estimated_level = ?, total_articles_read = total_articles_read + 1 WHERE id = ?')
        .run(userLevelResult.level, userId);
    }

    // 9. 记录水平历史
    db.prepare(`
      INSERT INTO user_level_history (user_id, level, level_score, article_id, unknown_percentage, vocab_size)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, userLevelResult.level, userLevelResult.score, articleId, unknownPercentage, totalVocab);

    return {
      newWordsCount,
      repeatedWordsCount,
      masteredWordsCount,
      highFreqWords,
      totalVocab,
      unknownPercentage: Math.round(unknownPercentage * 10) / 10,
      userLevel: userLevelResult,
    };
  });

  const report = processVocab();

  res.json({
    message: '阅读完成！',
    report,
  });
});

// 编辑文章（更新标题或内容）
router.put('/:id', (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;
  const { title, content } = req.body;

  const article = db.prepare(
    'SELECT * FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);

  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  const newTitle = title !== undefined ? title.trim() : article.title;
  const newContent = content !== undefined ? content.trim() : article.content;

  if (!newTitle || !newContent) {
    return res.status(400).json({ error: '标题和内容不能为空' });
  }

  // 如果内容变了，重新评估难度
  let diffLevel = article.difficulty_level;
  let diffScore = article.difficulty_score;
  let wordCount = article.word_count;
  let uniqueWordCount = article.unique_word_count;

  if (newContent !== article.content) {
    const difficulty = assessDifficulty(newContent);
    const words = extractWords(newContent);
    const uniqueWords = [...new Set(words)];
    diffLevel = difficulty.level;
    diffScore = difficulty.score;
    wordCount = words.length;
    uniqueWordCount = uniqueWords.length;
  }

  db.prepare(`
    UPDATE articles SET
      title = ?, content = ?,
      difficulty_level = ?, difficulty_score = ?,
      word_count = ?, unique_word_count = ?
    WHERE id = ? AND user_id = ?
  `).run(newTitle, newContent, diffLevel, diffScore, wordCount, uniqueWordCount, articleId, userId);

  const updated = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);

  res.json({ message: '文章已更新', article: updated });
});

// 删除文章（保留生词库和释义数据）
router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;

  const article = db.prepare(
    'SELECT id FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);

  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  // 将 word_meanings 中关联此文章的释义 article_id 置为 0，保留释义数据
  db.prepare('UPDATE word_meanings SET article_id = 0 WHERE article_id = ?').run(articleId);

  // 删除该文章的点击记录
  db.prepare('DELETE FROM article_clicked_words WHERE article_id = ? AND user_id = ?').run(articleId, userId);

  // 删除文章本身（vocabulary 表不受影响）
  db.prepare('DELETE FROM articles WHERE id = ? AND user_id = ?').run(articleId, userId);

  res.json({ message: '文章已删除，生词库数据已保留' });
});

module.exports = router;
