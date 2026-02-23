import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { statsAPI } from '../api'
import { LevelBadge, DiffBadge } from '../components/ui/Badge'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import AnimatedContent from '../components/reactbits/AnimatedContent'
import CountUp from '../components/reactbits/CountUp'

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
    Promise.all([statsAPI.overview(), statsAPI.levelHistory(), statsAPI.sessions()])
      .then(([ov, lh, ss]) => {
        setOverview(ov.data)
        setHistory(Array.isArray(lh.data?.history) ? lh.data.history : [])
        setSessions(Array.isArray(ss.data?.sessions) ? ss.data.sessions : [])
      })
      .catch(err => console.error('加载进度数据失败:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const trend = history.length >= 2
    ? (levelOrder[history[history.length - 1]?.level] || 0) - (levelOrder[history[0]?.level] || 0)
    : 0

  const recentUnknownPcts = sessions.slice(0, 5).map(s => s.unknown_percentage)
  const olderUnknownPcts = sessions.slice(5, 10).map(s => s.unknown_percentage)
  const recentAvg = recentUnknownPcts.length > 0 ? recentUnknownPcts.reduce((a, b) => a + b, 0) / recentUnknownPcts.length : 0
  const olderAvg = olderUnknownPcts.length > 0 ? olderUnknownPcts.reduce((a, b) => a + b, 0) / olderUnknownPcts.length : recentAvg

  const maxLevel = 6; const chartWidth = 600; const chartHeight = 200; const padding = 40

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="学习进度" />

      {/* Overview Cards */}
      <AnimatedContent stagger={0.08} distance={15} duration={0.4}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white rounded-xl border border-surface-200/80 p-4 text-center">
            <div className="text-[11px] text-surface-400 mb-2 font-medium">当前水平</div>
            <LevelBadge level={overview?.user?.estimatedLevel || 'unknown'} />
          </div>
          <div className="bg-white rounded-xl border border-surface-200/80 p-4 text-center">
            <div className="text-[11px] text-surface-400 mb-2 font-medium">水平趋势</div>
            <div className={`text-lg font-bold ${trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-500' : 'text-surface-400'}`}>
              {trend > 0 ? '↑ 上升中' : trend < 0 ? '↓ 下降中' : '→ 稳定'}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-surface-200/80 p-4 text-center">
            <div className="text-[11px] text-surface-400 mb-2 font-medium">总阅读文章</div>
            <div className="text-lg font-bold text-surface-800"><CountUp to={overview?.articles?.completed || 0} duration={1} suffix=" 篇" /></div>
          </div>
          <div className="bg-white rounded-xl border border-surface-200/80 p-4 text-center">
            <div className="text-[11px] text-surface-400 mb-2 font-medium">近期平均生词率</div>
            <div className="text-lg font-bold text-surface-800"><CountUp to={Math.round(recentAvg * 10) / 10} duration={1} decimals={1} suffix="%" /></div>
            {olderUnknownPcts.length > 0 && (
              <div className={`text-[11px] font-medium mt-0.5 ${recentAvg < olderAvg ? 'text-emerald-500' : recentAvg > olderAvg ? 'text-red-500' : 'text-surface-400'}`}>
                {recentAvg < olderAvg ? '↓ 进步' : recentAvg > olderAvg ? '↑ 需加油' : ''}
              </div>
            )}
          </div>
        </div>
      </AnimatedContent>

      {/* Level Trend Chart */}
      {history.length > 1 && (
        <AnimatedContent distance={15} duration={0.5}>
          <Card className="mb-5">
            <h2 className="text-[15px] font-semibold text-surface-800 mb-3">水平变化趋势</h2>
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className="w-full max-w-[600px] mx-auto block">
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl, i) => {
                  const y = chartHeight - padding - ((i + 1) / maxLevel) * (chartHeight - padding * 2)
                  return (<g key={lvl}><text x={padding - 5} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{lvl}</text><line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4" /></g>)
                })}
                {(() => {
                  const points = history.map((h, i) => {
                    const x = padding + (i / (history.length - 1)) * (chartWidth - padding * 2)
                    const y = chartHeight - padding - ((levelOrder[h.level] || 0) / maxLevel) * (chartHeight - padding * 2)
                    return { x, y, date: h.assessed_at }
                  })
                  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
                  const areaPath = linePath + ` L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
                  return (<>
                    <defs><linearGradient id="levelGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>
                    <path d={areaPath} fill="url(#levelGrad)" />
                    <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
                    {points.map((p, i) => (<g key={i}><circle cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
                      {(i % Math.max(1, Math.floor(points.length / 6)) === 0 || i === points.length - 1) && (<text x={p.x} y={chartHeight - 5} textAnchor="middle" fontSize="10" fill="#94a3b8">{new Date(p.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</text>)}
                    </g>))}
                  </>)
                })()}
              </svg>
            </div>
          </Card>
        </AnimatedContent>
      )}

      {/* Unknown Rate Chart */}
      {sessions.length > 0 && (
        <AnimatedContent distance={15} duration={0.5}>
          <Card className="mb-5">
            <h2 className="text-[15px] font-semibold text-surface-800 mb-1">生词率变化</h2>
            <p className="text-[12px] text-surface-400 mb-3">每篇文章的生词率。越低说明词汇量在增长。</p>
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className="w-full max-w-[600px] mx-auto block">
                {[0, 10, 20, 30, 40, 50].map(pct => {
                  const y = chartHeight - padding - (pct / 50) * (chartHeight - padding * 2)
                  return (<g key={pct}><text x={padding - 5} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{pct}%</text><line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4" /></g>)
                })}
                {(() => {
                  const reversed = [...sessions].reverse().slice(-20)
                  const points = reversed.map((s, i) => {
                    const x = padding + (i / Math.max(1, reversed.length - 1)) * (chartWidth - padding * 2)
                    const y = chartHeight - padding - (Math.min(50, s.unknown_percentage) / 50) * (chartHeight - padding * 2)
                    return { x, y, date: s.created_at }
                  })
                  if (points.length < 2) return null
                  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
                  const areaPath = linePath + ` L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
                  return (<>
                    <defs><linearGradient id="pctGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" /><stop offset="100%" stopColor="#06b6d4" stopOpacity="0" /></linearGradient></defs>
                    <path d={areaPath} fill="url(#pctGrad)" />
                    <path d={linePath} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinejoin="round" />
                    {points.map((p, i) => (<g key={i}><circle cx={p.x} cy={p.y} r="4" fill="#06b6d4" stroke="white" strokeWidth="2" />
                      {(i % Math.max(1, Math.floor(points.length / 6)) === 0 || i === points.length - 1) && (<text x={p.x} y={chartHeight - 5} textAnchor="middle" fontSize="10" fill="#94a3b8">{new Date(p.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</text>)}
                    </g>))}
                  </>)
                })()}
              </svg>
            </div>
          </Card>
        </AnimatedContent>
      )}

      {/* Reading History */}
      <AnimatedContent distance={15} duration={0.5}>
        <Card>
          <h2 className="text-[15px] font-semibold text-surface-800 mb-3">阅读历史</h2>
          {sessions.length === 0 ? (
            <EmptyState title="还没有阅读记录" description="导入一篇文章开始吧！">
              <Link to="/import" className="text-primary-600 font-medium text-[13px] hover:text-primary-700">去导入文章 →</Link>
            </EmptyState>
          ) : (
            <div className="space-y-1.5">
              {sessions.map(s => (
                <Link key={s.id} to={`/report/${s.id}`} className="block px-3.5 py-2.5 rounded-lg border border-transparent hover:border-surface-200 hover:bg-surface-50/50 transition-all duration-150 group">
                  <div className="font-medium text-surface-700 group-hover:text-primary-600 transition-colors text-[13px] mb-1">{s.article_title}</div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <DiffBadge level={s.article_difficulty} />
                    <span className="text-surface-400">新词 +{s.new_words_count}</span>
                    <span className="text-surface-400">重复 {s.repeated_words_count}</span>
                    <span className="text-surface-400">掌握 +{s.mastered_words_count}</span>
                    <span className="text-surface-400">生词率 {s.unknown_percentage}%</span>
                    <span className="text-surface-300">{new Date(s.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </AnimatedContent>
    </div>
  )
}

export default Progress
