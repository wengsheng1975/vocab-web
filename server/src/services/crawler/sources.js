const DEFAULT_CRAWL_SOURCES = {
  chinadaily: {
    key: 'chinadaily',
    name: 'China Daily · China',
    site: 'China Daily',
    feedUrl: 'https://www.chinadaily.com.cn/rss/china_rss.xml',
    defaultEnabled: true,
    defaultIntervalMinutes: 180,
    defaultLimitPerRun: 3,
    allowedHosts: [
      'global.chinadaily.com.cn',
      'www.chinadaily.com.cn',
      'language.chinadaily.com.cn',
      'chinadaily.com.cn',
    ],
  },
  chinadaily_world: {
    key: 'chinadaily_world',
    name: 'China Daily · World',
    site: 'China Daily',
    feedUrl: 'https://www.chinadaily.com.cn/rss/world_rss.xml',
    defaultEnabled: false,
    defaultIntervalMinutes: 240,
    defaultLimitPerRun: 3,
    allowedHosts: [
      'global.chinadaily.com.cn',
      'www.chinadaily.com.cn',
      'language.chinadaily.com.cn',
      'chinadaily.com.cn',
    ],
  },
  bbc_world: {
    key: 'bbc_world',
    name: 'BBC · World',
    site: 'BBC News',
    feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    defaultEnabled: false,
    defaultIntervalMinutes: 240,
    defaultLimitPerRun: 3,
    allowedHosts: [
      'feeds.bbci.co.uk',
      'www.bbc.com',
      'bbc.com',
      'www.bbc.co.uk',
      'bbc.co.uk',
    ],
  },
  npr_world: {
    key: 'npr_world',
    name: 'NPR · World',
    site: 'NPR',
    feedUrl: 'https://feeds.npr.org/1004/rss.xml',
    defaultEnabled: false,
    defaultIntervalMinutes: 360,
    defaultLimitPerRun: 3,
    allowedHosts: [
      'feeds.npr.org',
      'www.npr.org',
      'npr.org',
    ],
  },
  aljazeera_all: {
    key: 'aljazeera_all',
    name: 'Al Jazeera · All News',
    site: 'Al Jazeera',
    feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    defaultEnabled: false,
    defaultIntervalMinutes: 360,
    defaultLimitPerRun: 3,
    allowedHosts: [
      'www.aljazeera.com',
      'aljazeera.com',
    ],
  },
};

function readBoolEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return fallback;
}

function readIntEnv(name, fallback, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = Number(process.env[name]);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(raw)));
}

function readCsvEnv(name, fallback) {
  const raw = process.env[name];
  if (typeof raw !== 'string') return fallback;
  const parsed = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : fallback;
}

function buildSourceConfig(source) {
  const envKey = source.key.toUpperCase();
  return {
    ...source,
    feedUrl: process.env[`CRAWLER_FEED_${envKey}`] || source.feedUrl,
    allowedHosts: readCsvEnv(`CRAWLER_ALLOWED_HOSTS_${envKey}`, source.allowedHosts),
    defaultEnabled: readBoolEnv(`CRAWLER_ENABLED_${envKey}`, !!source.defaultEnabled),
    defaultIntervalMinutes: readIntEnv(
      `CRAWLER_INTERVAL_MINUTES_${envKey}`,
      source.defaultIntervalMinutes || 180,
      { min: 15, max: 1440 }
    ),
    defaultLimitPerRun: readIntEnv(
      `CRAWLER_LIMIT_PER_RUN_${envKey}`,
      source.defaultLimitPerRun || 3,
      { min: 1, max: 20 }
    ),
  };
}

const CRAWL_SOURCES = Object.fromEntries(
  Object.entries(DEFAULT_CRAWL_SOURCES).map(([key, source]) => [key, buildSourceConfig(source)])
);

function listSources() {
  return Object.values(CRAWL_SOURCES).map((s) => ({
    key: s.key,
    name: s.name,
    site: s.site || s.name,
    feedUrl: s.feedUrl,
    defaultEnabled: !!s.defaultEnabled,
    defaultIntervalMinutes: s.defaultIntervalMinutes || 180,
    defaultLimitPerRun: s.defaultLimitPerRun || 3,
  }));
}

function getSource(key) {
  if (!key || typeof key !== 'string') return null;
  return CRAWL_SOURCES[key] || null;
}

function hostMatches(hostname, allowedHost) {
  const host = String(hostname || '').toLowerCase();
  const rule = String(allowedHost || '').toLowerCase();
  return host === rule || host.endsWith(`.${rule}`);
}

function getAllAllowedHosts() {
  const hosts = new Set();
  for (const source of Object.values(CRAWL_SOURCES)) {
    for (const host of source.allowedHosts) hosts.add(host);
  }
  return [...hosts];
}

function isUrlAllowed(rawUrl, sourceKey) {
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    const source = getSource(sourceKey);
    const allowedHosts = source ? source.allowedHosts : getAllAllowedHosts();
    return allowedHosts.some((h) => hostMatches(parsed.hostname, h));
  } catch {
    return false;
  }
}

function normalizeAndValidateUrl(rawUrl, sourceKey) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('请提供有效的文章 URL');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('URL 格式不正确');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('仅支持 HTTP/HTTPS 链接');
  }

  if (!isUrlAllowed(parsed.toString(), sourceKey)) {
    throw new Error('该链接不在允许抓取的网站白名单中');
  }

  parsed.hash = '';
  return parsed.toString();
}

function detectSourceByUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname.toLowerCase();
    for (const source of Object.values(CRAWL_SOURCES)) {
      if (source.allowedHosts.some((h) => hostMatches(hostname, h))) {
        return source;
      }
    }
  } catch {
    return null;
  }
  return null;
}

module.exports = {
  listSources,
  getSource,
  isUrlAllowed,
  normalizeAndValidateUrl,
  detectSourceByUrl,
};
