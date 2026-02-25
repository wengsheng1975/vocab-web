const express = require('express');
const path = require('path');
const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const db = require('../config/db');
const { authenticateToken, validateIdParam } = require('../middleware/auth');
const { extractWords, assessDifficulty, isDifficultyAppropriate } = require('../utils/difficulty');
const { getSpellingSuggestions } = require('../utils/spellCheck');
const { listSources: listCrawlerSources, fetchFeedPreview, fetchArticleByUrl } = require('../services/crawler/fetcher');
const { normalizeTargetLevel, getCrawlerLevelCandidates } = require('../constants/targetLevels');

const router = express.Router();
router.use(authenticateToken);

const MAX_ARTICLE_CONTENT_LENGTH = 1000000;
const MAX_TRANSLATE_SNIPPETS = 12;
const MAX_TRANSLATE_SNIPPET_LENGTH = 2400;
const OUTBOUND_USER_AGENT = process.env.OUTBOUND_USER_AGENT || 'EnglishReader/1.0';
const TRANSLATE_TARGET_LANG = process.env.TRANSLATE_TARGET_LANG || 'zh-CN';
const TRANSLATE_API_ENDPOINT = (() => {
  const fallback = 'https://translate.googleapis.com/translate_a/single';
  try {
    const base = process.env.TRANSLATE_API_BASE || 'https://translate.googleapis.com';
    const path = process.env.TRANSLATE_API_PATH || '/translate_a/single';
    return new URL(path, base).toString();
  } catch {
    return fallback;
  }
})();
const TRANSLATE_TIMEOUT_MS = (() => {
  const raw = Number(process.env.TRANSLATE_TIMEOUT_MS);
  if (!Number.isFinite(raw)) return 10000;
  return Math.min(30000, Math.max(3000, Math.trunc(raw)));
})();
const LANGUAGE_TOOL_URL = process.env.LANGUAGETOOL_API_URL || 'https://api.languagetool.org/v2/check';
const LANGUAGE_TOOL_LANGUAGE = process.env.LANGUAGETOOL_LANGUAGE || 'en-US';
const GRAMMAR_CHECK_TIMEOUT_MS = (() => {
  const raw = Number(process.env.GRAMMAR_CHECK_TIMEOUT_MS);
  if (!Number.isFinite(raw)) return 8000;
  return Math.min(30000, Math.max(3000, Math.trunc(raw)));
})();

// MIME 类型白名单（扩展名 + MIME 双重校验）
const ALLOWED_FILE_TYPES = {
  '.txt': ['text/plain'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.pdf': ['application/pdf'],
};

// 文件上传配置（内存存储，最大 5MB）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimes = ALLOWED_FILE_TYPES[ext];
    if (!allowedMimes) {
      return cb(new Error('不支持的文件格式，请上传 .txt、.docx 或 .pdf 文件'));
    }
    // MIME 类型校验（防止扩展名伪造）
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('文件类型与扩展名不匹配'));
    }
    cb(null, true);
  },
});

// 上传文件并解析为纯文本（multer 错误处理包装）
router.post('/upload-file', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '文件大小不能超过 5MB' });
      }
      return res.status(400).json({ error: err.message || '文件上传失败' });
    }
    next();
  });
}, async (req, res) => {
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
    // 不泄露内部错误细节给客户端
    res.status(500).json({ error: '文件解析失败，请确认文件格式正确且未损坏' });
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

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function normalizeImportedText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractIndexedWords(text) {
  const words = [];
  const regex = /([a-zA-Z]+)/g;
  let match;
  let idx = 0;
  while ((match = regex.exec(String(text || ''))) !== null) {
    words.push({ index: idx, word: match[1].toLowerCase() });
    idx += 1;
  }
  return words;
}

function parsePreferredStart(rawIndex) {
  if (typeof rawIndex === 'number' && Number.isInteger(rawIndex) && rawIndex >= 0) {
    return rawIndex;
  }
  if (typeof rawIndex === 'string' && rawIndex.trim()) {
    const first = rawIndex.split(',')[0];
    const num = Number(first);
    if (Number.isInteger(num) && num >= 0) return num;
  }
  return null;
}

function pickNearest(candidates, preferred) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  if (!Number.isInteger(preferred) || preferred < 0) return candidates[0];
  let best = candidates[0];
  let bestDist = Math.abs(best - preferred);
  for (let i = 1; i < candidates.length; i += 1) {
    const cand = candidates[i];
    const dist = Math.abs(cand - preferred);
    if (dist < bestDist) {
      best = cand;
      bestDist = dist;
    }
  }
  return best;
}

function findPhraseStartCandidates(wordRows, phraseWords) {
  const starts = [];
  if (!Array.isArray(phraseWords) || phraseWords.length < 2) return starts;
  const len = phraseWords.length;
  for (let i = 0; i <= wordRows.length - len; i += 1) {
    let ok = true;
    for (let j = 0; j < len; j += 1) {
      if (wordRows[i + j].word !== phraseWords[j]) {
        ok = false;
        break;
      }
    }
    if (ok) starts.push(i);
  }
  return starts;
}

