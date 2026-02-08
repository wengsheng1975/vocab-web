import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { statsAPI } from '../api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { LevelBadge } from '../components/ui/Badge'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import AnimatedContent from '../components/reactbits/AnimatedContent'
import CountUp from '../components/reactbits/CountUp'

const levelNames = {
  unknown: '未评估', A1: 'A1 入门', A2: 'A2 基础', B1: 'B1 中级',
  B2: 'B2 中高级', C1: 'C1 高级', C2: 'C2 精通',
}

function ReadingReport() {
  const { id } = useParams()
  const location = useLocation()
  const [report, setReport] = useState(location.state?.report || null)
  const [session, setSession] = useState(null)
  const [articleTitle, setArticleTitle] = useState(location.state?.articleTitle || '')
  const [loading, setLoading] = useState(!location.state?.report)

  useEffect(() => { if (!report && id !== 'latest') loadSession() }, [id])

  const loadSession = async () => {
    try { const { data } = await statsAPI.session(id); setSession(data.session); setArticleTitle(data.session.article_title) }
    catch (err) { console.error('加载报告失败:', err) }
    finally { setLoading(false) }
  }

  if (loading) return <LoadingSpinner />

  const data = report || session
  if (!data) return <div className="flex items-center justify-center min-h-[300px] text-surface-400">报告不存在</div>

  const newWords = report?.newWordsCount ?? session?.new_words_count ?? 0
  const repeatedWords = report?.repeatedWordsCount ?? session?.repeated_words_count ?? 0
  const masteredWords = report?.masteredWordsCount ?? session?.mastered_words_count ?? 0
  const totalVocab = report?.totalVocab ?? session?.total_vocab_size ?? 0
  const unknownPct = report?.unknownPercentage ?? session?.unknown_percentage ?? 0
  const highFreq = report?.highFreqWords ?? session?.high_freq_words ?? []
  const userLevel = report?.userLevel?.level ?? session?.estimated_level ?? 'unknown'

  const reportCards = [
    { icon: <BookPlusIcon />, value: newWords, label: '新增生词', accent: 'border-l-primary-500 bg-primary-50/30' },
    { icon: <RepeatIcon />, value: repeatedWords, label: '重复生词', sub: '之前也不认识', accent: 'border-l-amber-500 bg-amber-50/30' },
    { icon: <TrophyIcon />, value: masteredWords, label: '新掌握', sub: '连续3次未标记', accent: 'border-l-emerald-500 bg-emerald-50/30' },
    { icon: <StackIcon />, value: totalVocab, label: '生词库总量', accent: 'border-l-accent-500 bg-accent-50/30' },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="阅读报告">
        <span className="text-[13px] text-surface-500 bg-surface-100 px-2.5 py-1 rounded-md font-medium truncate max-w-xs">{articleTitle}</span>
      </PageHeader>

      {/* Summary Cards */}
      <AnimatedContent stagger={0.08} distance={20} duration={0.5}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {reportCards.map(({ icon, value, label, sub, accent }) => (
            <div key={label} className={`rounded-xl border-l-[3px] p-4 ${accent}`}>
              <div className="text-surface-500 mb-1.5">{icon}</div>
              <div className="text-2xl font-bold text-surface-800"><CountUp to={value} duration={1} /></div>
              <div className="text-[13px] text-surface-500 font-medium">{label}</div>
              {sub && <div className="text-[11px] text-surface-400">{sub}</div>}
            </div>
          ))}
        </div>
      </AnimatedContent>

      {/* Analysis */}
      <AnimatedContent distance={15} duration={0.5} delay={0.1}>
        <div className="space-y-3 mb-8">
          <Card>
            <h3 className="font-semibold text-surface-800 text-[15px] mb-3">阅读分析</h3>
            <div className="flex flex-wrap gap-5">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-surface-500">生词率</span>
                <span className="text-lg font-bold text-surface-800">{unknownPct}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-surface-500">评估水平</span>
                <LevelBadge level={userLevel} />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-surface-800 text-[15px] mb-2.5">学习建议</h3>
            <div className="p-3.5 bg-sky-50/80 rounded-lg text-[13px] text-sky-700 leading-relaxed">
              {unknownPct < 5 ? (
                <p>生词率很低 ({unknownPct}%)，这篇文章对你来说比较简单。可以尝试阅读更有挑战性的文章来提升水平。</p>
              ) : unknownPct < 15 ? (
                <p>生词率 {unknownPct}%，非常理想！这个难度最适合你学习，能在理解文章的同时有效积累新词汇。</p>
              ) : unknownPct < 30 ? (
                <p>生词率 {unknownPct}%，略有挑战。建议多花时间复习这些生词，必要时可以选择稍简单的文章。</p>
              ) : (
                <p>生词率较高 ({unknownPct}%)，这篇文章对你来说偏难。建议先巩固现有生词，选择更适合当前水平的文章。</p>
              )}
            </div>
          </Card>

          {highFreq.length > 0 && (
            <Card className="!border-l-[3px] !border-l-amber-400">
              <h3 className="font-semibold text-surface-800 text-[15px] mb-1">高频生词警告</h3>
              <p className="text-[12px] text-surface-400 mb-3">以下单词你在多篇文章中都不认识，请务必重点学习：</p>
              <div className="space-y-1.5">
                {highFreq.map((w, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-amber-50/80 rounded-lg">
                    <span className="font-semibold text-amber-700 text-[13px]">{w.word}</span>
                    <span className="text-[12px] text-amber-500">已出现 {w.count} 次</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </AnimatedContent>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Link to="/vocabulary" className="flex-1"><Button size="full">查看生词本</Button></Link>
        <Link to="/import"><Button variant="secondary" size="md">继续阅读新文章</Button></Link>
        <Link to="/"><Button variant="ghost" size="md">返回首页</Button></Link>
      </div>
    </div>
  )
}

/* SVG Icons replacing HTML entities */
function BookPlusIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
}
function RepeatIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" /></svg>
}
function TrophyIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228M18.75 4.236V2.721M7.73 9.728a6.726 6.726 0 002.748 1.35m3.044 0a6.726 6.726 0 002.749-1.35m0 0a6.772 6.772 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg>
}
function StackIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg>
}

export default ReadingReport
