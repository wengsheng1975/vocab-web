import { Link } from 'react-router-dom'

const productLinks = [
  { label: '导入文章', to: '/import' },
  { label: '生词本', to: '/vocabulary' },
  { label: '学习进度', to: '/progress' },
  { label: '文库', to: '/library' },
]

const resourceLinks = [
  { label: 'GitHub', href: 'https://github.com', external: true },
  { label: '反馈建议', href: 'mailto:feedback@example.com', external: true },
  { label: '更新日志', to: '/' },
]

export default function Footer({ minimal = false }) {
  if (minimal) {
    return (
      <footer className="border-t border-surface-200/60 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-[12px] text-surface-400">
          <span>&copy; {new Date().getFullYear()} EnglishReader</span>
          <span>通过阅读提升英语水平</span>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t border-surface-200/60 bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-6 h-6 text-primary-600" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="currentColor" />
                <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="system-ui">E</text>
              </svg>
              <span className="font-semibold text-surface-800 text-[14px]">EnglishReader</span>
            </div>
            <p className="text-[13px] text-surface-400 leading-relaxed max-w-xs">
              智能英语阅读学习工具。通过真实文章阅读，精准追踪词汇进步。
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[12px] font-semibold text-surface-400 uppercase tracking-wider mb-3">产品</h4>
            <ul className="space-y-2">
              {productLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-[13px] text-surface-500 hover:text-surface-800 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[12px] font-semibold text-surface-400 uppercase tracking-wider mb-3">资源</h4>
            <ul className="space-y-2">
              {resourceLinks.map(({ label, to, href, external }) => (
                <li key={label}>
                  {external ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-surface-500 hover:text-surface-800 transition-colors">
                      {label}
                    </a>
                  ) : (
                    <Link to={to} className="text-[13px] text-surface-500 hover:text-surface-800 transition-colors">
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-surface-100 flex items-center justify-between text-[12px] text-surface-400">
          <span>&copy; {new Date().getFullYear()} EnglishReader. All rights reserved.</span>
          <span className="text-surface-300">v1.0.0</span>
        </div>
      </div>
    </footer>
  )
}
