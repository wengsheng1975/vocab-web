import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ImportArticle from './pages/ImportArticle'
import ReadingView from './pages/ReadingView'
import Vocabulary from './pages/Vocabulary'
import Library from './pages/Library'
import ReadingReport from './pages/ReadingReport'
import Progress from './pages/Progress'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">加载中...</div>
  return user ? children : <Navigate to="/login" />
}

function App() {
  const { user } = useAuth()

  return (
    <div className="app">
      {user && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/import" element={<PrivateRoute><ImportArticle /></PrivateRoute>} />
          <Route path="/read/:id" element={<PrivateRoute><ReadingView /></PrivateRoute>} />
          <Route path="/vocabulary" element={<PrivateRoute><Vocabulary /></PrivateRoute>} />
          <Route path="/library" element={<PrivateRoute><Library /></PrivateRoute>} />
          <Route path="/report/:id" element={<PrivateRoute><ReadingReport /></PrivateRoute>} />
          <Route path="/progress" element={<PrivateRoute><Progress /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  )
}

export default App
