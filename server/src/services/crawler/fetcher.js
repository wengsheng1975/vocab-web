const {
  getSource,
  listSources,
  detectSourceByUrl,
  normalizeAndValidateUrl,
} = require('./sources');
const { assessDifficulty } = require('../../utils/difficulty');

const FETCH_TIMEOUT_MS = 12000;
const CRAWLER_UA = 'EnglishReaderCrawler/1.0 (+http://localhost)';
const ALLOW_INSECURE_TLS = process.env.CRAWLER_INSECURE_TLS === 'true';

if (ALLOW_INSECURE_TLS) {
  // 仅在显式开启时用于开发环境排查证书问题
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('[crawler] CRAWLER_INSECURE_TLS=true: 已禁用证书校验（仅限开发环境）');
}

function decodeHtmlEntities(input) {
  if (!input) return '';
  return String(input)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function normalizeWhitespace(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00a0]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripTags(html) {
  return decodeHtmlEntities(String(html || '').replace(/<[^>]+>/g, ' '));
}

function extractMeta(html, key) {
  const safe = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]*property=["']${safe}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]*name=["']${safe}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(property|name)=["']${safe}["'][^>]*>`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decodeHtmlEntities(m[1]).trim();
  }
  return '';
}

function extractTitle(html) {
  return (
    extractMeta(html, 'og:title') ||
    extractMeta(html, 'twitter:title') ||
    decodeHtmlEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').trim()
  );
}

function extractPublishedAt(html) {
  const candidates = [
    extractMeta(html, 'article:published_time'),
    extractMeta(html, 'pubdate'),
    extractMeta(html, 'publishdate'),
    extractMeta(html, 'date'),
  ].filter(Boolean);

  for (const raw of candidates) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  const rawTime = (html.match(/<time[^>]*datetime=["']([^"']+)["'][^>]*>/i) || [])[1];
  if (rawTime) {
    const date = new Date(rawTime);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  return null;
}

function extractAuthor(html) {
  return (
    extractMeta(html, 'author') ||
    extractMeta(html, 'article:author') ||
    ''
  );
}

function extractParagraphContent(html) {
  const cleanedHtml = String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');

  const pMatches = cleanedHtml.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || [];
  const paragraphs = pMatches
    .map((p) => normalizeWhitespace(stripTags(p)))
    .filter((t) => t.length >= 30)
    .filter((t) => !/^copyright\b/i.test(t));

  if (paragraphs.length >= 3) {
    return normalizeWhitespace(paragraphs.join('\n\n'));
  }

  const bodyHtml = (cleanedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || [])[1] || cleanedHtml;
  const bodyText = normalizeWhitespace(stripTags(bodyHtml));
  return bodyText;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': CRAWLER_UA,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`抓取失败（HTTP ${res.status}）`);
    }

    return await res.text();
  } catch (err) {
    const reason = err?.cause?.message || err?.message || '网络请求失败';
    throw new Error(`抓取请求失败：${reason}`);
  } finally {
    clearTimeout(timer);
  }
}

function cleanXmlTagContent(value) {
  if (!value) return '';
  const withoutCdata = String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  return normalizeWhitespace(decodeHtmlEntities(withoutCdata));
}

function extractXmlTag(itemXml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = itemXml.match(re);
  return cleanXmlTagContent(m ? m[1] : '');
}

function parseRssItems(xml, limit) {
  const blocks = String(xml || '').match(/<item\b[\s\S]*?<\/item>/gi) || [];
  const seen = new Set();
  const items = [];

  for (const block of blocks) {
    const title = extractXmlTag(block, 'title');
    const url = extractXmlTag(block, 'link');
    const rawDate = extractXmlTag(block, 'pubDate') || extractXmlTag(block, 'dc:date') || extractXmlTag(block, 'date');

    if (!url || seen.has(url)) continue;
    seen.add(url);

    let publishedAt = null;
    if (rawDate) {
      const date = new Date(rawDate);
      if (!Number.isNaN(date.getTime())) publishedAt = date.toISOString();
    }

    items.push({ title, url, publishedAt });
    if (items.length >= limit) break;
  }

  return items;
}

