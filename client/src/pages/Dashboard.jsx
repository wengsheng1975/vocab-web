import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { statsAPI, articlesAPI, authAPI } from '../api'
import { LevelBadge, DiffBadge } from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import SplitText from '../components/reactbits/SplitText'
import AnimatedContent from '../components/reactbits/AnimatedContent'
import Aurora from '../components/reactbits/Aurora'
import ShinyText from '../components/reactbits/ShinyText'
import CountUp from '../components/reactbits/CountUp'

function Dashboard() {
  const { standalone } = useAuth()
  const [data, setData] = useState(null)
  const [reviewSuggestions, setReviewSuggestions] = useState([])
  const [unfinished, setUnfinished] = useState([])
  const [targetLevel, setTargetLevel] = useState('none')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [overviewRes, suggestionsRes, unfinishedRes, articlesRes] = await Promise.all([
        statsAPI.overview(),
        statsAPI.reviewSuggestions(),
        articlesAPI.getUnfinished().catch(() => ({ data: { unfinished: [] } })),
        articlesAPI.getAll().catch(() => ({ data: { articles: [] } })),
      ])
      setData(overviewRes.data)
      setReviewSuggestions(suggestionsRes.data.suggestions || [])
      const existingArticleIds = new Set((articlesRes.data?.articles || []).map((a) => a.id))
      const safeUnfinished = (unfinishedRes.data?.unfinished || []).filter((a) => existingArticleIds.has(a.id))
      setUnfinished(safeUnfinished)
      setTargetLevel(overviewRes.data?.user?.target_level || 'none')
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-8">
      <AnimatedContent distance={22} duration={0.55}>
        <section className="hero-panel relative overflow-hidden rounded-[1.75rem] border border-primary-300/40 px-5 py-6 sm:px-8 sm:py-9">
          <Aurora
            colorStops={['#158271', '#43b9a8', '#f97316', '#124f47']}
            speed={10}
            blur={90}
            opacity={0.38}
            size={66}
          />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.618fr_1fr] items-end">
            <div>
              <span className="inline-flex items-center rounded-full bg-white/18 border border-white/30 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-white/90 mb-3">
                智能阅读驾驶舱
              </span>
              <SplitText
                text={standalone ? '欢迎使用 EnglishReader' : `您好，${data?.user?.username || ''}`}
                tag="h1"
                className="text-white text-[clamp(1.68rem,1.2rem+1.65vw,2.7rem)] font-extrabold tracking-tight leading-[1.16]"
                splitType="words"
                delay={55}
                duration={0.5}
              />
              <p className="mt-3 text-white/88 text-[14px] sm:text-[15px] max-w-2xl">
                <ShinyText speed={4} className="text-white/90">
                  以文章阅读为主线，持续追踪词汇掌握与难度成长，让每次阅读都看得见进步。
                </ShinyText>
              </p>
              <div className="mt-4 flex items-center gap-2.5 flex-wrap text-white/90">
                <span className="text-[13px]">您当前英语水平</span>
                <LevelBadge level={data?.user?.estimatedLevel || 'unknown'} />
                <span className="text-white/60">|</span>
                <span className="text-[13px]">目标等级</span>
                <select
                  value={targetLevel}
                  onChange={async (e) => {
                    const newLevel = e.target.value
                    const prevLevel = targetLevel
                    setTargetLevel(newLevel)
                    try {
                      await authAPI.setTargetLevel(newLevel)
                    } catch (err) {
                      console.error('设置目标等级失败:', err)
                      setTargetLevel(prevLevel)
                    }
                  }}
                  className="text-[12px] px-2.5 py-1 rounded-lg border border-white/40 bg-white/15 text-white outline-none focus:border-white/60 cursor-pointer"
                >
                  <option value="none" className="text-surface-800">未设定</option>
                  <option value="gaokao" className="text-surface-800">高考</option>
                  <option value="cet4" className="text-surface-800">大学四级 (CET-4)</option>
                  <option value="cet6" className="text-surface-800">大学六级 (CET-6)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <MetricBox label="活跃生词" value={data?.vocab?.active || 0} />
              <MetricBox label="高频词" value={data?.vocab?.highFreq || 0} />
              <MetricBox label="已读文章" value={data?.articles?.completed || 0} />
              <MetricBox label="复习提醒" value={reviewSuggestions.length} />
            </div>
          </div>
        </section>
      </AnimatedContent>

      <AnimatedContent distance={18} duration={0.45}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-[1.28rem] font-bold text-surface-800 tracking-tight">学习任务面板</h2>
          <div className="toc-chip">今日目录</div>
        </div>
      </AnimatedContent>

      {/* Unfinished Reading Reminder */}
      {unfinished.length > 0 && (
        <AnimatedContent distance={20} duration={0.5}>
          <div className="rounded-xl bg-sky-50/80 border border-sky-200/50 p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-sky-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-semibold text-sky-800 mb-1">继续阅读</h3>
                <p className="text-[12px] text-sky-600 mb-2.5">
                  您有 {unfinished.length} 篇文章尚未读完
                </p>
                <div className="space-y-1">
                  {unfinished.map(a => (
                    <Link
                      key={a.id}
                      to={`/read/${a.id}`}
                      className="flex items-center justify-between px-3 py-2 bg-white/60 rounded-lg text-[13px] hover:bg-white transition-colors group"
                    >
                      <span className="text-surface-700 group-hover:text-primary-600 transition-colors truncate mr-3">{a.title}</span>
                      <span className="text-sky-600 text-[12px] font-medium text-right">
                        已读 {a.scroll_percentage}%
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnimatedContent>
      )}

      {/* Review Reminder */}
      {reviewSuggestions.length > 0 && (
        <AnimatedContent distance={20} duration={0.5}>
          <div className="rounded-xl bg-amber-50/80 border border-amber-200/50 p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-semibold text-amber-800 mb-1">复习提醒</h3>
                <p className="text-[12px] text-amber-600 mb-2.5">
                  {reviewSuggestions.length} 篇已读文章中仍有未掌握的生词
                </p>
                <div className="space-y-1">
                  {reviewSuggestions.slice(0, 3).map(s => (
                    <Link
                      key={s.articleId}
                      to={`/read/${s.articleId}`}
                      className="flex items-center justify-between px-3 py-2 bg-white/60 rounded-lg text-[13px] hover:bg-white transition-colors group"
                    >
                      <span className="text-surface-700 group-hover:text-primary-600 transition-colors truncate mr-3">{s.title}</span>
                      <span className="text-amber-600 text-[12px] font-medium text-right">{s.stillActiveCount} 个</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnimatedContent>
      )}

      {/* Stats Grid */}
      <AnimatedContent stagger={0.08} distance={20} duration={0.5}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<WordIcon />} value={data?.vocab?.active || 0} label="活跃生词" />
          <StatCard icon={<FireIcon />} value={data?.vocab?.highFreq || 0} label="高频生词" sub="需重点学习" highlight />
          <StatCard icon={<CheckIcon />} value={data?.vocab?.mastered || 0} label="已掌握" />
          <StatCard icon={<BookIcon />} value={data?.articles?.completed || 0} label="已读文章" />
        </div>
      </AnimatedContent>

      {/* Quick Actions */}
      <AnimatedContent distance={20} duration={0.5} delay={0.1}>
        <div>
          <h2 className="text-[15px] font-semibold text-surface-800 mb-3">开始学习</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: '/import', title: '导入新文章', desc: '粘贴文章开始阅读', icon: <ImportActionIcon />, primary: true },
              { to: '/library', title: '文库', desc: `${data?.articles?.completed || 0} 篇已读`, icon: <LibraryActionIcon /> },
              { to: '/vocabulary', title: '生词本', desc: `${data?.vocab?.active || 0} 个生词`, icon: <VocabActionIcon /> },
              { to: '/progress', title: '学习进度', desc: '水平变化趋势', icon: <ChartActionIcon /> },
            ].map(({ to, title, desc, icon, primary }) => (
              <Link key={to} to={to}>
                <Card hover className={`text-center group ${primary ? '!border-primary-200/80' : ''}`}>
                  <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-surface-50 text-surface-400 group-hover:text-primary-600 group-hover:bg-primary-50 flex items-center justify-center transition-colors duration-200">
                    {icon}
                  </div>
                  <div className="font-medium text-surface-700 text-[13px] mb-0.5">{title}</div>
                  <div className="text-[11px] text-surface-400">{desc}</div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </AnimatedContent>

      {/* High Frequency Words */}
      {data?.topHighFreqWords?.length > 0 && (
        <AnimatedContent distance={20} duration={0.5}>
          <Card>
            <h2 className="text-[15px] font-semibold text-surface-800 mb-1">高频生词提醒</h2>
            <p className="text-[12px] text-surface-400 mb-3">这些单词在多篇文章中都不认识，需要重点学习：</p>
            <div className="flex flex-wrap gap-1.5">
              {data.topHighFreqWords.map(w => (
                <span key={w.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50/80 border border-red-100 rounded-lg text-[13px]">
                  <span className="font-semibold text-red-700">{w.word}</span>
                  <span className="text-red-400 text-[11px]">{w.click_count}次</span>
                </span>
              ))}
            </div>
          </Card>
        </AnimatedContent>
      )}

      {/* Recent Sessions */}
      {data?.recentSessions?.length > 0 && (
        <AnimatedContent distance={20} duration={0.5}>
          <Card>
            <h2 className="text-[15px] font-semibold text-surface-800 mb-3">最近阅读</h2>
            <div className="space-y-1.5">
              {data.recentSessions.map(s => (
                <Link
                  key={s.id}
                  to={`/report/${s.id}`}
                  className="block px-3.5 py-2.5 rounded-lg border border-transparent hover:border-surface-200 hover:bg-surface-50/50 transition-all duration-150 group"
                >
                  <div className="font-medium text-surface-700 group-hover:text-primary-600 transition-colors text-[13px] mb-1">
                    {s.article_title}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <DiffBadge level={s.article_difficulty} />
                    <span className="text-surface-400">新词 +{s.new_words_count}</span>
                    <span className="text-surface-400">生词率 {s.unknown_percentage}%</span>
                    <span className="text-surface-300">{new Date(s.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </AnimatedContent>
      )}
    </div>
  )
}

/* ========== Small SVG icons (replacing HTML entities) ========== */
function MetricBox({ label, value }) {
  return (
    <div className="rounded-xl border border-white/22 bg-white/14 px-3 py-3">
      <div className="text-[11px] text-white/75 mb-0.5">{label}</div>
      <CountUp
        to={Number(value) || 0}
        duration={1.2}
        separator=","
        className="text-[1.15rem] font-bold text-white tracking-tight"
      />
    </div>
  )
}

function WordIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
}
function FireIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>
}
function CheckIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function BookIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
}
function ImportActionIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
}
function LibraryActionIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
}
function VocabActionIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>
}
function ChartActionIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
}

export default Dashboard
