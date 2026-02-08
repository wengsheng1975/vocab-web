/**
 * 拼写检查与建议模块
 * 基于编辑距离（Levenshtein）在词库中查找拼写相近的单词
 */
const { CET4_WORDS, CET6_ALL } = require('./cetWords');
const { getAllCommonWords } = require('./commonWords');

// 合并所有已知单词（含常见派生形式）为拼写检查词库
let ALL_KNOWN_WORDS = null;
function getKnownWords() {
  if (!ALL_KNOWN_WORDS) {
    const base = new Set([...getAllCommonWords(), ...CET6_ALL]);
    ALL_KNOWN_WORDS = new Set(base);

    // 为每个基础词生成常见派生形式
    for (const w of base) {
      if (w.length < 2) continue;
      const last = w[w.length - 1];
      const isConsonant = !'aeiou'.includes(last);
      const endsE = last === 'e';
      const endsY = last === 'y' && w.length > 2 && !'aeiou'.includes(w[w.length - 2]);

      // -s / -es
      if (endsY) {
        ALL_KNOWN_WORDS.add(w.slice(0, -1) + 'ies');  // study → studies
      } else if ('sxz'.includes(last) || w.endsWith('ch') || w.endsWith('sh')) {
        ALL_KNOWN_WORDS.add(w + 'es');  // box → boxes
      } else {
        ALL_KNOWN_WORDS.add(w + 's');   // dog → dogs
      }

      // CVC 双写检测：run→runn+ing, stop→stopp+ed 等
      const vowels = 'aeiou';
      const isCVC = w.length >= 3
        && isConsonant
        && vowels.includes(w[w.length - 2])
        && !vowels.includes(w[w.length - 3]);
      const doubled = isCVC && w.length <= 6 ? w + last : null; // run→runn

      // -ed
      if (endsE) {
        ALL_KNOWN_WORDS.add(w + 'd');       // love → loved
      } else if (endsY) {
        ALL_KNOWN_WORDS.add(w.slice(0, -1) + 'ied');  // study → studied
      } else if (doubled) {
        ALL_KNOWN_WORDS.add(doubled + 'ed');  // stop → stopped（仅双写形式）
      } else {
        ALL_KNOWN_WORDS.add(w + 'ed');      // play → played
      }

      // -ing
      if (endsE) {
        ALL_KNOWN_WORDS.add(w.slice(0, -1) + 'ing');  // make → making
      } else if (doubled) {
        ALL_KNOWN_WORDS.add(doubled + 'ing');  // run → running（仅双写形式）
      } else {
        ALL_KNOWN_WORDS.add(w + 'ing');     // play → playing
      }

      // -er / -est (形容词)
      if (w.length <= 7) {
        if (endsE) {
          ALL_KNOWN_WORDS.add(w + 'r');     // large → larger
          ALL_KNOWN_WORDS.add(w + 'st');    // large → largest
        } else if (endsY) {
          ALL_KNOWN_WORDS.add(w.slice(0, -1) + 'ier');  // happy → happier
          ALL_KNOWN_WORDS.add(w.slice(0, -1) + 'iest'); // happy → happiest
        } else if (doubled) {
          ALL_KNOWN_WORDS.add(doubled + 'er');   // big → bigger（仅双写形式）
          ALL_KNOWN_WORDS.add(doubled + 'est');  // big → biggest
        } else {
          ALL_KNOWN_WORDS.add(w + 'er');    // tall → taller
          ALL_KNOWN_WORDS.add(w + 'est');   // tall → tallest
        }
      }

      // -ly
      if (endsY) {
        ALL_KNOWN_WORDS.add(w.slice(0, -1) + 'ily');  // happy → happily
      } else if (!w.endsWith('ly')) {
        ALL_KNOWN_WORDS.add(w + 'ly');      // quick → quickly
      }
    }
  }
  return ALL_KNOWN_WORDS;
}

/**
 * 计算两个字符串的 Levenshtein 编辑距离
 */
function editDistance(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const m = a.length, n = b.length;
  // 优化：只保留两行
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // 删除
        curr[j - 1] + 1,  // 插入
        prev[j - 1] + cost // 替换
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * 检查单词是否是已知正确单词
 */
function isKnownWord(word) {
  return getKnownWords().has(word.toLowerCase().trim());
}

/**
 * 获取拼写建议（最多返回 5 个）
 * @param {string} word - 待检查的单词
 * @param {number} maxDistance - 最大编辑距离（默认 2）
 * @returns {{ isCorrect: boolean, suggestions: Array<{ word: string, distance: number }> }}
 */
function getSpellingSuggestions(word, maxDistance = 2) {
  const w = word.toLowerCase().trim();
  const known = getKnownWords();

  // 如果是已知单词，不需要建议
  if (known.has(w)) {
    return { isCorrect: true, suggestions: [] };
  }

  // 长度差异超过 maxDistance 的词不可能在编辑距离内，提前过滤
  const minLen = Math.max(2, w.length - maxDistance);
  const maxLen = w.length + maxDistance;

  const candidates = [];

  for (const dictWord of known) {
    if (dictWord.length < minLen || dictWord.length > maxLen) continue;

    // 快速过滤：首字母不同 且 前两个字母都不同 → 跳过
    if (dictWord[0] !== w[0] && (w.length < 2 || dictWord.length < 2 || dictWord[1] !== w[1])) continue;

    const dist = editDistance(w, dictWord);
    if (dist <= maxDistance && dist > 0) {
      candidates.push({ word: dictWord, distance: dist });
    }
  }

  // 按编辑距离排序，距离相同时按字母序
  candidates.sort((a, b) => a.distance - b.distance || a.word.localeCompare(b.word));

  return {
    isCorrect: false,
    suggestions: candidates.slice(0, 5),
  };
}

module.exports = { isKnownWord, getSpellingSuggestions, editDistance };
