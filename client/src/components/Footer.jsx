import { Link } from 'react-router-dom'

const indexSections = [
  {
    title: '学习目录',
    items: [
      { no: '01', label: '首页总览', to: '/' },
      { no: '02', label: '学习进度', to: '/progress' },
    ],
  },
  {
    title: '内容目录',
    items: [
      { no: '03', label: '导入文章', to: '/import' },
      { no: '04', label: '文库管理', to: '/library' },
      { no: '05', label: '生词本', to: '/vocabulary' },
    ],
  },
  {
    title: '服务目录',
    items: [
      { no: '06', label: 'GitHub', externalKey: 'github' },
      { no: '07', label: '反馈建议', externalKey: 'feedback' },
    ],
  },
]

export default function Footer({ minimal = false }) {
  const githubUrl = import.meta.env.VITE_GITHUB_URL || 'https://github.com/wengsheng1975/vocab-web'
  const feedbackEmail = import.meta.env.VITE_FEEDBACK_EMAIL || 'wengsheng1975@gmail.com'
  const externalMap = {
    github: { href: githubUrl, label: 'GitHub' },
    feedback: { href: `mailto:${feedbackEmail}`, label: '反馈建议' },
  }

  if (minimal) {
    return (
      <footer className="border-t border-surface-200/60 py-6 mt-auto bg-white/75">
        <div className="max-w-[72rem] mx-auto px-4 sm:px-7 flex items-center justify-between flex-wrap gap-2 text-[12px] text-surface-500">
          <span>&copy; {new Date().getFullYear()} EnglishReader.</span>
          <span>目录化学习，持续进步</span>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t border-surface-200/70 bg-white/85 backdrop-blur mt-16">
      <div className="max-w-[72rem] mx-auto px-4 sm:px-7 py-10">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div className="flex items-center gap-2.5">
            <svg className="w-7 h-7 text-primary-600" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="currentColor" />
              <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="inherit">E</text>
            </svg>
            <div>
              <div className="text-[15px] font-semibold text-surface-800 tracking-tight">EnglishReader</div>
              <div className="text-[12px] text-surface-500">网站目录索引</div>
            </div>
          </div>
          <span className="toc-chip">Footer Index</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {indexSections.map((section) => (
            <div key={section.title} className="rounded-xl border border-surface-200/80 bg-white p-4">
              <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-surface-500 mb-3">{section.title}</div>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={`${section.title}-${item.no}`} className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center min-w-8 h-6 rounded-md bg-surface-100 text-surface-500 text-[11px] font-semibold">{item.no}</span>
                    {item.to ? (
                      <Link to={item.to} className="text-[13px] text-surface-600 hover:text-primary-700 transition-colors">
                        {item.label}
                      </Link>
                    ) : (
                      <a href={externalMap[item.externalKey].href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-surface-600 hover:text-primary-700 transition-colors">
                        {externalMap[item.externalKey].label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-surface-100 flex items-center justify-between flex-wrap gap-2 text-[12px] text-surface-500">
          <span>&copy; {new Date().getFullYear()} EnglishReader. All rights reserved.</span>
          <span className="text-surface-400">v1.0.0</span>
        </div>
      </div>
    </footer>
  )
}
