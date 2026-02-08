import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Aurora from '../components/reactbits/Aurora'
import SplitText from '../components/reactbits/SplitText'
import BlurText from '../components/reactbits/BlurText'
import Footer from '../components/Footer'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [userCount, setUserCount] = useState(null)
  const [usernameHint, setUsernameHint] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // 加载已注册用户数量
  useEffect(() => {
    authAPI.userCount().then(({ data }) => setUserCount(data.count)).catch(() => {})
  }, [])

  // 用户名输入框失焦时检查是否存在
  const handleUsernameBlur = async () => {
    const val = username.trim()
    if (!val) { setUsernameHint(''); return }
    try {
      const { data } = await authAPI.checkUsername(val)
      setUsernameHint(data.exists ? '' : '无此用户名')
    } catch { setUsernameHint('') }
  }

  // 忘记密码
  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setForgotError(''); setForgotMsg(''); setForgotLoading(true)
    try {
      const { data } = await authAPI.forgotPassword(forgotEmail)
      setForgotMsg(data.message)
      if (data.resetLink) {
        setTimeout(() => navigate(data.resetLink), 1500)
      }
    } catch (err) {
      setForgotError(err.response?.data?.error || '发送失败，请重试')
    } finally { setForgotLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validation matching backend requirements
    if (!username.trim() || !password.trim()) {
      setError('用户名和密码都是必填项')
      return
    }

    setLoading(true)
    try {
      const { data } = await authAPI.login({ username: username.trim(), password })
      login(data.user, data.token)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.error
      if (err.response?.status === 401) {
        setError('用户名或密码错误，请检查后重试')
      } else {
        setError(msg || '登录失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    setError('')
    setDemoLoading(true)
    try {
      const { data } = await authAPI.demo()
      login(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError('测试登录失败，请稍后重试')
    } finally {
      setDemoLoading(false)
    }
  }

  const isEmail = username.includes('@')
  const isDisabled = loading || demoLoading

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex">
        {/* Left Panel — Hero with Aurora */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-surface-900 overflow-hidden">
          <Aurora
            colorStops={['#4f46e5', '#0891b2', '#7c3aed', '#0284c7']}
            speed={8}
            blur={100}
            opacity={0.35}
            size={65}
          />

          {/* Logo — 左上角 */}
          <div className="absolute top-8 left-0 right-0 z-10 flex justify-center">
            <div className="flex items-center gap-2.5">
              <svg className="w-8 h-8 text-white/80" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="currentColor" />
                <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#4f46e5" fontSize="14" fontWeight="800" fontFamily="system-ui">E</text>
              </svg>
              <svg className="w-7 h-7 text-white/50" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span className="text-white/70 font-medium text-lg tracking-tight">EnglishReader</span>
            </div>
          </div>

          {/* 主标题 — 绝对居中 */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8">
            <div className="space-y-4">
              <SplitText
                text="通过阅读，提升英语水平"
                tag="h1"
                className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold text-white leading-[1.15] tracking-tight whitespace-nowrap"
                splitType="chars"
                textAlign="center"
                delay={30}
                duration={0.6}
                from={{ opacity: 0, y: 20 }}
                to={{ opacity: 1, y: 0 }}
              />
              <BlurText
                text="动态识别生词，追踪学习进度，让每一次阅读都有所收获。"
                className="text-[clamp(0.8rem,1.1vw,1rem)] text-white/50 leading-relaxed text-center"
                delay={40}
                stepDuration={0.3}
              />
            </div>
          </div>

          {/* 版权 — 底部居中 */}
          <div className="absolute bottom-8 left-0 right-0 z-10 text-center text-white/20 text-[12px]">
            &copy; {new Date().getFullYear()} EnglishReader
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 mb-10">
              <svg className="w-7 h-7 text-primary-600" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="currentColor" />
                <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="system-ui">E</text>
              </svg>
              <svg className="w-6 h-6 text-primary-400" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span className="font-semibold text-surface-800 text-base tracking-tight">EnglishReader</span>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-surface-800 mb-1">欢迎回来</h2>
              <p className="text-[13px] text-surface-400">
                登录你的账号，继续学习之旅
                {userCount !== null && (
                  <span className="text-surface-300 ml-1">（已有 {userCount} 位用户加入）</span>
                )}
              </p>
            </div>

            {/* ===== 忘记密码表单 ===== */}
            {showForgot ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setShowForgot(false)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                  <h3 className="text-[15px] font-semibold text-surface-800">找回密码</h3>
                </div>
                <p className="text-[13px] text-surface-400">输入注册邮箱，我们将发送密码重置链接。</p>
                {forgotError && <Alert type="error">{forgotError}</Alert>}
                {forgotMsg && <Alert type="success">{forgotMsg}</Alert>}
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="请输入注册邮箱"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 placeholder-surface-400 transition-all duration-150 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
                    />
                  </div>
                  <Button type="submit" size="full" disabled={forgotLoading}>
                    {forgotLoading ? '发送中...' : '发送重置链接'}
                  </Button>
                </form>
              </div>
            ) : (
            <>
            {error && <Alert type="error" className="mb-4">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email field with dynamic icon */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-surface-600">
                  用户名 / 邮箱
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none transition-colors duration-150">
                    {isEmail ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setUsernameHint('') }}
                    onBlur={handleUsernameBlur}
                    placeholder="请输入用户名或邮箱"
                    autoComplete="username"
                    disabled={isDisabled}
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-lg text-sm text-surface-800 placeholder-surface-400 transition-all duration-150 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 disabled:opacity-60 disabled:cursor-not-allowed ${usernameHint ? 'border-red-300' : 'border-surface-200'}`}
                  />
                </div>
                {usernameHint && (
                  <p className="text-[12px] text-red-500 mt-1">{usernameHint}</p>
                )}
              </div>

              {/* Password field with visibility toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[13px] font-medium text-surface-600">密码</label>
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setError('') }}
                    className="text-[12px] text-primary-500 hover:text-primary-600 font-medium transition-colors"
                  >
                    忘记密码？
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    autoComplete="current-password"
                    disabled={isDisabled}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 placeholder-surface-400 transition-all duration-150 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" size="full" disabled={isDisabled}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    登录中...
                  </span>
                ) : '登录'}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-surface-100" />
              <span className="text-[12px] text-surface-300">或</span>
              <div className="flex-1 h-px bg-surface-100" />
            </div>

            {/* Demo login with credentials hint */}
            <div className="space-y-2">
              <Button variant="secondary" size="full" onClick={handleDemo} disabled={isDisabled}>
                {demoLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    登录中...
                  </span>
                ) : '一键体验（无需注册）'}
              </Button>
              <p className="text-center text-[11px] text-surface-300">
                测试账号 <span className="text-surface-400 font-mono">tester</span> / <span className="text-surface-400 font-mono">123456</span>
              </p>
            </div>

            <p className="text-center mt-6 text-[13px] text-surface-400">
              还没有账号？
              <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700 ml-1">立即注册</Link>
            </p>
            </>
            )}
          </div>
        </div>
      </div>
      <Footer minimal />
    </div>
  )
}

export default Login
