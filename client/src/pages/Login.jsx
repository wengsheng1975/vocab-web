import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">E</div>
          <h1>EnglishReader</h1>
          <p>英语阅读学习助手</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>登录</h2>
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group">
            <label>用户名 / 邮箱</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名或邮箱"
              required
            />
          </div>
          <div className="form-group">
            <label>密码</label>
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
      </div>
    </div>
  )
}

export default Login