function toDayKey(inputDate) {
  const d = new Date(inputDate);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function levelIndex(level) {
  const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  return order.indexOf(level);
}

function getFitTier(diff) {
  if (diff === null) return 0;
  if (diff === 0 || diff === 1) return 0; // 同级或稍高
  if (diff === -1 || diff === 2) return 1;
  return 2 + Math.abs(diff);
}

function sortByPublishedAtDesc(items) {
  return [...items].sort((a, b) => {
    const ta = a?.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b?.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });
}

function rankByLevelFitAndRecency(items, userLevel) {
  const userIdx = levelIndex(userLevel);
  return [...items].sort((a, b) => {
    const ai = levelIndex(a.difficultyLevel);
    const bi = levelIndex(b.difficultyLevel);
    const adiff = ai === -1 || userIdx === -1 ? null : (ai - userIdx);
    const bdiff = bi === -1 || userIdx === -1 ? null : (bi - userIdx);

    const atier = getFitTier(adiff);
    const btier = getFitTier(bdiff);
    if (atier !== btier) return atier - btier;

    if (adiff !== null && bdiff !== null) {
      const aAbs = Math.abs(adiff);
      const bAbs = Math.abs(bdiff);
      if (aAbs !== bAbs) return aAbs - bAbs;
      if (adiff !== bdiff) return adiff - bdiff;
    }

    const ta = a?.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b?.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });
}

function pickFeedCandidatesByDate(feedItems) {
  const sorted = sortByPublishedAtDesc(feedItems);
  const todayKey = toDayKey(new Date());
  const todayItems = sorted.filter((item) => item.publishedAt && toDayKey(item.publishedAt) === todayKey);
  return {
    candidates: todayItems.length > 0 ? todayItems : sorted,
    usingToday: todayItems.length > 0,
  };
}

async function fetchFeedPreview(sourceKey, limit = 5, options = {}) {
  const source = getSource(sourceKey);
  if (!source) throw new Error('不支持的抓取来源');

  const userLevel = typeof options.userLevel === 'string' ? options.userLevel : 'unknown';
  const safeLimit = Math.max(1, Math.min(20, parseInt(limit, 10) || 5));
  const xml = await fetchText(source.feedUrl);
  const feedItems = parseRssItems(xml, 100);
  const { candidates, usingToday } = pickFeedCandidatesByDate(feedItems);
  const candidatePool = candidates.slice(0, Math.max(12, safeLimit * 4));

  const analyzed = [];
  for (const item of candidatePool) {
    try {
      const fetched = await fetchArticleByUrl(item.url, sourceKey);
      const difficulty = assessDifficulty(fetched.content);
      const itemPublishedAt = item.publishedAt || fetched.publishedAt || null;

      analyzed.push({
        title: item.title || fetched.title,
        url: item.url,
        publishedAt: itemPublishedAt,
        difficultyLevel: difficulty.level,
        difficultyScore: difficulty.score,
      });
    } catch {
      // 单篇失败不影响整体推荐
    }
  }

  const ranked = rankByLevelFitAndRecency(analyzed, userLevel);
  const items = ranked.slice(0, safeLimit);

  return {
    source: { key: source.key, name: source.name, feedUrl: source.feedUrl, site: source.site || source.name },
    recommendation: {
      userLevel,
      strategy: 'latest_today_and_level_fit',
      usingToday,
      fetchedCandidates: feedItems.length,
      analyzedCandidates: analyzed.length,
    },
    items,
  };
}

async function fetchArticleByUrl(rawUrl, sourceKey) {
  const normalizedUrl = normalizeAndValidateUrl(rawUrl, sourceKey);
  const source = sourceKey ? getSource(sourceKey) : detectSourceByUrl(normalizedUrl);

  const html = await fetchText(normalizedUrl);
  const title = extractTitle(html);
  const content = extractParagraphContent(html);

  if (!content || content.length < 120) {
    throw new Error('抓取成功但正文内容过短，无法导入');
  }

  return {
    title: title || '未命名文章',
    content,
    sourceSite: source?.name || new URL(normalizedUrl).hostname,
    sourceUrl: normalizedUrl,
    sourceAuthor: extractAuthor(html),
    publishedAt: extractPublishedAt(html),
  };
}

module.exports = {
  listSources,
  fetchFeedPreview,
  fetchArticleByUrl,
};
