import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { articlesAPI, statsAPI } from '../api'
import Button from '../components/ui/Button'
import { DiffBadge, StatusBadge } from '../components/ui/Badge'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal'
import AnimatedContent from '../components/reactbits/AnimatedContent'

const diffNames = {
  A1: 'A1 入门', A2: 'A2 基础', B1: 'B1 中级',
  B2: 'B2 中高级', C1: 'C1 高级', C2: 'C2 精通',
}

function Library() {
  const [articles, setArticles] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [articlesRes, suggestionsRes] = await Promise.all([articlesAPI.getAll(), statsAPI.reviewSuggestions()])
      setArticles(articlesRes.data?.articles ?? [])
      setSuggestions(suggestionsRes.data?.suggestions ?? [])
    } catch (err) { console.error('加载文库失败:', err) }
    finally { setLoading(false) }
  }

  const suggestionMap = {}
  suggestions.forEach(s => { suggestionMap[s.articleId] = s })

  const handleDelete = async (id) => {
    try { await articlesAPI.delete(id); setDeleteConfirm(null); setArticles(articles.filter(a => a.id !== id)) }
    catch (err) { alert('删除失败: ' + (err.response?.data?.error || '未知错误')) }
  }

  const startEdit = async (articleId) => {
    try { const { data } = await articlesAPI.get(articleId); setEditingId(articleId); setEditTitle(data.article.title); setEditContent(data.article.content) }
    catch { alert('加载文章失败') }
  }

  const cancelEdit = () => { setEditingId(null); setEditTitle(''); setEditContent('') }

  const saveEdit = async (andRead = false) => {
    if (!editTitle.trim() || !editContent.trim()) { alert('标题和内容不能为空'); return }
    setSaving(true)
    try {
      await articlesAPI.update(editingId, { title: editTitle, content: editContent })
      if (andRead) navigate(`/read/${editingId}`); else { setEditingId(null); loadData() }
    } catch (err) { alert('保存失败: ' + (err.response?.data?.error || '未知错误')) }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="文库">
        <span className="text-[13px] text-surface-500 bg-surface-100 px-2.5 py-1 rounded-md font-medium">
          共 {articles.length} 篇文章
          {articles.filter(a => !a.is_completed).length > 0 && `（${articles.filter(a => !a.is_completed).length} 篇未读完）`}
        </span>
      </PageHeader>

      {/* Review Reminder */}
      {suggestions.length > 0 && (
        <AnimatedContent distance={15} duration={0.4}>
          <div className="rounded-xl bg-amber-50/80 border border-amber-200/50 p-4 mb-5 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <div>
              <h3 className="text-[13px] font-semibold text-amber-800 mb-0.5">复习提醒</h3>
              <p className="text-[12px] text-amber-600">你有 {suggestions.length} 篇已读文章中仍存在未掌握的生词/词组，建议重新阅读。</p>
            </div>
          </div>
        </AnimatedContent>
      )}

      {/* Edit Modal */}
      <Modal open={!!editingId} onClose={cancelEdit} maxWidth="max-w-2xl">
        <ModalHeader onClose={cancelEdit}>编辑文章</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-surface-600">标题</label>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-surface-600">内容</label>
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={15}
                className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 outline-none resize-y focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all leading-relaxed" />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button className="flex-1" onClick={() => saveEdit(true)} disabled={saving}>{saving ? '保存中...' : '保存并阅读'}</Button>
          <Button variant="secondary" onClick={() => saveEdit(false)} disabled={saving}>仅保存</Button>
          <Button variant="ghost" onClick={cancelEdit}>取消</Button>
        </ModalFooter>
      </Modal>

      {/* Article List */}
      {articles.length === 0 ? (
        <EmptyState title="文库为空" description="导入文章开始阅读，你的阅读记录将保存在这里。">
          <Link to="/import"><Button size="sm">导入第一篇文章</Button></Link>
        </EmptyState>
      ) : (
        <AnimatedContent stagger={0.05} distance={15} duration={0.4}>
          <div className="space-y-2">
            {articles.map(article => {
              const suggestion = suggestionMap[article.id]
              return (
                <div key={article.id} className={`bg-white rounded-xl border border-surface-200/80 transition-shadow duration-200 hover:shadow-sm overflow-hidden ${suggestion ? 'border-l-[3px] border-l-amber-400' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start p-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="font-semibold text-surface-800 text-[15px]">{article.title}</h3>
                        <DiffBadge level={article.difficulty_level} />
                        {!article.is_completed && <StatusBadge text="未读完" color="warning" />}
                        {suggestion && <StatusBadge text={`建议复习 (${suggestion.stillActiveCount}词)`} color="warning" />}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-surface-400 mb-1.5">
                        <span>总词数 {article.word_count}</span>
                        {article.is_completed && (
                          <>
                            <span>生词 {article.unknown_word_count}</span>
                            <span>生词率 {article.unknown_percentage}%</span>
                            <span>阅读于 {new Date(article.completed_at).toLocaleDateString('zh-CN')}</span>
                          </>
                        )}
                      </div>
                      {suggestion && (
                        <div className="flex flex-wrap gap-1 items-center mt-1.5">
                          <span className="text-[11px] text-surface-400">仍未掌握：</span>
                          {suggestion.stillActiveWords.map((w, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded-md text-[11px] font-medium">{w}</span>
                          ))}
                          {suggestion.stillActiveCount > 5 && <span className="text-[11px] text-surface-400">等{suggestion.stillActiveCount}个</span>}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col gap-1.5 flex-shrink-0">
                      <Link to={`/read/${article.id}`}>
                        <Button size="xs">{!article.is_completed ? '继续阅读' : suggestion ? '复习阅读' : '重新阅读'}</Button>
                      </Link>
                      <Button variant="soft" size="xs" onClick={() => startEdit(article.id)}>编辑</Button>
                      {deleteConfirm === article.id ? (
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-surface-500">确定？</span>
                          <button className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-medium hover:bg-red-100 transition-colors" onClick={() => handleDelete(article.id)}>确定</button>
                          <button className="px-1.5 py-0.5 bg-surface-100 text-surface-500 rounded hover:bg-surface-200 transition-colors" onClick={() => setDeleteConfirm(null)}>取消</button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="xs" className="!text-surface-400 hover:!text-red-500 hover:!bg-red-50" onClick={() => setDeleteConfirm(article.id)}>删除</Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </AnimatedContent>
      )}
    </div>
  )
}

export default Library
