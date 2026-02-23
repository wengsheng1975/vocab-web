/**
 * 阅读会话服务 — 处理完成阅读时的核心逻辑
 * 从 routes/articles.js 的 /:id/finish 端点中提取
 */
const db = require('../config/db');
const { extractWords, estimateUserLevel } = require('../utils/difficulty');

/**
 * 合并生词库：处理点击的单词，更新已有词的词频或新增生词
 * @returns {{ newWordsCount, repeatedWordsCount, highFreqWords }}
 */
function mergeVocabulary(userId, articleId, clickedWords, vocabMap) {
  let newWordsCount = 0;
  let repeatedWordsCount = 0;
  const highFreqWords = [];

  for (const word of clickedWords) {
    const existing = vocabMap[word];

    if (existing) {
      // 已在生词库中（可能是 active 或 mastered）— 词频+1，重置skip_count，恢复为active
      const newClickCount = existing.click_count + 1;
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
      db.prepare(`
        INSERT INTO vocabulary (user_id, word, click_count, skip_count, status, first_seen_article_id, last_seen_article_id)
        VALUES (?, ?, 1, 0, 'active', ?, ?)
      `).run(userId, word, articleId, articleId);

      newWordsCount++;
    }
  }

  return { newWordsCount, repeatedWordsCount, highFreqWords };
}

/**
 * 更新跳过计数：处理文章中出现但未被点击的生词（可能已掌握）
 * @returns {number} masteredWordsCount
 */
function updateSkipCounts(articleWords, clickedSet, vocabMap) {
  let masteredWordsCount = 0;

  for (const word of articleWords) {
    if (clickedSet.has(word)) continue;

    const existing = vocabMap[word];
    if (!existing) continue;
    if (existing.status !== 'active') continue;

    const newSkipCount = existing.skip_count + 1;

    if (newSkipCount >= 3) {
      // 连续3次以上未点击 => 掌握
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

  return masteredWordsCount;
}

/**
 * 保存单词释义：为点击的生词添加上下文释义（去重）
 */
function saveWordMeanings(userId, clickedWords, wordMeanings, articleId) {
  if (!wordMeanings) return;

  for (const word of clickedWords) {
    if (!wordMeanings[word] || !wordMeanings[word].meaning) continue;

    const vocab = db.prepare(
      'SELECT id FROM vocabulary WHERE user_id = ? AND word = ?'
    ).get(userId, word);

    if (!vocab) continue;

    // 检查是否已有该文章的释义
    const existingMeaning = db.prepare(
      'SELECT id FROM word_meanings WHERE vocabulary_id = ? AND article_id = ?'
    ).get(vocab.id, articleId);

    if (!existingMeaning) {
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

/**
 * 生成阅读会话报告，评估用户水平并保存
 * @returns {object} 完整的报告对象
 */
function generateSessionReport(userId, article, articleId, stats, isReread) {
  const { newWordsCount, repeatedWordsCount, masteredWordsCount, highFreqWords, unknownPercentage } = stats;

  // 更新文章状态
  db.prepare(`
    UPDATE articles SET 
      is_completed = 1,
      unknown_word_count = ?,
      unknown_percentage = ?,
      completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(stats.clickedWordsCount, Math.round(unknownPercentage * 10) / 10, articleId);

  // 获取最新的生词库总数
  const { totalVocab } = db.prepare(
    "SELECT COUNT(*) as totalVocab FROM vocabulary WHERE user_id = ? AND status = 'active'"
  ).get(userId);

  // 评估用户水平
  const recentSessions = db.prepare(`
    SELECT * FROM reading_sessions WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 10
  `).all(userId);

  const allSessions = [...recentSessions, {
    article_difficulty: article.difficulty_level,
    unknown_percentage: unknownPercentage,
  }];
  const userLevelResult = estimateUserLevel(allSessions);

  // 保存阅读会话报告
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

  // 更新用户水平（重读不增加文章计数）
  if (isReread) {
    db.prepare('UPDATE users SET estimated_level = ? WHERE id = ?')
      .run(userLevelResult.level, userId);
  } else {
    db.prepare('UPDATE users SET estimated_level = ?, total_articles_read = total_articles_read + 1 WHERE id = ?')
      .run(userLevelResult.level, userId);
  }

  // 记录水平历史
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
}

/**
 * 处理完成阅读的完整流程（在事务中执行）
 */
function processFinishReading(userId, articleId, article, wordMeanings) {
  const isReread = article.is_completed === 1;

  // 获取本次阅读中点击的所有生词
  const clickedWords = db.prepare(
    'SELECT DISTINCT word FROM article_clicked_words WHERE article_id = ? AND user_id = ?'
  ).all(articleId, userId).map(r => r.word);

  const clickedSet = new Set(clickedWords);

  // 获取文章中所有唯一单词
  const articleWords = [...new Set(extractWords(article.content))];

  // 获取用户当前生词库
  const currentVocab = db.prepare(
    'SELECT * FROM vocabulary WHERE user_id = ?'
  ).all(userId);
  const vocabMap = {};
  currentVocab.forEach(v => { vocabMap[v.word] = v; });

  // 1. 合并生词库
  const { newWordsCount, repeatedWordsCount, highFreqWords } = mergeVocabulary(userId, articleId, clickedWords, vocabMap);

  // 2. 更新跳过计数
  const masteredWordsCount = updateSkipCounts(articleWords, clickedSet, vocabMap);

  // 3. 保存释义
  saveWordMeanings(userId, clickedWords, wordMeanings, articleId);

  // 4. 计算生词率
  const unknownPercentage = articleWords.length > 0
    ? (clickedWords.length / articleWords.length) * 100
    : 0;

  // 5. 生成报告并更新用户状态
  return generateSessionReport(userId, article, articleId, {
    newWordsCount,
    repeatedWordsCount,
    masteredWordsCount,
    highFreqWords,
    clickedWordsCount: clickedWords.length,
    unknownPercentage,
  }, isReread);
}

module.exports = { processFinishReading };
