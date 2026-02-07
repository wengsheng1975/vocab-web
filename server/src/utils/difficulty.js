const { isCommonWord, getWordLevel, getAllCommonWords } = require('./commonWords');

/**
 * 从文本中提取纯英文单词
 */
function extractWords(text) {
  const matches = text.match(/[a-zA-Z]+/g) || [];
  return matches.map(w => w.toLowerCase()).filter(w => w.length >= 2);
}

/**
 * 评估文章难度
 * 返回 { level, score, details }
 *   level: A1, A2, B1, B2, C1, C2
 *   score: 0-100 数值分数
 *   details: 详细分析数据
 */
function assessDifficulty(text) {
  const words = extractWords(text);
  if (words.length === 0) {
    return { level: 'unknown', score: 0, details: {} };
  }

  const uniqueWords = [...new Set(words)];
  const allCommon = getAllCommonWords();

  // 1. 平均词长
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

  // 2. 常用词占比
  const commonCount = uniqueWords.filter(w => allCommon.has(w)).length;
  const commonRatio = commonCount / uniqueWords.length;

  // 3. 词汇等级分布
  const levelCounts = { A1: 0, A2: 0, B1: 0, 'B2+': 0 };
  uniqueWords.forEach(w => {
    const level = getWordLevel(w);
    levelCounts[level]++;
  });

  const advancedRatio = levelCounts['B2+'] / uniqueWords.length;

  // 4. 句子复杂度（平均句长）
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0
    ? words.length / sentences.length
    : words.length;

  // 5. 词汇多样性（type-token ratio）
  const ttr = uniqueWords.length / words.length;

  // 综合评分 (0-100)
  let score = 0;

  // 常用词占比越低，难度越高 (权重 40%)
  score += (1 - commonRatio) * 40;

  // 高级词占比 (权重 25%)
  score += advancedRatio * 25;

  // 平均词长 (权重 15%, 归一化到 3-10)
  score += Math.min(1, Math.max(0, (avgWordLength - 3) / 7)) * 15;

  // 平均句长 (权重 10%, 归一化到 5-30)
  score += Math.min(1, Math.max(0, (avgSentenceLength - 5) / 25)) * 10;

  // 词汇多样性 (权重 10%)
  score += ttr * 10;

  score = Math.round(score * 10) / 10;

  // 确定等级
  let level;
  if (score <= 15) level = 'A1';
  else if (score <= 25) level = 'A2';
  else if (score <= 40) level = 'B1';
  else if (score <= 55) level = 'B2';
  else if (score <= 70) level = 'C1';
  else level = 'C2';

  return {
    level,
    score,
    details: {
      wordCount: words.length,
      uniqueWordCount: uniqueWords.length,
      avgWordLength: Math.round(avgWordLength * 10) / 10,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      commonRatio: Math.round(commonRatio * 1000) / 10,
      advancedRatio: Math.round(advancedRatio * 1000) / 10,
      ttr: Math.round(ttr * 1000) / 10,
      levelDistribution: levelCounts,
    },
  };
}

/**
 * 根据用户的阅读历史评估用户英语水平
 */
function estimateUserLevel(readingSessions) {
  if (!readingSessions || readingSessions.length === 0) {
    return { level: 'unknown', score: 0 };
  }

  // 取最近的 10 次阅读
  const recent = readingSessions.slice(-10);

  // 加权平均：最近的阅读权重更大
  let totalWeight = 0;
  let weightedScore = 0;

  recent.forEach((session, index) => {
    const weight = index + 1; // 越近权重越大
    totalWeight += weight;

    // 用户水平 = 文章难度 * (1 - 生词率)
    // 生词率越低说明对该难度文章掌握得越好
    const masteryFactor = 1 - (session.unknown_percentage / 100);
    const difficultyMap = { A1: 10, A2: 25, B1: 40, B2: 55, C1: 70, C2: 85 };
    const articleScore = difficultyMap[session.article_difficulty] || 30;
    const userScore = articleScore * (0.5 + masteryFactor * 0.5);

    weightedScore += userScore * weight;
  });

  const avgScore = weightedScore / totalWeight;

  let level;
  if (avgScore <= 15) level = 'A1';
  else if (avgScore <= 25) level = 'A2';
  else if (avgScore <= 40) level = 'B1';
  else if (avgScore <= 55) level = 'B2';
  else if (avgScore <= 70) level = 'C1';
  else level = 'C2';

  return { level, score: Math.round(avgScore * 10) / 10 };
}

/**
 * 判断文章难度是否适合用户
 */
function isDifficultyAppropriate(articleDifficulty, userLevel) {
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const articleIdx = levelOrder.indexOf(articleDifficulty);
  const userIdx = levelOrder.indexOf(userLevel);

  if (userIdx === -1) return { appropriate: true, message: '暂无足够数据评估你的水平，请继续阅读' };
  if (articleIdx === -1) return { appropriate: true, message: '' };

  const diff = articleIdx - userIdx;
  if (diff <= 1 && diff >= -1) {
    return { appropriate: true, message: '这篇文章难度适合你当前水平' };
  } else if (diff > 1) {
    return {
      appropriate: false,
      message: `这篇文章难度为 ${articleDifficulty}，高于你当前水平 ${userLevel}，建议选择更简单的文章`,
    };
  } else {
    return {
      appropriate: true,
      message: `这篇文章难度为 ${articleDifficulty}，低于你当前水平 ${userLevel}，适合巩固`,
    };
  }
}

module.exports = { extractWords, assessDifficulty, estimateUserLevel, isDifficultyAppropriate };
