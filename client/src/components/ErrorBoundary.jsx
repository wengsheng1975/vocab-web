import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#f8fafc',
          color: '#1e293b',
        }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>页面出错了</h1>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>
              {this.state.error?.message || '未知错误'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
