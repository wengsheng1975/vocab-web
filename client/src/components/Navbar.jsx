import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { user, logout, standalone } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <NavLink to="/">
          <span className="logo-icon">E</span>
          <span className="logo-text">EnglishReader</span>
        </NavLink>
      </div>
      <div className="navbar-links">
        <NavLink to="/" end>首页</NavLink>
        <NavLink to="/import">导入文章</NavLink>
        <NavLink to="/library">文库</NavLink>
        <NavLink to="/vocabulary">生词本</NavLink>
        <NavLink to="/progress">学习进度</NavLink>
      </div>
      {!standalone && (
        <div className="navbar-user">
          <span className="user-level">{user?.estimatedLevel || ''}</span>
          <span className="username">{user?.username}</span>
          <button onClick={handleLogout} className="btn-logout">退出</button>
        </div>
      )}
    </nav>
  )
}

export default Navbar
