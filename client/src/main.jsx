import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App.jsx'
import './index.css'

class ErrorFallback extends Component {
  state = { error: null }
  static getDerivedStateFromError(err) {
    return { error: err }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', padding: 24, background: '#f8fafc', fontFamily: 'system-ui', color: '#1e293b' }}>
          <h2 style={{ marginBottom: 8 }}>页面加载出错</h2>
          <pre style={{ background: '#e2e8f0', padding: 12, borderRadius: 8, overflow: 'auto', fontSize: 13 }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorFallback>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorFallback>
  </StrictMode>,
)
