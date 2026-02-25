const TARGET_LEVELS = Object.freeze([
  'none',
  'gaokao_national_a1',
  'gaokao_national_a2',
  'gaokao_national_b1',
  'gaokao_national_b2',
  'gaokao_national_c1',
  'cet4_a1',
  'cet4_a2',
  'cet4_b1',
  'cet6_b2',
  'tem4_b1',
  'tem4_b2',
  'tem8_c1',
  'tem8_c2',
  'toefl_a1',
  'toefl_a2',
  'toefl_b1',
  'toefl_b2',
  'toefl_c1',
  'toefl_c2',
  'ielts_a1',
  'ielts_a2',
  'ielts_b1',
  'ielts_b2',
  'ielts_c1',
  'ielts_c2',
  'cambridge_a1',
  'cambridge_a2',
  'cambridge_b1',
  'cambridge_b2',
  'cambridge_c1',
  'cambridge_c2',
]);

const LEGACY_TARGET_LEVEL_MAP = Object.freeze({
  gaokao: 'gaokao_national_b1',
  gaokao_national: 'gaokao_national_b1',
  gaokao_national_a1: 'gaokao_national_a1',
  gaokao_national_a2: 'gaokao_national_a2',
  gaokao_national_b2: 'gaokao_national_b2',
  gaokao_national_b2_low: 'gaokao_national_b2',
  gaokao_national_b2_high: 'gaokao_national_b2',
  gaokao_national_c1: 'gaokao_national_c1',
  gaokao_shanghai: 'cet4_b1',
  cet4: 'cet4_b1',
  cet6: 'cet6_b2',
  tem4: 'tem4_b1',
  tem8: 'tem8_c1',
  toefl: 'toefl_b2',
  ielts: 'ielts_b2',
  cambridge: 'cambridge_b1',
});

const TARGET_LEVEL_TO_BASE = Object.freeze({
  none: 'none',
  gaokao_national_a1: 'gaokao_national',
  gaokao_national_a2: 'gaokao_national',
  gaokao_national_b1: 'gaokao_national',
  gaokao_national_b2: 'gaokao_national',
  gaokao_national_c1: 'gaokao_national',
  cet4_a1: 'cet4',
  cet4_a2: 'cet4',
  cet4_b1: 'cet4',
  cet6_b2: 'cet6',
  tem4_b1: 'tem4',
  tem4_b2: 'tem4',
  tem8_c1: 'tem8',
  tem8_c2: 'tem8',
  toefl_a1: 'toefl',
  toefl_a2: 'toefl',
  toefl_b1: 'toefl',
  toefl_b2: 'toefl',
  toefl_c1: 'toefl',
  toefl_c2: 'toefl',
  ielts_a1: 'ielts',
  ielts_a2: 'ielts',
  ielts_b1: 'ielts',
  ielts_b2: 'ielts',
  ielts_c1: 'ielts',
  ielts_c2: 'ielts',
  cambridge_a1: 'cambridge',
  cambridge_a2: 'cambridge',
  cambridge_b1: 'cambridge',
  cambridge_b2: 'cambridge',
  cambridge_c1: 'cambridge',
  cambridge_c2: 'cambridge',
});

const TARGET_LEVEL_TO_CEFR = Object.freeze({
  gaokao_national_a1: 'A1',
  gaokao_national_a2: 'A2',
  gaokao_national_b1: 'B1',
  gaokao_national_b2: 'B2',
  gaokao_national_c1: 'C1',
  cet4_a1: 'A1',
  cet4_a2: 'A2',
  cet4_b1: 'B1',
  cet6_b2: 'B2',
  tem4_b1: 'B1',
  tem4_b2: 'B2',
  tem8_c1: 'C1',
  tem8_c2: 'C2',
  toefl_a1: 'A1',
  toefl_a2: 'A2',
  toefl_b1: 'B1',
  toefl_b2: 'B2',
  toefl_c1: 'C1',
  toefl_c2: 'C2',
  ielts_a1: 'A1',
  ielts_a2: 'A2',
  ielts_b1: 'B1',
  ielts_b2: 'B2',
  ielts_c1: 'C1',
  ielts_c2: 'C2',
  cambridge_a1: 'A1',
  cambridge_a2: 'A2',
  cambridge_b1: 'B1',
  cambridge_b2: 'B2',
  cambridge_c1: 'C1',
  cambridge_c2: 'C2',
});

const BASE_CRAWLER_LEVEL_HINTS = Object.freeze({
  gaokao_national: Object.freeze(['B1', 'B2', 'C1']),
  cet4: Object.freeze(['A2', 'B1', 'B2']),
  cet6: Object.freeze(['B1', 'B2', 'C1']),
  tem4: Object.freeze(['B1', 'B2', 'C1']),
  tem8: Object.freeze(['C1', 'C2']),
  toefl: Object.freeze(['B1', 'B2', 'C1']),
  ielts: Object.freeze(['B1', 'B2', 'C1']),
  cambridge: Object.freeze(['A2', 'B1', 'B2', 'C1']),
  none: Object.freeze(['A2', 'B1']),
});

const TARGET_LEVEL_SET = new Set(TARGET_LEVELS);
function normalizeTargetLevel(targetLevel) {
  const raw = String(targetLevel || '').trim();
  if (!raw) return 'none';
  if (TARGET_LEVEL_SET.has(raw)) return raw;
  if (LEGACY_TARGET_LEVEL_MAP[raw]) return LEGACY_TARGET_LEVEL_MAP[raw];
  return 'none';
}

function resolveTargetBaseLevel(targetLevel) {
  const normalized = normalizeTargetLevel(targetLevel);
  return TARGET_LEVEL_TO_BASE[normalized] || 'none';
}

function isValidTargetLevel(targetLevel) {
  return TARGET_LEVEL_SET.has(targetLevel);
}

function getCrawlerLevelCandidates(targetLevel) {
  const normalized = normalizeTargetLevel(targetLevel);
  const base = resolveTargetBaseLevel(normalized);
  return BASE_CRAWLER_LEVEL_HINTS[base] || BASE_CRAWLER_LEVEL_HINTS.none;
}

module.exports = {
  TARGET_LEVELS,
  TARGET_LEVEL_TO_CEFR,
  normalizeTargetLevel,
  resolveTargetBaseLevel,
  isValidTargetLevel,
  getCrawlerLevelCandidates,
};
