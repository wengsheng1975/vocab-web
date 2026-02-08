import { useState, useEffect, useRef } from 'react'
import { vocabAPI } from '../api'
import { FreqBadge, StatusBadge } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import AnimatedContent from '../components/reactbits/AnimatedContent'

function Vocabulary() {
  const [words, setWords] = useState([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({})
  const [targetLevel, setTargetLevel] = useState('none')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('active')
  const [sort, setSort] = useState('click_count')
  const [order, setOrder] = useState('DESC')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const searchTimerRef = useRef(null)

  const limit = 30

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [search])

  useEffect(() => { loadWords() }, [debouncedSearch, status, sort, order, page])

  const loadWords = async () => {
    setLoading(true)
    try {
      const { data } = await vocabAPI.getAll({ status, sort, order, search: debouncedSearch, page, limit })
      setWords(data.words); setTotal(data.total); setStats(data.stats); setTargetLevel(data.targetLevel || 'none')
    } catch (err) { console.error('加载生词失败:', err) }
    finally { setLoading(false) }
  }

  const handleMaster = async (id) => { try { await vocabAPI.master(id); loadWords() } catch { alert('操作失败') } }
  const handleRestore = async (id) => { try { await vocabAPI.restore(id); loadWords() } catch { alert('操作失败') } }
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="生词本">
        <div className="flex items-center gap-1.5">
          <StatusBadge text={`活跃 ${stats.activeCount || 0}`} color="primary" />
          <StatusBadge text={`高频 ${stats.highFreqCount || 0}`} color="danger" />
          <StatusBadge text={`已掌握 ${stats.masteredCount || 0}`} color="success" />
          {targetLevel !== 'none' && stats.outOfScopeCount > 0 && (
            <StatusBadge text={`超纲 ${stats.outOfScopeCount}`} color="warning" />
          )}
        </div>
      </PageHeader>

      {/* Controls */}
      <AnimatedContent distance={15} duration={0.4}>
        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" placeholder="搜索单词..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 placeholder-surface-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all" />
          </div>
          <div className="flex gap-2">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="px-3 py-2.5 bg-white border border-surface-200 rounded-lg text-[13px] text-surface-700 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all">
              <option value="active">活跃生词</option>
              <option value="mastered">已掌握</option>
              <option value="all">全部</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2.5 bg-white border border-surface-200 rounded-lg text-[13px] text-surface-700 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all">
              <option value="click_count">按词频</option>
              <option value="last_clicked_at">按最近标记</option>
              <option value="first_seen_at">按首次出现</option>
              <option value="word">按字母</option>
            </select>
            <button className="px-3 py-2.5 bg-white border border-surface-200 rounded-lg text-[13px] text-surface-600 hover:bg-surface-50 transition-all"
              onClick={() => setOrder(order === 'ASC' ? 'DESC' : 'ASC')}>
              {order === 'ASC' ? '↑ 升序' : '↓ 降序'}
            </button>
          </div>
        </div>
      </AnimatedContent>

      {/* Word List */}
      {loading ? (
        <LoadingSpinner />
      ) : words.length === 0 ? (
        <EmptyState
          title={debouncedSearch ? '没有找到匹配的单词' : '生词本为空'}
          description={debouncedSearch ? '尝试其他关键词' : '去导入文章开始阅读，标记不认识的单词吧！'}
        />
      ) : (
        <AnimatedContent stagger={0.04} distance={15} duration={0.4}>
          <div className="space-y-1.5">
            {words.map(word => {
              const isExpanded = expandedId === word.id
              return (
                <div key={word.id} className={`bg-white rounded-xl border border-surface-200/80 overflow-hidden transition-shadow duration-200 hover:shadow-sm ${word.status === 'mastered' ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between px-4 py-3 cursor-pointer gap-3" onClick={() => setExpandedId(isExpanded ? null : word.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-semibold text-primary-700 text-[15px]">{word.word}</span>
                        {/* 美式音标：优先大纲音标，其次用户自填 */}
                        {(word.dictPhonetic || word.phonetic) && (
                          <span className="text-[12px] text-surface-400 font-mono">{word.dictPhonetic || word.phonetic}</span>
                        )}
                        {word.lemma && (
                          <span className="text-[11px] text-surface-400">
                            <span className="text-surface-300">←</span> <span className="font-medium text-primary-500">{word.lemma}</span>
                            <span className="text-surface-300 ml-0.5">({word.wordForm})</span>
                          </span>
                        )}
                        {word.outOfScope && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700 border border-orange-200 leading-none">
                            超纲
                          </span>
                        )}
                        {word.cetLevel && word.cetLevel !== 'beyond' && (
                          <span className="text-[10px] text-surface-400 font-medium uppercase">{word.cetLevel === 'cet4' ? 'CET4' : 'CET6'}</span>
                        )}
                      </div>
                      {/* 大纲释义 */}
                      {word.dictMeaning && (
                        <div className="text-[12px] text-surface-500 mt-0.5 truncate">{word.dictMeaning}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <FreqBadge count={word.click_count} />
                      {word.skip_count > 0 && <StatusBadge text={`跳过${word.skip_count}`} color="success" />}
                      {word.status === 'mastered' && <StatusBadge text="已掌握" color="success" />}
                      <svg className={`w-3.5 h-3.5 text-surface-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-surface-100">
                      <div className="pt-3">
                        {word.meanings && word.meanings.length > 0 ? (
                          <div>
                            <h4 className="text-[11px] font-medium text-surface-400 uppercase tracking-wider mb-2">释义（来自文章上下文）</h4>
                            <div className="space-y-2">
                              {word.meanings.map((m, i) => (
                                <div key={m.id || i} className="p-2.5 bg-surface-50 rounded-lg">
                                  {m.meaning && <div className="font-medium text-surface-700 text-[13px]">{m.meaning}</div>}
                                  {m.context_sentence && <div className="text-[12px] text-surface-500 italic mt-0.5">"{m.context_sentence}"</div>}
                                  {m.article_title && <div className="text-[11px] text-surface-400 mt-0.5">来源：{m.article_title}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[13px] text-surface-400 py-2">暂无释义，请在阅读完成时添加</p>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100">
                          {word.status === 'active' ? (
                            <Button variant="soft" size="xs" onClick={() => handleMaster(word.id)}>标记为已掌握</Button>
                          ) : (
                            <Button variant="soft" size="xs" onClick={() => handleRestore(word.id)}>恢复到生词库</Button>
                          )}
                          <span className="text-[11px] text-surface-400">首次出现：{new Date(word.first_seen_at).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
              <span className="text-[13px] text-surface-500">第 {page} / {totalPages} 页 (共 {total} 词)</span>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
            </div>
          )}
        </AnimatedContent>
      )}
    </div>
  )
}

export default Vocabulary
