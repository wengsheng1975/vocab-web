import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: '首页', end: true },
  { to: '/import', label: '导入文章' },
  { to: '/library', label: '文库' },
  { to: '/vocabulary', label: '生词本' },
  { to: '/progress', label: '学习进度' },
  { to: '/level-compare', label: '水平对比' },
]

function Navbar() {
  const { user, logout, standalone } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'U'

  return (
    <nav className="sticky top-0 z-50 border-b border-surface-200/75 bg-white/92 backdrop-blur-md">
      <div className="max-w-[72rem] mx-auto px-4 sm:px-7 py-3">
        <div className="flex items-center justify-between gap-3">
          <NavLink to="/" className="flex items-center gap-2.5 group min-w-0">
            <svg className="w-8 h-8 text-primary-600 group-hover:rotate-6 transition-transform duration-300" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="currentColor" />
              <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="inherit">E</text>
            </svg>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold tracking-tight text-surface-800">EnglishReader</div>
              <div className="text-[11px] text-surface-500 hidden sm:block">阅读式英语学习平台</div>
            </div>
          </NavLink>

          <div className="hidden md:flex items-center gap-1.5">
            {navItems.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-surface-600 hover:text-surface-800 hover:bg-surface-100/70'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!standalone && (
              <div className="hidden sm:flex items-center gap-2.5">
                {user?.estimatedLevel && (
                  <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
                    {user.estimatedLevel}
                  </span>
                )}
                <div className="w-7 h-7 rounded-full bg-surface-100 text-surface-600 flex items-center justify-center text-[11px] font-bold">
                  {initials}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-[13px] text-surface-500 hover:text-red-500 transition-colors duration-200"
                >
                  退出
                </button>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-surface-600 hover:bg-surface-100 transition-colors"
              aria-label="切换菜单"
            >
              {mobileOpen ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-surface-100 bg-white/95 backdrop-blur">
          <div className="p-3 space-y-1">
            {navItems.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-surface-600 hover:bg-surface-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {!standalone && (
              <div className="pt-2 mt-1 border-t border-surface-100 flex items-center justify-between px-1 py-1">
                <span className="text-[13px] text-surface-500">{user?.username}</span>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false) }}
                  className="text-[13px] text-red-500 font-medium px-2 py-1"
                >
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
