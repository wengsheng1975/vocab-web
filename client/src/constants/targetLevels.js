export const TARGET_LEVEL_GROUPS = [
  {
    group: 'none',
    label: '未设定',
    options: [{ value: 'none', label: '未设定' }],
  },
  {
    group: 'gaokao_national',
    label: '高考英语全国卷',
    options: [
      { value: 'gaokao_national_a1', label: '<60' },
      { value: 'gaokao_national_a2', label: '60-89' },
      { value: 'gaokao_national_b1', label: '90-119' },
      { value: 'gaokao_national_b2', label: '120-139' },
      { value: 'gaokao_national_c1', label: '140+' },
    ],
  },
  {
    group: 'cet4',
    label: '大学四级 (CET-4)',
    options: [
      { value: 'cet4_a1', label: '未达 CET-4 300 (A1)' },
      { value: 'cet4_a2', label: 'CET-4 300-424 (A2)' },
      { value: 'cet4_b1', label: 'CET-4 425+ (B1)' },
    ],
  },
  {
    group: 'cet6',
    label: '大学六级 (CET-6)',
    options: [{ value: 'cet6_b2', label: 'CET-6 500+ (B2)' }],
  },
  {
    group: 'tem4',
    label: '英语专业四级 (TEM-4)',
    options: [
      { value: 'tem4_b1', label: 'TEM-4 合格 (B1)' },
      { value: 'tem4_b2', label: 'TEM-4 优秀 (B2)' },
    ],
  },
  {
    group: 'tem8',
    label: '英语专业八级 (TEM-8)',
    options: [
      { value: 'tem8_c1', label: 'TEM-8 合格 (C1)' },
      { value: 'tem8_c2', label: 'TEM-8 优秀 (C2)' },
    ],
  },
  {
    group: 'toefl',
    label: '托福 (TOEFL)',
    options: [
      { value: 'toefl_a1', label: '0-19 (A1)' },
      { value: 'toefl_a2', label: '20-45 (A2)' },
      { value: 'toefl_b1', label: '46-71 (B1)' },
      { value: 'toefl_b2', label: '72-94 (B2)' },
      { value: 'toefl_c1', label: '95-109 (C1)' },
      { value: 'toefl_c2', label: '110-120 (C2)' },
    ],
  },
  {
    group: 'ielts',
    label: '雅思 (IELTS)',
    options: [
      { value: 'ielts_a1', label: '2.0-3.0 (A1)' },
      { value: 'ielts_a2', label: '3.5-4.0 (A2)' },
      { value: 'ielts_b1', label: '4.5-5.0 (B1)' },
      { value: 'ielts_b2', label: '5.5-6.5 (B2)' },
      { value: 'ielts_c1', label: '7.0-8.0 (C1)' },
      { value: 'ielts_c2', label: '8.5-9.0 (C2)' },
    ],
  },
  {
    group: 'cambridge',
    label: '剑桥通用英语',
    options: [
      { value: 'cambridge_a1', label: 'YLE Movers (A1)' },
      { value: 'cambridge_a2', label: 'KET (A2)' },
      { value: 'cambridge_b1', label: 'PET (B1)' },
      { value: 'cambridge_b2', label: 'FCE (B2)' },
      { value: 'cambridge_c1', label: 'CAE (C1)' },
      { value: 'cambridge_c2', label: 'CPE (C2)' },
    ],
  },
]

export const TARGET_LEVEL_OPTIONS = TARGET_LEVEL_GROUPS.flatMap((group) => group.options)

const TARGET_LEVEL_SET = new Set(TARGET_LEVEL_OPTIONS.map((item) => item.value))

export const LEGACY_TARGET_LEVEL_MAP = {
  gaokao: 'gaokao_national_b1',
  gaokao_national: 'gaokao_national_b1',
  gaokao_national_a1: 'gaokao_national_a1',
  gaokao_national_a2: 'gaokao_national_a2',
  gaokao_national_b1: 'gaokao_national_b1',
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
}

export const DETAIL_TO_LEGACY_TARGET_LEVEL = {
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
}

export function normalizeTargetLevel(value) {
  const raw = String(value || '').trim()
  if (!raw) return 'none'
  if (TARGET_LEVEL_SET.has(raw)) return raw
  if (LEGACY_TARGET_LEVEL_MAP[raw]) return LEGACY_TARGET_LEVEL_MAP[raw]
  return 'none'
}

export function toLegacyTargetLevel(value) {
  const normalized = normalizeTargetLevel(value)
  return DETAIL_TO_LEGACY_TARGET_LEVEL[normalized] || normalized
}

export const TARGET_LEVEL_TO_GROUP = TARGET_LEVEL_GROUPS.reduce((acc, group) => {
  group.options.forEach((option) => {
    acc[option.value] = group.group
  })
  return acc
}, {})

export const TARGET_LEVEL_GROUP_DEFAULTS = TARGET_LEVEL_GROUPS.reduce((acc, group) => {
  acc[group.group] = group.options[0]?.value || 'none'
  return acc
}, {})
