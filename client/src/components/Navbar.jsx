import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: '首页', end: true },
  { to: '/import', label: '导入文章' },
  { to: '/library', label: '文库' },
  { to: '/vocabulary', label: '生词本' },
  { to: '/progress', label: '学习进度' },
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
    <nav className="sticky top-0 z-50 bg-white border-b border-surface-200/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 group">
          <svg className="w-7 h-7 text-primary-600 group-hover:rotate-6 transition-transform duration-300" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="currentColor" />
            <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="system-ui">E</text>
          </svg>
          <span className="font-semibold text-surface-800 text-[15px] tracking-tight hidden sm:block">EnglishReader</span>
        </NavLink>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-surface-500 hover:text-surface-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-primary-500 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {!standalone && (
            <div className="hidden sm:flex items-center gap-2.5">
              {user?.estimatedLevel && (
                <span className="text-[11px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                  {user.estimatedLevel}
                </span>
              )}
              <div className="w-7 h-7 rounded-full bg-surface-100 text-surface-600 flex items-center justify-center text-[11px] font-bold">
                {initials}
              </div>
              <button
                onClick={handleLogout}
                className="text-[13px] text-surface-400 hover:text-red-500 transition-colors duration-200"
              >
                退出
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 hover:bg-surface-50 transition-colors"
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

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-100 bg-white">
          <div className="p-2 space-y-0.5">
            {navItems.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'text-primary-600 bg-primary-50/60'
                      : 'text-surface-600 hover:bg-surface-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {!standalone && (
              <div className="pt-2 mt-1 border-t border-surface-100 flex items-center justify-between px-3 py-2">
                <span className="text-[13px] text-surface-500">{user?.username}</span>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false) }}
                  className="text-[13px] text-red-500 font-medium"
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
