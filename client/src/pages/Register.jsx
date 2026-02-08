import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Aurora from '../components/reactbits/Aurora'
import SplitText from '../components/reactbits/SplitText'
import BlurText from '../components/reactbits/BlurText'
import Footer from '../components/Footer'

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // 客户端密码策略预校验（与服务端一致）
  const getPasswordError = (pwd) => {
    if (pwd.length < 6) return '密码长度至少为 6 位'
    if (!/[a-zA-Z]/.test(pwd)) return '密码必须包含至少一个字母'
    if (!/[0-9]/.test(pwd)) return '密码必须包含至少一个数字'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }

    const pwdError = getPasswordError(password)
    if (pwdError) {
      setError(pwdError)
      return
    }

    setLoading(true)
    try {
      const { data } = await authAPI.register({ username, email, password })
      login(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex">
        {/* Left Panel — Hero with Aurora */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-surface-900 p-12 flex-col justify-between overflow-hidden">
          <Aurora
            colorStops={['#0891b2', '#4f46e5', '#0284c7', '#7c3aed']}
            speed={8}
            blur={100}
            opacity={0.35}
            size={65}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <svg className="w-8 h-8 text-white/80" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="currentColor" />
                <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#0891b2" fontSize="14" fontWeight="800" fontFamily="system-ui">E</text>
              </svg>
              <svg className="w-7 h-7 text-white/50" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span className="text-white/70 font-medium text-lg tracking-tight">EnglishReader</span>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <SplitText
              text="开始你的英语学习之旅"
              tag="h1"
              className="text-[2.5rem] font-extrabold text-white leading-[1.15] tracking-tight"
              splitType="chars"
              delay={30}
              duration={0.6}
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
            />
            <BlurText
              text="注册账号，解锁智能阅读分析与学习进度可视化功能。"
              className="text-base text-white/50 max-w-sm leading-relaxed"
              delay={40}
              stepDuration={0.3}
            />
          </div>

          <div className="relative z-10 text-white/20 text-[12px]">
            &copy; {new Date().getFullYear()} EnglishReader
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center gap-2 mb-10">
              <svg className="w-7 h-7 text-primary-600" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="currentColor" />
                <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="system-ui">E</text>
              </svg>
              <span className="font-semibold text-surface-800 text-base tracking-tight">EnglishReader</span>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-surface-800 mb-1">创建账号</h2>
              <p className="text-[13px] text-surface-400">填写信息，开始你的学习旅程</p>
            </div>

            {error && <Alert type="error" className="mb-4">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-surface-600">用户名</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" required className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 placeholder-surface-400 transition-all duration-150 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-surface-600">邮箱</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" required className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 placeholder-surface-400 transition-all duration-150 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-surface-600">密码</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少6位，须含字母和数字" minLength={6} required className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 placeholder-surface-400 transition-all duration-150 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-surface-600">确认密码</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="请再次输入密码" required className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 placeholder-surface-400 transition-all duration-150 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15" />
              </div>

              <Button type="submit" size="full" disabled={loading}>
                {loading ? '注册中...' : '注册'}
              </Button>
            </form>

            <p className="text-center mt-6 text-[13px] text-surface-400">
              已有账号？
              <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700 ml-1">立即登录</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer minimal />
    </div>
  )
}

export default Register
