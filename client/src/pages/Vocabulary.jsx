import { useState, useEffect } from 'react'
import { vocabAPI } from '../api'

function Vocabulary() {
  const [words, setWords] = useState([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({})
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('active')
  const [sort, setSort] = useState('click_count')
  const [order, setOrder] = useState('DESC')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  const limit = 30

  useEffect(() => {
    loadWords()
  }, [search, status, sort, order, page])

  const loadWords = async () => {
    setLoading(true)
    try {
      const { data } = await vocabAPI.getAll({ status, sort, order, search, page, limit })
      setWords(data.words)
      setTotal(data.total)
      setStats(data.stats)
    } catch (err) {
      console.error('加载生词失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMaster = async (id) => {
    try {
      await vocabAPI.master(id)
      loadWords()
    } catch (err) {
      alert('操作失败')
    }
  }

  const handleRestore = async (id) => {
    try {
      await vocabAPI.restore(id)
      loadWords()
    } catch (err) {
      alert('操作失败')
    }
  }

  const totalPages = Math.ceil(total / limit)

  const getFreqLabel = (count) => {
    if (count >= 5) return { text: '极高频', cls: 'freq-5' }
    if (count >= 3) return { text: '高频', cls: 'freq-3' }
    if (count >= 2) return { text: '中频', cls: 'freq-2' }
    return { text: '低频', cls: 'freq-1' }
  }

  return (
    <div className="vocab-page">
      <div className="page-header">
        <h1>生词本</h1>
        <div className="vocab-stats-bar">
          <span className="vs-item active-item">活跃 {stats.activeCount || 0}</span>
          <span className="vs-item freq-item">高频 {stats.highFreqCount || 0}</span>
          <span className="vs-item mastered-item">已掌握 {stats.masteredCount || 0}</span>
        </div>
      </div>

      <div className="vocab-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索单词..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="filter-controls">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="active">活跃生词</option>
            <option value="mastered">已掌握</option>
            <option value="all">全部</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="click_count">按词频</option>
            <option value="last_clicked_at">按最近标记</option>
            <option value="first_seen_at">按首次出现</option>
            <option value="word">按字母</option>
          </select>
          <button className="btn-sort-order" onClick={() => setOrder(order === 'ASC' ? 'DESC' : 'ASC')}>
            {order === 'ASC' ? '↑ 升序' : '↓ 降序'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : words.length === 0 ? (
        <div className="empty-state">
          <p>{search ? '没有找到匹配的单词' : '生词本为空，去导入文章开始阅读吧！'}</p>
        </div>
      ) : (
        <>
          <div className="vocab-list">
            {words.map(word => {
              const freq = getFreqLabel(word.click_count)
              const isExpanded = expandedId === word.id
              return (
                <div key={word.id} className={`vocab-item ${word.status === 'mastered' ? 'mastered' : ''}`}>
                  <div className="vocab-main" onClick={() => setExpandedId(isExpanded ? null : word.id)}>
                    <div className="vocab-word-section">
                      <span className="vocab-word">{word.word}</span>
                      {word.phonetic && <span className="vocab-phonetic">{word.phonetic}</span>}
                    </div>
                    <div className="vocab-meta">
                      <span className={`freq-badge ${freq.cls}`}>
                        {freq.text} ({word.click_count}次)
                      </span>
                      {word.skip_count > 0 && (
                        <span className="skip-badge">跳过 {word.skip_count} 次</span>
                      )}
                      {word.status === 'mastered' && (
                        <span className="mastered-badge">已掌握</span>
                      )}
                    </div>
                    <span className="expand-arrow">{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {isExpanded && (
                    <div className="vocab-detail">
                      {word.meanings && word.meanings.length > 0 ? (
                        <div className="vocab-meanings">
                          <h4>释义（来自文章上下文）：</h4>
                          {word.meanings.map((m, i) => (
                            <div key={m.id || i} className="meaning-entry">
                              {m.meaning && <div className="me-meaning">{m.meaning}</div>}
                              {m.context_sentence && (
                                <div className="me-context">"{m.context_sentence}"</div>
                              )}
                              {m.article_title && (
                                <div className="me-source">来源：{m.article_title}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-meanings">暂无释义，请在阅读完成时添加</div>
                      )}
                      <div className="vocab-actions">
                        {word.status === 'active' ? (
                          <button className="btn-small btn-master" onClick={() => handleMaster(word.id)}>
                            标记为已掌握
                          </button>
                        ) : (
                          <button className="btn-small btn-restore" onClick={() => handleRestore(word.id)}>
                            恢复到生词库
                          </button>
                        )}
                        <span className="vocab-date">
                          首次出现：{new Date(word.first_seen_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
              <span>第 {page} / {totalPages} 页 (共 {total} 词)</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Vocabulary
