import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { statsAPI } from '../api'

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

  useEffect(() => {
    if (!report && id !== 'latest') {
      loadSession()
    }
  }, [id])

  const loadSession = async () => {
    try {
      const { data } = await statsAPI.session(id)
      setSession(data.session)
      setArticleTitle(data.session.article_title)
    } catch (err) {
      console.error('加载报告失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  // 使用实时报告或从数据库加载的会话数据
  const data = report || session
  if (!data) return <div className="loading">报告不存在</div>

  const newWords = report?.newWordsCount ?? session?.new_words_count ?? 0
  const repeatedWords = report?.repeatedWordsCount ?? session?.repeated_words_count ?? 0
  const masteredWords = report?.masteredWordsCount ?? session?.mastered_words_count ?? 0
  const totalVocab = report?.totalVocab ?? session?.total_vocab_size ?? 0
  const unknownPct = report?.unknownPercentage ?? session?.unknown_percentage ?? 0
  const highFreq = report?.highFreqWords ?? session?.high_freq_words ?? []
  const userLevel = report?.userLevel?.level ?? session?.estimated_level ?? 'unknown'

  return (
    <div className="report-page">
      <div className="page-header">
        <h1>阅读报告</h1>
        <span className="report-article-title">{articleTitle}</span>
      </div>

      <div className="report-summary">
        <div className="report-card highlight-card">
          <div className="rc-icon">&#128214;</div>
          <div className="rc-content">
            <div className="rc-number">{newWords}</div>
            <div className="rc-label">新增生词</div>
          </div>
        </div>
        <div className="report-card">
          <div className="rc-icon">&#128260;</div>
          <div className="rc-content">
            <div className="rc-number">{repeatedWords}</div>
            <div className="rc-label">重复生词</div>
            <div className="rc-sub">之前也不认识</div>
          </div>
        </div>
        <div className="report-card success-card">
          <div className="rc-icon">&#127881;</div>
          <div className="rc-content">
            <div className="rc-number">{masteredWords}</div>
            <div className="rc-label">新掌握</div>
            <div className="rc-sub">连续3次未标记</div>
          </div>
        </div>
        <div className="report-card">
          <div className="rc-icon">&#128218;</div>
          <div className="rc-content">
            <div className="rc-number">{totalVocab}</div>
            <div className="rc-label">生词库总量</div>
          </div>
        </div>
      </div>

      <div className="report-details">
        <div className="report-section">
          <h3>阅读分析</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="di-label">生词率</span>
              <span className="di-value">{unknownPct}%</span>
            </div>
            <div className="detail-item">
              <span className="di-label">评估水平</span>
              <span className={`level-badge level-${userLevel}`}>
                {levelNames[userLevel]}
              </span>
            </div>
          </div>
        </div>

        {/* 生词率建议 */}
        <div className="report-section">
          <h3>学习建议</h3>
          <div className="advice-box">
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
        </div>

        {/* 高频生词提醒 */}
        {highFreq.length > 0 && (
          <div className="report-section warning-section">
            <h3>高频生词警告</h3>
            <p className="section-desc">以下单词你在多篇文章中都不认识，请务必重点学习：</p>
            <div className="high-freq-report-list">
              {highFreq.map((w, i) => (
                <div key={i} className="hfr-item">
                  <span className="hfr-word">{w.word}</span>
                  <span className="hfr-count">已出现 {w.count} 次</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="report-actions">
        <Link to="/vocabulary" className="btn-primary">查看生词本</Link>
        <Link to="/import" className="btn-secondary">继续阅读新文章</Link>
        <Link to="/" className="btn-secondary">返回首页</Link>
      </div>
    </div>
  )
}

export default ReadingReport