function splitTextForTranslation(text, maxLen = 1200) {
  const source = String(text || '').trim();
  if (!source) return [];

  const chunks = [];
  let start = 0;
  while (start < source.length) {
    let end = Math.min(start + maxLen, source.length);
    if (end < source.length) {
      const window = source.slice(start, end);
      const nearestBreak = Math.max(
        window.lastIndexOf('\n'),
        window.lastIndexOf('. '),
        window.lastIndexOf('! '),
        window.lastIndexOf('? '),
        window.lastIndexOf('。'),
        window.lastIndexOf('！'),
        window.lastIndexOf('？')
      );
      if (nearestBreak > maxLen * 0.5) {
        end = start + nearestBreak + 1;
      }
    }
    chunks.push(source.slice(start, end));
    start = end;
  }
  return chunks.filter((c) => c.trim().length > 0);
}

async function translateChunkToChinese(chunkText) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: TRANSLATE_TARGET_LANG,
    dt: 't',
    q: chunkText,
  });
  const url = `${TRANSLATE_API_ENDPOINT}?${params.toString()}`;
  try {
    const resp = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': OUTBOUND_USER_AGENT },
    });
    if (!resp.ok) throw new Error(`translate failed with status ${resp.status}`);
    const json = await resp.json();
    if (!Array.isArray(json) || !Array.isArray(json[0])) return chunkText;
    const translated = json[0]
      .map((item) => (Array.isArray(item) ? String(item[0] || '') : ''))
      .join('');
    return translated || chunkText;
  } finally {
    clearTimeout(timeout);
  }
}

async function translateTextToChinese(text) {
  const chunks = splitTextForTranslation(text, 1200);
  const translated = [];
  for (const chunk of chunks) {
    const zh = await translateChunkToChinese(chunk);
    translated.push(zh);
  }
  return translated.join('\n');
}

