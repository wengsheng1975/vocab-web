import { Routes, Route, Navigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ImportArticle from './pages/ImportArticle'
import ReadingView from './pages/ReadingView'
import Vocabulary from './pages/Vocabulary'
import Library from './pages/Library'
import ReadingReport from './pages/ReadingReport'
import Progress from './pages/Progress'
import LevelCompare from './pages/LevelCompare'
import LoadingSpinner from './components/ui/LoadingSpinner'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  return user ? children : <Navigate to="/login" />
}

function App() {
  const { user } = useAuth()
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const mainClassName = isAuthPage
    ? 'flex-1 w-full'
    : 'flex-1 max-w-[68rem] mx-auto w-full px-4 sm:px-7 py-7 sm:py-10'

  return (
    <div className="min-h-screen app-shell flex flex-col">
      {user && <Navbar />}
      <main className={mainClassName}>
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
          <Route path="/level-compare" element={<PrivateRoute><LevelCompare /></PrivateRoute>} />
        </Routes>
      </main>
      {user && <Footer />}
    </div>
  )
}

export default App
