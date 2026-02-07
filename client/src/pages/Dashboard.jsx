import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { statsAPI } from '../api'

const levelNames = {
  unknown: '未评估',
  A1: 'A1 入门',
  A2: 'A2 基础',
  B1: 'B1 中级',
  B2: 'B2 中高级',
  C1: 'C1 高级',
  C2: 'C2 精通',
}

function Dashboard() {
  const { standalone } = useAuth()
  const [data, setData] = useState(null)
  const [reviewSuggestions, setReviewSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [overviewRes, suggestionsRes] = await Promise.all([
        statsAPI.overview(),
        statsAPI.reviewSuggestions(),
      ])
      setData(overviewRes.data)
      setReviewSuggestions(suggestionsRes.data.suggestions || [])
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div className="dashboard">
      <div className="welcome-section">
        <h1>{standalone ? '欢迎使用 EnglishReader！' : `你好，${data?.user?.username}！`}</h1>
        <p>
          当前英语水平：
          <span className={`level-badge level-${(data?.user?.estimatedLevel || 'unknown').replace('+', '')}`}>
            {levelNames[data?.user?.estimatedLevel] || '未评估'}
          </span>
        </p>
      </div>

      {/* 复习提醒 */}
      {reviewSuggestions.length > 0 && (
        <div className="review-reminder dashboard-reminder">
          <div className="reminder-icon">&#128276;</div>
          <div className="reminder-content">
            <strong>复习提醒</strong>
            <p>{reviewSuggestions.length} 篇已读文章中仍有未掌握的生词/词组，建议复习阅读：</p>
            <div className="reminder-articles">
              {reviewSuggestions.slice(0, 3).map(s => (
                <Link key={s.articleId} to={`/read/${s.articleId}`} className="reminder-article-link">
                  <span className="ra-title">{s.title}</span>
                  <span className="ra-count">{s.stillActiveCount} 个未掌握</span>
                </Link>
              ))}
              {reviewSuggestions.length > 3 && (
                <Link to="/library" className="reminder-more">查看全部 &rarr;</Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{data?.vocab?.active || 0}</div>
          <div className="stat-label">活跃生词</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-number">{data?.vocab?.highFreq || 0}</div>
          <div className="stat-label">高频生词</div>
          <div className="stat-sub">需重点学习</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{data?.vocab?.mastered || 0}</div>
          <div className="stat-label">已掌握</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{data?.articles?.completed || 0}</div>
          <div className="stat-label">已读文章</div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>开始学习</h2>
        <div className="action-grid-4">
          <Link to="/import" className="action-card primary-action">
            <div className="action-icon">&#128196;</div>
            <div className="action-title">导入新文章</div>
            <div className="action-desc">粘贴文章开始阅读</div>
          </Link>
          <Link to="/library" className="action-card">
            <div className="action-icon">&#128218;</div>
            <div className="action-title">文库</div>
            <div className="action-desc">{data?.articles?.completed || 0} 篇已读文章</div>
          </Link>
          <Link to="/vocabulary" className="action-card">
            <div className="action-icon">&#128214;</div>
            <div className="action-title">生词本</div>
            <div className="action-desc">{data?.vocab?.active || 0} 个生词</div>
          </Link>
          <Link to="/progress" className="action-card">
            <div className="action-icon">&#128200;</div>
            <div className="action-title">学习进度</div>
            <div className="action-desc">水平变化趋势</div>
          </Link>
        </div>
      </div>

      {data?.topHighFreqWords?.length > 0 && (
        <div className="section-card">
          <h2>高频生词提醒</h2>
          <p className="section-desc">这些单词/词组你在多篇文章中都不认识，需要重点学习：</p>
          <div className="high-freq-list">
            {data.topHighFreqWords.map(w => (
              <div key={w.id} className="high-freq-item">
                <span className="hf-word">{w.word}</span>
                <span className="hf-count">出现 {w.click_count} 次</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.recentSessions?.length > 0 && (
        <div className="section-card">
          <h2>最近阅读</h2>
          <div className="recent-sessions">
            {data.recentSessions.map(s => (
              <Link key={s.id} to={`/report/${s.id}`} className="session-item">
                <div className="session-title">{s.article_title}</div>
                <div className="session-meta">
                  <span className={`diff-badge diff-${s.article_difficulty}`}>{s.article_difficulty}</span>
                  <span>新词 +{s.new_words_count}</span>
                  <span>生词率 {s.unknown_percentage}%</span>
                  <span>{new Date(s.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
