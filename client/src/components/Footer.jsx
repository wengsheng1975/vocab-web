import { Link } from 'react-router-dom'

const productLinks = [
  { label: '导入文章', to: '/import' },
  { label: '文库', to: '/library' },
  { label: '生词本', to: '/vocabulary' },
  { label: '学习进度', to: '/progress' },
  { label: '核心水平对比总表', to: '/level-compare' },
]

export default function Footer({ minimal = false }) {
  const githubUrl = import.meta.env.VITE_GITHUB_URL || 'https://github.com/wengsheng1975/vocab-web'
  const feedbackEmail = import.meta.env.VITE_FEEDBACK_EMAIL || 'wengsheng1975@gmail.com'

  const resourceLinks = [
    { label: 'GitHub', href: githubUrl, external: true },
    { label: '反馈建议', href: `mailto:${feedbackEmail}`, external: true },
  ]

  if (minimal) {
    return (
      <footer className="border-t border-surface-200/60 py-6 mt-auto bg-white/75">
        <div className="max-w-[72rem] mx-auto px-4 sm:px-7 flex items-center justify-between flex-wrap gap-2 text-[12px] text-surface-500">
          <span>&copy; {new Date().getFullYear()} EnglishReader.</span>
          <span>通过阅读持续提升英语能力</span>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t border-surface-200/70 bg-white/85 backdrop-blur mt-16">
      <div className="max-w-[72rem] mx-auto px-4 sm:px-7 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-6 h-6 text-primary-600" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="currentColor" />
                <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="inherit">E</text>
              </svg>
              <span className="font-semibold text-surface-800 text-[14px]">EnglishReader</span>
            </div>
            <p className="text-[13px] text-surface-500 leading-relaxed max-w-xs">
              智能英语阅读学习工具。通过真实文章阅读，追踪词汇成长与学习进度。
            </p>
          </div>

          <div>
            <h4 className="text-[12px] font-semibold text-surface-500 uppercase tracking-wider mb-3">功能</h4>
            <ul className="space-y-2">
              {productLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-[13px] text-surface-600 hover:text-surface-800 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[12px] font-semibold text-surface-500 uppercase tracking-wider mb-3">资源</h4>
            <ul className="space-y-2">
              {resourceLinks.map(({ label, href, external }) => (
                <li key={label}>
                  {external ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-surface-600 hover:text-surface-800 transition-colors">
                      {label}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-surface-100 flex items-center justify-between flex-wrap gap-2 text-[12px] text-surface-500">
          <span>&copy; {new Date().getFullYear()} EnglishReader. All rights reserved.</span>
          <span className="text-surface-400">v1.0.0</span>
        </div>
      </div>
    </footer>
  )
}
