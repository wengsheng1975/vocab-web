import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { statsAPI } from '../api'

const levelNames = {
  unknown: '未评估', A1: 'A1 入门', A2: 'A2 基础', B1: 'B1 中级',
  B2: 'B2 中高级', C1: 'C1 高级', C2: 'C2 精通',
}

const levelOrder = { unknown: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }

function Progress() {
  const [overview, setOverview] = useState(null)
  const [history, setHistory] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      statsAPI.overview(),
      statsAPI.levelHistory(),
      statsAPI.sessions(),
    ]).then(([ov, lh, ss]) => {
      setOverview(ov.data)
      setHistory(lh.data.history)
      setSessions(ss.data.sessions)
    }).catch(err => {
      console.error('加载进度数据失败:', err)
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="loading">加载中...</div>

  // 计算水平趋势
  const trend = history.length >= 2
    ? (levelOrder[history[history.length - 1]?.level] || 0) - (levelOrder[history[0]?.level] || 0)
    : 0

  // 计算生词率趋势
  const recentUnknownPcts = sessions.slice(0, 5).map(s => s.unknown_percentage)
  const olderUnknownPcts = sessions.slice(5, 10).map(s => s.unknown_percentage)
  const recentAvg = recentUnknownPcts.length > 0
    ? recentUnknownPcts.reduce((a, b) => a + b, 0) / recentUnknownPcts.length
    : 0
  const olderAvg = olderUnknownPcts.length > 0
    ? olderUnknownPcts.reduce((a, b) => a + b, 0) / olderUnknownPcts.length
    : recentAvg

  // 可视化等级图表（简单的 SVG 折线图）
  const maxLevel = 6
  const chartWidth = 600
  const chartHeight = 200
  const padding = 40

  return (
    <div className="progress-page">
      <div className="page-header">
        <h1>学习进度</h1>
      </div>

      <div className="progress-overview">
        <div className="po-card">
          <div className="po-label">当前水平</div>
          <div className={`po-level level-badge level-${overview?.user?.estimatedLevel || 'unknown'}`}>
            {levelNames[overview?.user?.estimatedLevel] || '未评估'}
          </div>
        </div>
        <div className="po-card">
          <div className="po-label">水平趋势</div>
          <div className={`po-trend ${trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-stable'}`}>
            {trend > 0 ? '↑ 上升中' : trend < 0 ? '↓ 下降中' : '→ 稳定'}
          </div>
        </div>
        <div className="po-card">
          <div className="po-label">总阅读文章</div>
          <div className="po-value">{overview?.articles?.completed || 0} 篇</div>
        </div>
        <div className="po-card">
          <div className="po-label">近期平均生词率</div>
          <div className="po-value">
            {Math.round(recentAvg * 10) / 10}%
            {olderUnknownPcts.length > 0 && (
              <span className={recentAvg < olderAvg ? 'improving' : 'declining'}>
                {recentAvg < olderAvg ? ' ↓ 进步' : recentAvg > olderAvg ? ' ↑ 需加油' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 等级变化图表 */}
      {history.length > 1 && (
        <div className="section-card">
          <h2>水平变化趋势</h2>
          <div className="chart-container">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className="level-chart">
              {/* Y 轴标签 */}
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl, i) => {
                const y = chartHeight - padding - ((i + 1) / maxLevel) * (chartHeight - padding * 2)
                return (
                  <g key={lvl}>
                    <text x={padding - 5} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{lvl}</text>
                    <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4" />
                  </g>
                )
              })}

              {/* 折线 */}
              {history.length > 1 && (() => {
                const points = history.map((h, i) => {
                  const x = padding + (i / (history.length - 1)) * (chartWidth - padding * 2)
                  const lvlVal = levelOrder[h.level] || 0
                  const y = chartHeight - padding - (lvlVal / maxLevel) * (chartHeight - padding * 2)
                  return { x, y, level: h.level, date: h.assessed_at, article: h.article_title }
                })

                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

                return (
                  <>
                    <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
                        {/* 每隔几个显示日期 */}
                        {(i % Math.max(1, Math.floor(points.length / 6)) === 0 || i === points.length - 1) && (
                          <text x={p.x} y={chartHeight - 5} textAnchor="middle" fontSize="10" fill="#94a3b8">
                            {new Date(p.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                          </text>
                        )}
                      </g>
                    ))}
                  </>
                )
              })()}
            </svg>
          </div>
        </div>
      )}

      {/* 生词率变化 */}
      {sessions.length > 0 && (
        <div className="section-card">
          <h2>生词率变化</h2>
          <p className="section-desc">每篇文章的生词率。生词率越低说明你的词汇量在增长。</p>
          <div className="chart-container">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className="pct-chart">
              {/* Y 轴 */}
              {[0, 10, 20, 30, 40, 50].map(pct => {
                const y = chartHeight - padding - (pct / 50) * (chartHeight - padding * 2)
                return (
                  <g key={pct}>
                    <text x={padding - 5} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{pct}%</text>
                    <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4" />
                  </g>
                )
              })}

              {/* 折线 */}
              {(() => {
                const reversed = [...sessions].reverse().slice(-20) // 按时间正序
                const points = reversed.map((s, i) => {
                  const x = padding + (i / Math.max(1, reversed.length - 1)) * (chartWidth - padding * 2)
                  const pct = Math.min(50, s.unknown_percentage)
                  const y = chartHeight - padding - (pct / 50) * (chartHeight - padding * 2)
                  return { x, y, pct: s.unknown_percentage, title: s.article_title, date: s.created_at }
                })

                if (points.length < 2) return null

                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

                return (
                  <>
                    <path d={linePath} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinejoin="round" />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#06b6d4" stroke="white" strokeWidth="2" />
                        {(i % Math.max(1, Math.floor(points.length / 6)) === 0 || i === points.length - 1) && (
                          <text x={p.x} y={chartHeight - 5} textAnchor="middle" fontSize="10" fill="#94a3b8">
                            {new Date(p.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                          </text>
                        )}
                      </g>
                    ))}
                  </>
                )
              })()}
            </svg>
          </div>
        </div>
      )}

      {/* 阅读历史 */}
      <div className="section-card">
        <h2>阅读历史</h2>
        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>还没有阅读记录，<Link to="/import">去导入一篇文章</Link>开始吧！</p>
          </div>
        ) : (
          <div className="session-list">
            {sessions.map(s => (
              <Link key={s.id} to={`/report/${s.id}`} className="session-row">
                <div className="sr-title">{s.article_title}</div>
                <div className="sr-meta">
                  <span className={`diff-badge diff-${s.article_difficulty}`}>{s.article_difficulty}</span>
                  <span>新词 +{s.new_words_count}</span>
                  <span>重复 {s.repeated_words_count}</span>
                  <span>掌握 +{s.mastered_words_count}</span>
                  <span>生词率 {s.unknown_percentage}%</span>
                  <span className="sr-date">{new Date(s.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Progress
