import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../api'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  // 密码历史冲突状态
  const [passwordConflict, setPasswordConflict] = useState(false)
  const [isCurrentPassword, setIsCurrentPassword] = useState(false)

  // 验证令牌
  useEffect(() => {
    if (!token) {
      setVerifying(false)
      return
    }
    authAPI.verifyResetToken(token)
      .then(({ data }) => {
        setTokenValid(true)
        setUsername(data.username)
        setEmail(data.email)
      })
      .catch((err) => {
        setError(err.response?.data?.error || '链接无效')
      })
      .finally(() => setVerifying(false))
  }, [token])

  // 提交新密码
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setPasswordConflict(false)

    if (newPassword !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }

    setLoading(true)
    try {
      const { data } = await authAPI.resetPassword({ token, newPassword })
      setSuccess(data.message)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const resp = err.response?.data
      if (resp?.code === 'PASSWORD_USED') {
        // 密码曾使用过 — 显示选择对话框
        setPasswordConflict(true)
        setIsCurrentPassword(resp.isCurrentPassword)
      } else {
        setError(resp?.error || '重置失败，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  // 选择"继续使用该密码"（即沿用旧密码直接去登录）
  const handleKeepOldPassword = () => {
    navigate('/login')
  }

  // 选择"使用新密码"（强制重置）
  const handleForceReset = async () => {
    setLoading(true)
    setPasswordConflict(false)
    setError('')
    try {
      const { data } = await authAPI.resetPassword({ token, newPassword, forceReset: true })
      setSuccess(data.message)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || '重置失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 选择"输入其他新密码"
  const handleChooseNew = () => {
    setPasswordConflict(false)
    setNewPassword('')
    setConfirmPassword('')
  }

  if (verifying) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">E</div>
            <h1>EnglishReader</h1>
          </div>
          <div className="auth-form" style={{ textAlign: 'center', padding: '2rem' }}>
            <p>正在验证重置链接...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!token || !tokenValid) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">E</div>
            <h1>EnglishReader</h1>
          </div>
          <div className="auth-form" style={{ textAlign: 'center' }}>
            <h2>链接无效</h2>
            <div className="error-msg">{error || '重置链接无效或已过期'}</div>
            <p className="auth-switch" style={{ marginTop: '1.5rem' }}>
              <Link to="/login">返回登录</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">E</div>
          <h1>EnglishReader</h1>
          <p>重置密码</p>
        </div>

        <div className="auth-form">
          <h2>设置新密码</h2>
          <p className="form-desc">
            你好，<strong>{username}</strong>。请为账号 {email} 设置新密码。
          </p>

          {success && <div className="success-msg">{success}</div>}
          {error && <div className="error-msg">{error}</div>}

          {/* 密码历史冲突对话框 */}
          {passwordConflict && (
            <div className="password-conflict-box">
              <p className="conflict-title">该密码已被使用过</p>
              {isCurrentPassword ? (
                <p className="conflict-desc">这就是你当前的密码，你可以直接用它登录。</p>
              ) : (
                <p className="conflict-desc">这是你曾经使用过的密码。你可以选择：</p>
              )}
              <div className="conflict-actions">
                <button className="btn-conflict-keep" onClick={handleKeepOldPassword}>
                  {isCurrentPassword ? '用当前密码去登录' : '继续使用该密码'}
                </button>
                {isCurrentPassword ? null : (
                  <button className="btn-conflict-force" onClick={handleForceReset} disabled={loading}>
                    {loading ? '设置中...' : '确认使用该旧密码'}
                  </button>
                )}
                <button className="btn-conflict-new" onClick={handleChooseNew}>
                  输入其他新密码
                </button>
              </div>
            </div>
          )}

          {/* 密码输入表单 */}
          {!success && !passwordConflict && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码（至少6位）"
                  minLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label>确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? '重置中...' : '确认重置密码'}
              </button>
            </form>
          )}

          <p className="auth-switch" style={{ marginTop: '1.5rem' }}>
            <Link to="/login">返回登录</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