function randomPick(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveCrawlerRecommendedLevel(userId) {
  const user = db.prepare(`
    SELECT estimated_level, target_level
    FROM users
    WHERE id = ?
  `).get(userId);

  const estimated = user?.estimated_level || 'unknown';
  const target = normalizeTargetLevel(user?.target_level || 'none');

  if (estimated !== 'unknown') {
    return { level: estimated, source: 'estimated_level' };
  }

  // 首次使用：按目标级别给一个随机基准等级，用于探索用户阶段水平
  const candidates = getCrawlerLevelCandidates(target);
  return { level: randomPick(candidates), source: `target_level_random(${target})` };
}

function parseOptionalFolderId(rawValue) {
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;
  const num = Number(rawValue);
  if (!Number.isInteger(num) || num <= 0) {
    throw badRequest('folderId 必须是正整数或 null');
  }
  return num;
}

function clampNumber(rawValue, min, max, fallback = 0) {
  const num = Number(rawValue);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function normalizeFolderName(rawName) {
  const safeName = typeof rawName === 'string' ? rawName.trim() : '';
  if (!safeName) {
    throw badRequest('文件夹名称不能为空');
  }
  if (safeName.length > 30) {
    throw badRequest('文件夹名称不能超过 30 个字符');
  }
  return safeName;
}

function getOwnedFolder(userId, folderId) {
  return db.prepare(
    'SELECT id, name FROM article_folders WHERE id = ? AND user_id = ?'
  ).get(folderId, userId);
}

function importArticleForUser({
  userId,
  title,
  content,
  sourceSite = '',
  sourceUrl = '',
  sourceAuthor = '',
  publishedAt = null,
  importedVia = 'manual',
}) {
  const safeTitle = typeof title === 'string' ? title.trim() : '';
  const safeContent = normalizeImportedText(content);
  const safeSourceSite = typeof sourceSite === 'string' ? sourceSite.slice(0, 100) : '';
  const safeSourceUrl = typeof sourceUrl === 'string' ? sourceUrl.trim().slice(0, 1000) : '';
  const safeSourceAuthor = typeof sourceAuthor === 'string' ? sourceAuthor.trim().slice(0, 100) : '';
  const safeImportedVia = typeof importedVia === 'string' ? importedVia.trim().slice(0, 20) : 'manual';

  if (!safeTitle || !safeContent) {
    throw badRequest('标题和内容都是必填项');
  }
  if (safeTitle.length > 200) {
    throw badRequest('标题长度应在 1-200 字符之间');
  }
  if (safeContent.length > MAX_ARTICLE_CONTENT_LENGTH) {
    throw badRequest('文章内容不能为空，且不超过 100 万字符');
  }

  let safePublishedAt = null;
  if (publishedAt) {
    const date = new Date(publishedAt);
    if (!Number.isNaN(date.getTime())) safePublishedAt = date.toISOString();
  }

  const difficulty = assessDifficulty(safeContent);
  const words = extractWords(safeContent);
  const uniqueWords = [...new Set(words)];

  const user = db.prepare('SELECT estimated_level FROM users WHERE id = ?').get(userId);
  const userLevel = user?.estimated_level ?? 'unknown';
  const appropriateness = isDifficultyAppropriate(difficulty.level, userLevel);

  try {
    const result = db.prepare(`
      INSERT INTO articles (
        user_id, title, content, difficulty_level, difficulty_score, word_count, unique_word_count,
        source_site, source_url, source_author, published_at, imported_via
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      safeTitle,
      safeContent,
      difficulty.level,
      difficulty.score,
      words.length,
      uniqueWords.length,
      safeSourceSite,
      safeSourceUrl,
      safeSourceAuthor,
      safePublishedAt,
      safeImportedVia,
    );

    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(result.lastInsertRowid);
    return { article, difficulty, appropriateness, duplicate: false };
  } catch (err) {
    const message = String(err?.message || '');
    const isSourceUrlUniqueConflict =
      safeSourceUrl &&
      (err?.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        message.includes('idx_articles_user_source_url_unique') ||
        message.includes('UNIQUE constraint failed: articles.user_id, articles.source_url'));

    if (isSourceUrlUniqueConflict) {
      const article = db.prepare(
        'SELECT * FROM articles WHERE user_id = ? AND source_url = ?'
      ).get(userId, safeSourceUrl);
      return { article, duplicate: true };
    }
    throw err;
  }
}

// 语法检查 API
router.post('/grammar-check', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.json({ source: 'none', issues: [] });
  }

  // 限制检查文本长度，防止滥用外部 API
  if (text.length > 50000) {
    return res.status(400).json({ error: '文本过长，语法检查最大支持 50000 字符' });
  }

  // 先尝试 LanguageTool API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GRAMMAR_CHECK_TIMEOUT_MS);

    const response = await fetch(LANGUAGE_TOOL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': OUTBOUND_USER_AGENT,
      },
      body: new URLSearchParams({
        text: text,
        language: LANGUAGE_TOOL_LANGUAGE,
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
          offset: Number(m.offset) || 0,
          length: Number(m.length) || 0,
          message: typeof m.message === 'string' ? m.message : '',
          rule: m.rule?.id || 'UNKNOWN',
          severity: isAuto ? 'auto' : 'warning',
          suggestions: (m.replacements || []).slice(0, 3).map(r => typeof r.value === 'string' ? r.value : ''),
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

// 导入文章（手动粘贴/编辑器输入）
router.post('/import', (req, res) => {
  const userId = req.user.id;
  const { title, content } = req.body;

  try {
    const imported = importArticleForUser({
      userId,
      title,
      content,
      importedVia: 'manual',
    });
    res.status(201).json(imported);
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) {
      console.error('导入文章失败:', err);
      return res.status(500).json({ error: '导入失败，请稍后重试' });
    }
    return res.status(status).json({ error: err.message });
  }
});

// 爬虫来源列表
router.get('/crawl-sources', (req, res) => {
  res.json({ sources: listCrawlerSources() });
});

// 抓取来源预览（先拿 RSS 列表）
router.post('/crawl-preview', async (req, res) => {
  const { source = 'chinadaily', limit = 5 } = req.body || {};
  try {
    const levelHint = resolveCrawlerRecommendedLevel(req.user.id);
    const data = await fetchFeedPreview(source, limit, { userLevel: levelHint.level });
    data.recommendation = {
      ...(data.recommendation || {}),
      userLevelSource: levelHint.source,
    };
    res.json(data);
  } catch (err) {
    const msg = err.message || '抓取预览失败';
    const status = msg.includes('不支持') ? 400 : 502;
    res.status(status).json({ error: msg });
  }
});

// 通过 URL 抓取并导入文章
router.post('/import-url', async (req, res) => {
  const userId = req.user.id;
  const { url, title } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: '请提供文章链接' });
  }

  try {
    const fetched = await fetchArticleByUrl(url);
    const imported = importArticleForUser({
      userId,
      title: (typeof title === 'string' && title.trim()) ? title.trim() : fetched.title,
      content: fetched.content,
      sourceSite: fetched.sourceSite,
      sourceUrl: fetched.sourceUrl,
      sourceAuthor: fetched.sourceAuthor,
      publishedAt: fetched.publishedAt,
      importedVia: 'url',
    });

    if (imported.duplicate) {
      return res.status(409).json({
        error: '该文章来源已导入',
        article: imported.article,
      });
    }
    return res.status(201).json(imported);
  } catch (err) {
    const msg = err.message || '链接抓取失败';
    const status = err.status || (msg.includes('URL') || msg.includes('白名单') ? 400 : 502);
    if (status >= 500) console.error('URL 导入失败:', err);
    return res.status(status).json({ error: msg });
  }
});

// 按来源抓取并批量导入
router.post('/crawl-source', async (req, res) => {
  const userId = req.user.id;
  const { source = 'chinadaily', limit = 3 } = req.body || {};
  const safeLimit = Math.max(1, Math.min(10, parseInt(limit, 10) || 3));

  try {
    const levelHint = resolveCrawlerRecommendedLevel(userId);
    const preview = await fetchFeedPreview(source, safeLimit, { userLevel: levelHint.level });
    const imported = [];
    const skipped = [];
    const failed = [];

    for (const item of preview.items) {
      try {
        const fetched = await fetchArticleByUrl(item.url, source);
        const inserted = importArticleForUser({
          userId,
          title: item.title || fetched.title,
          content: fetched.content,
          sourceSite: fetched.sourceSite,
          sourceUrl: fetched.sourceUrl,
          sourceAuthor: fetched.sourceAuthor,
          publishedAt: item.publishedAt || fetched.publishedAt,
          importedVia: 'crawler',
        });

        if (inserted.duplicate) {
          skipped.push({
            title: item.title || fetched.title,
            url: item.url,
            reason: 'duplicate',
            articleId: inserted.article?.id || null,
          });
          continue;
        }

        imported.push({
          id: inserted.article.id,
          title: inserted.article.title,
          url: item.url,
        });
      } catch (err) {
        failed.push({
          title: item.title || '',
          url: item.url,
          reason: err.message || '抓取失败',
        });
      }
    }

    return res.json({
      source: preview.source,
      recommendation: {
        ...(preview.recommendation || {}),
        userLevelSource: levelHint.source,
      },
      summary: {
        requested: safeLimit,
        fetched: preview.items.length,
        imported: imported.length,
        skipped: skipped.length,
        failed: failed.length,
      },
      imported,
      skipped,
      failed,
    });
  } catch (err) {
    const msg = err.message || '批量抓取失败';
    const status = msg.includes('不支持') ? 400 : 502;
    return res.status(status).json({ error: msg });
  }
});

// 获取用户文件夹列表
router.get('/folders', (req, res) => {
  const userId = req.user.id;

  const folders = db.prepare(`
    SELECT id, name, created_at
    FROM article_folders
    WHERE user_id = ?
    ORDER BY created_at ASC
  `).all(userId);

  const countRows = db.prepare(`
    SELECT folder_id, COUNT(*) AS count
    FROM articles
    WHERE user_id = ?
    GROUP BY folder_id
  `).all(userId);

  const countMap = new Map();
  for (const row of countRows) {
    const key = row.folder_id === null ? 'null' : String(row.folder_id);
    countMap.set(key, row.count);
  }

  res.json({
    folders: folders.map((f) => ({
      ...f,
      articleCount: countMap.get(String(f.id)) || 0,
    })),
    uncategorizedCount: countMap.get('null') || 0,
  });
});

// 创建自定义文件夹
router.post('/folders', (req, res) => {
  const userId = req.user.id;
  let safeName = '';
  try {
    safeName = normalizeFolderName(req.body?.name);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  const duplicate = db.prepare(
    'SELECT id FROM article_folders WHERE user_id = ? AND LOWER(name) = LOWER(?)'
  ).get(userId, safeName);
  if (duplicate) {
    return res.status(409).json({ error: '该文件夹名称已存在' });
  }

  const result = db.prepare(`
    INSERT INTO article_folders (user_id, name)
    VALUES (?, ?)
  `).run(userId, safeName);

  const folder = db.prepare(
    'SELECT id, name, created_at FROM article_folders WHERE id = ?'
  ).get(result.lastInsertRowid);

  res.status(201).json({
    message: '文件夹创建成功',
    folder: { ...folder, articleCount: 0 },
  });
});

// 重命名文件夹
router.put('/folders/:id', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const folderId = Number(req.params.id);

  const folder = getOwnedFolder(userId, folderId);
  if (!folder) {
    return res.status(404).json({ error: '文件夹不存在' });
  }

  let safeName = '';
  try {
    safeName = normalizeFolderName(req.body?.name);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  const isSameName = folder.name.trim().toLowerCase() === safeName.toLowerCase();
  if (isSameName) {
    return res.json({
      message: '文件夹名称未变化',
      folder: { id: folder.id, name: folder.name },
    });
  }

  const duplicate = db.prepare(`
    SELECT id
    FROM article_folders
    WHERE user_id = ? AND LOWER(name) = LOWER(?) AND id <> ?
  `).get(userId, safeName, folderId);

  if (duplicate) {
    return res.status(409).json({ error: '该文件夹名称已存在' });
  }

  db.prepare(`
    UPDATE article_folders
    SET name = ?
    WHERE id = ? AND user_id = ?
  `).run(safeName, folderId, userId);

  const updated = db.prepare(`
    SELECT id, name, created_at
    FROM article_folders
    WHERE id = ? AND user_id = ?
  `).get(folderId, userId);

  const countRow = db.prepare(`
    SELECT COUNT(*) AS articleCount
    FROM articles
    WHERE user_id = ? AND folder_id = ?
  `).get(userId, folderId);

  res.json({
    message: '文件夹重命名成功',
    folder: {
      ...updated,
      articleCount: countRow?.articleCount || 0,
    },
  });
});

// 删除文件夹（文件夹内文章自动回到未分类）
router.delete('/folders/:id', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const folderId = Number(req.params.id);

  const folder = getOwnedFolder(userId, folderId);
  if (!folder) {
    return res.status(404).json({ error: '文件夹不存在' });
  }

  let movedCount = 0;
  const txn = db.transaction(() => {
    movedCount = db.prepare(`
      UPDATE articles
      SET folder_id = NULL
      WHERE user_id = ? AND folder_id = ?
    `).run(userId, folderId).changes;

    db.prepare('DELETE FROM article_folders WHERE id = ? AND user_id = ?').run(folderId, userId);
  });
  txn();

  res.json({
    message: '文件夹已删除，文章已移回未分类',
    movedCount,
  });
});

// 拖拽移动文章到文件夹（folderId 为 null 表示移到未分类）
router.post('/:id/move-folder', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const articleId = Number(req.params.id);

  let folderId = null;
  try {
    folderId = parseOptionalFolderId(req.body?.folderId);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  const article = db.prepare(
    'SELECT id FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);
  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  let folderName = null;
  if (folderId !== null) {
    const folder = getOwnedFolder(userId, folderId);
    if (!folder) {
      return res.status(404).json({ error: '目标文件夹不存在' });
    }
    folderName = folder.name;
  }

  db.prepare(`
    UPDATE articles
    SET folder_id = ?
    WHERE id = ? AND user_id = ?
  `).run(folderId, articleId, userId);

  const updated = db.prepare(`
    SELECT a.id, a.title, a.folder_id
    FROM articles a
    WHERE a.id = ? AND a.user_id = ?
  `).get(articleId, userId);

  res.json({
    message: folderId === null ? '已移到未分类' : `已移到文件夹「${folderName}」`,
    article: { ...updated, folder_name: folderName },
  });
});

// 获取用户所有文章列表（必须放在 /:id 之前，否则 GET /api/articles 会被当作 id 匹配）
router.get('/', (req, res) => {
  const userId = req.user.id;

  const articles = db.prepare(`
    SELECT a.id, a.title, a.difficulty_level, a.difficulty_score, a.word_count, a.unique_word_count,
           a.unknown_word_count, a.unknown_percentage, a.is_completed,
           a.source_site, a.source_url, a.source_author, a.published_at, a.imported_via,
           a.folder_id, f.name AS folder_name,
           a.created_at, a.completed_at
    FROM articles a
    LEFT JOIN article_folders f ON a.folder_id = f.id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
  `).all(userId);

  res.json({ articles });
});

// 未读完文章列表（Dashboard「继续阅读」用；须在 /:id 之前定义）
router.get('/reading/unfinished', (req, res) => {
  const userId = req.user.id;
  const rows = db.prepare(`
    SELECT id, title FROM articles
    WHERE user_id = ? AND is_completed = 0
    ORDER BY created_at DESC
    LIMIT 20
  `).all(userId);
  // 若有 reading_progress 表可在此 JOIN 取 scroll_percentage；暂无则默认 0
  let unfinished = rows.map(r => ({ id: r.id, title: r.title, scroll_percentage: 0 }));
  try {
    const withProgress = db.prepare(`
      SELECT a.id, a.title, COALESCE(rp.scroll_percentage, 0) as scroll_percentage
      FROM articles a
      LEFT JOIN reading_progress rp ON rp.article_id = a.id AND rp.user_id = a.user_id
      WHERE a.user_id = ? AND a.is_completed = 0
      ORDER BY a.created_at DESC
      LIMIT 20
    `).all(userId);
    unfinished = withProgress.map(r => ({
      id: r.id,
      title: r.title,
      scroll_percentage: Math.round(Number(r.scroll_percentage) || 0),
    }));
  } catch {
    // reading_progress 表可能不存在，沿用默认 0
  }
  res.json({ unfinished });
});

// 获取文章详情（用于阅读界面）
router.get('/:id', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;

  const article = db.prepare(`
    SELECT a.*, f.name AS folder_name
    FROM articles a
    LEFT JOIN article_folders f ON a.folder_id = f.id
    WHERE a.id = ? AND a.user_id = ?
  `).get(articleId, userId);

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

// 临时翻译（不落库）：阅读页切换中文时使用
router.post('/:id/translate', validateIdParam, async (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;

  const article = db.prepare(
    'SELECT id, title, content FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);
  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  const sourceText = String(article.content || '').trim();
  const sourceTitle = String(article.title || '').trim();
  const titleOnly = req.body?.titleOnly === true;

  if (!titleOnly && !sourceText) {
    return res.status(400).json({ error: '文章内容为空，无法翻译' });
  }

  try {
    if (titleOnly) {
      const translatedTitle = sourceTitle ? await translateTextToChinese(sourceTitle) : '';
      return res.json({ translatedTitle, translatedContent: '' });
    }

    const [translatedContent, translatedTitle] = await Promise.all([
      translateTextToChinese(sourceText),
      sourceTitle ? translateTextToChinese(sourceTitle) : Promise.resolve(''),
    ]);
    return res.json({ translatedContent, translatedTitle });
  } catch (err) {
    console.error('文章翻译失败:', err);
    return res.status(502).json({ error: '翻译服务暂时不可用，请稍后再试' });
  }
});

// 按段落/片段翻译（用于长文滚动时动态翻译）
router.post('/:id/translate-snippets', validateIdParam, async (req, res) => {
  const userId = req.user.id;
  const articleId = Number(req.params.id);
  const rawSnippets = req.body?.snippets;

  const article = db.prepare(
    'SELECT id FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);
  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  if (!Array.isArray(rawSnippets)) {
    return res.status(400).json({ error: 'snippets 必须是数组' });
  }
  if (rawSnippets.length === 0) {
    return res.json({ translatedSnippets: [] });
  }
  if (rawSnippets.length > MAX_TRANSLATE_SNIPPETS) {
    return res.status(400).json({ error: `单次最多翻译 ${MAX_TRANSLATE_SNIPPETS} 段` });
  }

  const normalized = rawSnippets.map((item) => String(item || '').trim());
  for (const snippet of normalized) {
    if (!snippet) {
      return res.status(400).json({ error: '翻译片段不能为空' });
    }
    if (snippet.length > MAX_TRANSLATE_SNIPPET_LENGTH) {
      return res.status(400).json({ error: `单段长度不能超过 ${MAX_TRANSLATE_SNIPPET_LENGTH} 字符` });
    }
  }

  try {
    const translatedSnippets = await Promise.all(
      normalized.map((snippet) => translateTextToChinese(snippet))
    );
    return res.json({ translatedSnippets });
  } catch (err) {
    console.error('片段翻译失败:', err);
    return res.status(502).json({ error: '翻译服务暂时不可用，请稍后再试' });
  }
});

// 保存阅读进度（滚动位置）
router.post('/:id/save-progress', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const articleId = Number(req.params.id);

  const article = db.prepare(
    'SELECT id FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);
  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  const scrollPosition = clampNumber(req.body?.scroll_position, 0, 99999999, 0);
  const scrollPercentage = clampNumber(req.body?.scroll_percentage, 0, 100, 0);
  const lastVisibleWordIndex = Math.max(0, parseInt(req.body?.last_visible_word_index, 10) || 0);

  db.prepare(`
    INSERT INTO reading_progress (user_id, article_id, scroll_position, scroll_percentage, last_visible_word_index, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, article_id) DO UPDATE SET
      scroll_position = excluded.scroll_position,
      scroll_percentage = excluded.scroll_percentage,
      last_visible_word_index = excluded.last_visible_word_index,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, articleId, scrollPosition, scrollPercentage, lastVisibleWordIndex);

  return res.json({
    message: '阅读进度已保存',
    progress: {
      scroll_position: Math.round(scrollPosition * 100) / 100,
      scroll_percentage: Math.round(scrollPercentage * 100) / 100,
      last_visible_word_index: lastVisibleWordIndex,
    },
  });
});

// 获取阅读进度（继续阅读）
router.get('/:id/progress', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const articleId = Number(req.params.id);

  const article = db.prepare(
    'SELECT id FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);
  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  const row = db.prepare(`
    SELECT scroll_position, scroll_percentage, last_visible_word_index, updated_at
    FROM reading_progress
    WHERE user_id = ? AND article_id = ?
  `).get(userId, articleId);

  if (!row) {
    return res.json({
      progress: {
        scroll_position: 0,
        scroll_percentage: 0,
        last_visible_word_index: 0,
        updated_at: null,
        has_progress: false,
      },
    });
  }

  return res.json({
    progress: {
      scroll_position: Number(row.scroll_position) || 0,
      scroll_percentage: Number(row.scroll_percentage) || 0,
      last_visible_word_index: Number(row.last_visible_word_index) || 0,
      updated_at: row.updated_at || null,
      has_progress: true,
    },
  });
});

// 删除阅读进度（例如完成阅读后）
router.delete('/:id/progress', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const articleId = Number(req.params.id);

  const article = db.prepare(
    'SELECT id FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);
  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  db.prepare(
    'DELETE FROM reading_progress WHERE article_id = ? AND user_id = ?'
  ).run(articleId, userId);

  return res.json({ message: '阅读进度已清除' });
});

// 在阅读过程中点击标记单词
router.post('/:id/click-word', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;
  const { word, wordIndex } = req.body;

  if (!word || typeof word !== 'string') {
    return res.status(400).json({ error: '请提供单词' });
  }

  // 输入净化：只允许字母（匹配前端 tokenizer 行为），长度限制
  const cleanWord = word.toLowerCase().trim();
  if (!/^[a-z]+$/.test(cleanWord) || cleanWord.length > 50) {
    return res.status(400).json({ error: '单词格式不正确' });
  }

  // wordIndex 校验
  const safeWordIndex = (typeof wordIndex === 'number' && Number.isInteger(wordIndex) && wordIndex >= 0)
    ? wordIndex : 0;

  const article = db.prepare(
    'SELECT id FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);

  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  // 检查是否已经在该文章中点击过
  const existing = db.prepare(
    'SELECT id FROM article_clicked_words WHERE article_id = ? AND user_id = ? AND word = ?'
  ).get(articleId, userId, cleanWord);

  if (existing) {
    return res.json({ message: '该单词已标记', word: cleanWord, alreadyClicked: true });
  }

  // 拼写检查：如果单词不在词库中，返回建议
  const spellResult = getSpellingSuggestions(cleanWord);

  // 记录点击
  db.prepare(
    'INSERT INTO article_clicked_words (article_id, user_id, word, word_index) VALUES (?, ?, ?, ?)'
  ).run(articleId, userId, cleanWord, safeWordIndex);

  res.json({
    message: '已标记',
    word: cleanWord,
    alreadyClicked: false,
    spelling: spellResult.isCorrect ? null : {
      suggestions: spellResult.suggestions.map(s => s.word),
    },
  });
});

// 拼写检查（独立端点，可用于任意场景）
router.post('/spell-check', (req, res) => {
  const { word } = req.body;
  if (!word || typeof word !== 'string') {
    return res.status(400).json({ error: '请提供单词' });
  }
  const result = getSpellingSuggestions(word.toLowerCase().trim());
  res.json(result);
});

// 标记词组
router.post('/:id/click-phrase', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;
  const { phrase, indices } = req.body;

  if (!phrase || !indices) {
    return res.status(400).json({ error: '请提供词组和位置' });
  }

  // 输入校验：词组应为空格分隔的小写字母序列
  if (typeof phrase !== 'string' || phrase.length > 200 || !/^[a-z]+( [a-z]+)+$/.test(phrase)) {
    return res.status(400).json({ error: '词组格式错误' });
  }

  // indices 校验：必须是非负整数数组
  if (!Array.isArray(indices) || indices.length < 2 ||
      !indices.every(i => typeof i === 'number' && Number.isInteger(i) && i >= 0)) {
    return res.status(400).json({ error: '词组位置数据格式错误' });
  }

  // 验证文章归属
  const article = db.prepare(
    'SELECT id FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);
  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  const indicesStr = indices.join(',');

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
router.post('/:id/unclick-phrase', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;
  const { phrase } = req.body;

  if (!phrase || typeof phrase !== 'string') {
    return res.status(400).json({ error: '请提供词组' });
  }

  // 验证文章归属
  const article = db.prepare(
    'SELECT id FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);
  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  db.prepare(
    'DELETE FROM article_clicked_words WHERE article_id = ? AND user_id = ? AND word = ?'
  ).run(articleId, userId, phrase);

  res.json({ message: '词组已取消标记', phrase });
});

// 取消标记单词
router.post('/:id/unclick-word', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;
  const { word } = req.body;

  if (!word || typeof word !== 'string') {
    return res.status(400).json({ error: '请提供单词' });
  }

  const cleanWord = word.toLowerCase().trim();
  if (!/^[a-z]+$/.test(cleanWord) || cleanWord.length > 50) {
    return res.status(400).json({ error: '单词格式不正确' });
  }

  // 验证文章归属
  const article = db.prepare(
    'SELECT id FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);
  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  db.prepare(
    'DELETE FROM article_clicked_words WHERE article_id = ? AND user_id = ? AND word = ?'
  ).run(articleId, userId, cleanWord);

  res.json({ message: '已取消标记', word: cleanWord });
});

// 并发控制：防止同一文章同时提交多次 finish
const finishLocks = new Set();

// 完成阅读 — 这是核心逻辑：合并生词库 + 生成报告
router.post('/:id/finish', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;
  const { wordMeanings: rawWordMeanings } = req.body;

  // 并发防护：同一用户同一文章不能同时 finish
  const lockKey = `${userId}:${articleId}`;
  if (finishLocks.has(lockKey)) {
    return res.status(409).json({ error: '正在处理中，请勿重复提交' });
  }
  finishLocks.add(lockKey);

  try {
    // wordMeanings 输入校验与净化
    let wordMeanings = null;
    if (rawWordMeanings && typeof rawWordMeanings === 'object' && !Array.isArray(rawWordMeanings)) {
      wordMeanings = {};
      for (const [key, val] of Object.entries(rawWordMeanings)) {
        if (typeof key !== 'string' || key.length > 200) continue;
        if (!val || typeof val !== 'object') continue;
        wordMeanings[key] = {
          meaning: (typeof val.meaning === 'string' && val.meaning.length <= 500) ? val.meaning : '',
          context_sentence: (typeof val.context_sentence === 'string' && val.context_sentence.length <= 1000) ? val.context_sentence : '',
        };
      }
    }

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
          // 已在生词库中 — 词频+1，重置skip_count，恢复为active
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
          const result = db.prepare(`
            INSERT INTO vocabulary (user_id, word, click_count, skip_count, status, first_seen_article_id, last_seen_article_id)
            VALUES (?, ?, 1, 0, 'active', ?, ?)
          `).run(userId, word, articleId, articleId);

          newWordsCount++;

          // 如果提供了有效释义，存入 word_meanings
          const meaningText = typeof wordMeanings?.[word]?.meaning === 'string'
            ? wordMeanings[word].meaning.trim()
            : '';
          if (meaningText) {
            db.prepare(`
              INSERT INTO word_meanings (vocabulary_id, article_id, meaning, context_sentence)
              VALUES (?, ?, ?, ?)
            `).run(
              result.lastInsertRowid,
              articleId,
              meaningText,
              wordMeanings[word].context_sentence || ''
            );
          }
        }
      }

      // 2. 处理未点击但在生词库中的词（可能已掌握）— 只处理active状态的
      for (const word of articleWords) {
        if (clickedSet.has(word)) continue;

        const existing = vocabMap[word];
        if (!existing) continue;
        if (existing.status !== 'active') continue;

        const newSkipCount = existing.skip_count + 1;

        if (newSkipCount >= 3) {
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

      // 3. 为已存在的生词添加新的上下文释义（仅针对非新词，新词已在步骤1处理）
      for (const word of clickedWords) {
        if (wordMeanings && wordMeanings[word]) {
          const vocab = db.prepare(
            'SELECT id FROM vocabulary WHERE user_id = ? AND word = ?'
          ).get(userId, word);

          if (vocab) {
            const existingMeaning = db.prepare(
              'SELECT id FROM word_meanings WHERE vocabulary_id = ? AND article_id = ?'
            ).get(vocab.id, articleId);

            const meaningText = typeof wordMeanings[word].meaning === 'string'
              ? wordMeanings[word].meaning.trim()
              : '';
            if (!existingMeaning && meaningText) {
              db.prepare(`
                INSERT INTO word_meanings (vocabulary_id, article_id, meaning, context_sentence)
                VALUES (?, ?, ?, ?)
              `).run(
                vocab.id,
                articleId,
                meaningText,
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
        SELECT rs.*
        FROM reading_sessions rs
        LEFT JOIN users u ON u.id = rs.user_id
        WHERE rs.user_id = ?
          AND (u.level_reset_at IS NULL OR rs.created_at >= u.level_reset_at)
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

  } catch (err) {
    console.error('完成阅读失败:', err);
    res.status(500).json({ error: '完成阅读处理失败，请重试' });
  } finally {
    finishLocks.delete(lockKey);
  }
});

// 编辑文章（更新标题或内容）
router.put('/:id', validateIdParam, (req, res) => {
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
  if (newContent.length > MAX_ARTICLE_CONTENT_LENGTH) {
    return res.status(400).json({ error: '文章内容不能为空，且不超过 100 万字符' });
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

  const updateArticleAndReconcile = db.transaction(() => {
    db.prepare(`
      UPDATE articles SET
        title = ?, content = ?,
        difficulty_level = ?, difficulty_score = ?,
        word_count = ?, unique_word_count = ?
      WHERE id = ? AND user_id = ?
    `).run(newTitle, newContent, diffLevel, diffScore, wordCount, uniqueWordCount, articleId, userId);

    if (newContent === article.content) {
      return;
    }

    const wordRows = extractIndexedWords(newContent);
    const clickedRows = db.prepare(`
      SELECT id, word, word_index
      FROM article_clicked_words
      WHERE article_id = ? AND user_id = ?
    `).all(articleId, userId);

    for (const row of clickedRows) {
      const clickedText = String(row.word || '').toLowerCase().trim();
      if (!clickedText) {
        db.prepare('DELETE FROM article_clicked_words WHERE id = ?').run(row.id);
        continue;
      }

      // 词组：保留仍能在新内容中连续匹配到的词组，并重算索引
      if (clickedText.includes(' ')) {
        const phraseWords = clickedText.split(/\s+/).filter(Boolean);
        if (phraseWords.length < 2) {
          db.prepare('DELETE FROM article_clicked_words WHERE id = ?').run(row.id);
          continue;
        }

        const candidates = findPhraseStartCandidates(wordRows, phraseWords);
        const preferredStart = parsePreferredStart(row.word_index);
        const chosenStart = pickNearest(candidates, preferredStart);

        if (chosenStart === null) {
          db.prepare('DELETE FROM article_clicked_words WHERE id = ?').run(row.id);
          continue;
        }

        const indices = Array.from({ length: phraseWords.length }, (_, i) => chosenStart + i).join(',');
        db.prepare('UPDATE article_clicked_words SET word_index = ? WHERE id = ?').run(indices, row.id);
        continue;
      }

      // 单词：保留仍存在的单词，并把索引对齐到最近位置；否则删除
      const candidates = wordRows.filter((w) => w.word === clickedText).map((w) => w.index);
      const preferredStart = parsePreferredStart(row.word_index);
      const chosenIndex = pickNearest(candidates, preferredStart);

      if (chosenIndex === null) {
        db.prepare('DELETE FROM article_clicked_words WHERE id = ?').run(row.id);
        continue;
      }

      db.prepare('UPDATE article_clicked_words SET word_index = ? WHERE id = ?').run(chosenIndex, row.id);
    }

    const clickedCountRow = db.prepare(`
      SELECT COUNT(DISTINCT word) AS clicked_count
      FROM article_clicked_words
      WHERE article_id = ? AND user_id = ?
    `).get(articleId, userId);

    const clickedCount = Number(clickedCountRow?.clicked_count || 0);
    const unknownPercentage = uniqueWordCount > 0
      ? Math.round((clickedCount / uniqueWordCount) * 1000) / 10
      : 0;

    db.prepare(`
      UPDATE articles
      SET unknown_word_count = ?, unknown_percentage = ?
      WHERE id = ? AND user_id = ?
    `).run(clickedCount, unknownPercentage, articleId, userId);
  });

  updateArticleAndReconcile();

  const updated = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);

  res.json({ message: '文章已更新', article: updated });
});

// 删除文章（保留生词库和释义数据）
router.delete('/:id', validateIdParam, (req, res) => {
  const userId = req.user.id;
  const articleId = req.params.id;

  const article = db.prepare(
    'SELECT id FROM articles WHERE id = ? AND user_id = ?'
  ).get(articleId, userId);

  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }

  // 将 word_meanings 中关联此文章的释义 article_id 置为 NULL，保留释义数据
  db.prepare('UPDATE word_meanings SET article_id = NULL WHERE article_id = ?').run(articleId);

  // 删除该文章的点击记录
  db.prepare('DELETE FROM article_clicked_words WHERE article_id = ? AND user_id = ?').run(articleId, userId);

  // 显式清理阅读进度（兼容旧库中可能缺失外键级联的情况）
  try {
    db.prepare('DELETE FROM reading_progress WHERE article_id = ? AND user_id = ?').run(articleId, userId);
  } catch {
    // reading_progress 表可能不存在，忽略
  }

  // 删除文章本身（vocabulary 表不受影响）
  db.prepare('DELETE FROM articles WHERE id = ? AND user_id = ?').run(articleId, userId);

  res.json({ message: '文章已删除，生词库数据已保留' });
});

module.exports = router;
