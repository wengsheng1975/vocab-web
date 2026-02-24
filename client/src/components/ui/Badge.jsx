const diffColors = {
  A1: 'bg-primary-50 text-primary-700 ring-primary-200',
  A2: 'bg-teal-50 text-teal-700 ring-teal-200',
  B1: 'bg-amber-50 text-amber-700 ring-amber-200',
  B2: 'bg-orange-50 text-orange-700 ring-orange-200',
  C1: 'bg-red-50 text-red-700 ring-red-200',
  C2: 'bg-rose-50 text-rose-700 ring-rose-200',
}

const levelColors = {
  unknown: 'bg-surface-100 text-surface-500 ring-surface-200',
  ...diffColors,
}

const freqColors = {
  5: 'bg-red-50 text-red-600 ring-red-200',
  3: 'bg-accent-50 text-accent-700 ring-accent-200',
  2: 'bg-amber-50 text-amber-600 ring-amber-200',
  1: 'bg-surface-100 text-surface-500 ring-surface-200',
}

export function DiffBadge({ level, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] ${diffColors[level] || diffColors.A1} ${className}`}>
      {level}
    </span>
  )
}

export function LevelBadge({ level, label, className = '' }) {
  const levelNames = {
    unknown: '未评估', A1: 'A1 入门', A2: 'A2 基础', B1: 'B1 中级',
    B2: 'B2 中高级', C1: 'C1 高级', C2: 'C2 精通',
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ring-1 ring-inset shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] ${levelColors[level] || levelColors.unknown} ${className}`}>
      {label || levelNames[level] || '未评估'}
    </span>
  )
}

export function FreqBadge({ count, className = '' }) {
  const tier = count >= 5 ? 5 : count >= 3 ? 3 : count >= 2 ? 2 : 1
  const labels = { 5: '极高频', 3: '高频', 2: '中频', 1: '低频' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ${freqColors[tier]} ${className}`}>
      {labels[tier]} ({count}次)
    </span>
  )
}

export function StatusBadge({ text, color = 'primary', className = '' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600 ring-primary-200',
    success: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-600 ring-amber-200',
    danger: 'bg-red-50 text-red-600 ring-red-200',
    info: 'bg-sky-50 text-sky-600 ring-sky-200',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ${colors[color] || colors.primary} ${className}`}>
      {text}
    </span>
  )
}
