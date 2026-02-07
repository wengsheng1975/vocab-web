import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [userCount, setUserCount] = useState(null)
  const [usernameError, setUsernameError] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // 加载已注册用户数量
  useEffect(() => {
    authAPI.userCount()
      .then(({ data }) => setUserCount(data.count))
      .catch(() => {})
  }, [])

  // 用户名输入框失焦时检查用户名是否存在
  const handleUsernameBlur = async () => {
    const val = username.trim()
    if (!val) {
      setUsernameError('')
      return
    }
    try {
      const { data } = await authAPI.checkUsername(val)
      setUsernameError(data.exists ? '' : '无此用户名')
    } catch {
      setUsernameError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setUsernameError('')
    setLoading(true)

    try {
      const { data } = await authAPI.login({ username, password })
      login(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.demo()
      login(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError('测试登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 忘记密码 — 发送重置邮件
  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotMsg('')
    setForgotLoading(true)

    try {
      const { data } = await authAPI.forgotPassword(forgotEmail)
      setForgotMsg(data.message)
      // 开发模式下自动跳转到重置页面
      if (data.resetLink) {
        setTimeout(() => {
          navigate(data.resetLink)
        }, 1500)
      }
    } catch (err) {
      setForgotError(err.response?.data?.error || '发送失败，请重试')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">E</div>
          <h1>EnglishReader</h1>
          <p>英语阅读学习助手</p>
          {userCount !== null && (
            <p className="user-count-hint">（已有 {userCount} 位用户加入）</p>
          )}
        </div>

        {/* ===== 忘记密码弹层 ===== */}
        {showForgot ? (
          <form onSubmit={handleForgotSubmit} className="auth-form">
            <h2>找回密码</h2>
            <p className="form-desc">请输入注册时使用的邮箱，我们将发送密码重置链接。</p>
            {forgotError && <div className="error-msg">{forgotError}</div>}
            {forgotMsg && <div className="success-msg">{forgotMsg}</div>}
            <div className="form-group">
              <label>注册邮箱</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="请输入注册邮箱"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={forgotLoading}>
              {forgotLoading ? '发送中...' : '发送重置链接'}
            </button>
            <p className="auth-switch" style={{ marginTop: '1rem' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setShowForgot(false) }}>
                返回登录
              </a>
            </p>
          </form>
        ) : (
          /* ===== 正常登录表单 ===== */
          <form onSubmit={handleSubmit} className="auth-form">
            <h2>登录</h2>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label>用户名 / 邮箱</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setUsernameError('') }}
                onBlur={handleUsernameBlur}
                placeholder="请输入用户名或邮箱"
                className={usernameError ? 'input-error' : ''}
                required
              />
              {usernameError && <div className="field-error">{usernameError}</div>}
            </div>
            <div className="form-group">
              <div className="label-row">
                <label>密码</label>
                <a
                  href="#"
                  className="forgot-link"
                  onClick={(e) => { e.preventDefault(); setShowForgot(true); setError('') }}
                >
                  忘记密码？
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>

            <div className="auth-divider">
              <span>或</span>
            </div>

            <button type="button" className="btn-demo" onClick={handleDemo} disabled={loading}>
              一键测试登录（无需注册）
            </button>

            <p className="auth-switch">
              还没有账号？<Link to="/register">立即注册</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login
