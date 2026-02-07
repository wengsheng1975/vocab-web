import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { articlesAPI, statsAPI } from '../api'

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
      const [articlesRes, suggestionsRes] = await Promise.all([
        articlesAPI.getAll(),
        statsAPI.reviewSuggestions(),
      ])
      setArticles(articlesRes.data.articles.filter(a => a.is_completed))
      setSuggestions(suggestionsRes.data.suggestions)
    } catch (err) {
      console.error('加载文库失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const suggestionMap = {}
  suggestions.forEach(s => { suggestionMap[s.articleId] = s })

  const handleDelete = async (id) => {
    try {
      await articlesAPI.delete(id)
      setDeleteConfirm(null)
      setArticles(articles.filter(a => a.id !== id))
    } catch (err) {
      alert('删除失败: ' + (err.response?.data?.error || '未知错误'))
    }
  }

  // 开始编辑：加载文章全文
  const startEdit = async (articleId) => {
    try {
      const { data } = await articlesAPI.get(articleId)
      setEditingId(articleId)
      setEditTitle(data.article.title)
      setEditContent(data.article.content)
    } catch (err) {
      alert('加载文章失败')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditContent('')
  }

  const saveEdit = async (andRead = false) => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('标题和内容不能为空')
      return
    }
    setSaving(true)
    try {
      await articlesAPI.update(editingId, { title: editTitle, content: editContent })
      if (andRead) {
        navigate(`/read/${editingId}`)
      } else {
        setEditingId(null)
        loadData()
      }
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.error || '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div className="library-page">
      <div className="page-header">
        <h1>文库</h1>
        <span className="library-count">共 {articles.length} 篇已读文章</span>
      </div>

      {suggestions.length > 0 && (
        <div className="review-reminder">
          <div className="reminder-icon">&#128276;</div>
          <div className="reminder-content">
            <strong>复习提醒</strong>
            <p>你有 {suggestions.length} 篇已读文章中仍存在未掌握的生词/词组，建议重新阅读以巩固记忆。</p>
          </div>
        </div>
      )}

      {/* 编辑面板 */}
      {editingId && (
        <div className="edit-overlay">
          <div className="edit-panel">
            <div className="edit-panel-header">
              <h2>编辑文章</h2>
              <button className="btn-close" onClick={cancelEdit}>&times;</button>
            </div>
            <div className="edit-panel-body">
              <div className="form-group">
                <label>标题</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>内容</label>
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={15} />
              </div>
            </div>
            <div className="edit-panel-footer">
              <button className="btn-primary" onClick={() => saveEdit(true)} disabled={saving}>
                {saving ? '保存中...' : '保存并开始阅读'}
              </button>
              <button className="btn-secondary" onClick={() => saveEdit(false)} disabled={saving}>
                仅保存
              </button>
              <button className="btn-secondary" onClick={cancelEdit}>取消</button>
            </div>
          </div>
        </div>
      )}

      {articles.length === 0 ? (
        <div className="empty-state">
          <p>文库为空，<Link to="/import">去导入一篇文章</Link>开始阅读吧！</p>
        </div>
      ) : (
        <div className="library-list">
          {articles.map(article => {
            const suggestion = suggestionMap[article.id]
            return (
              <div key={article.id} className={`library-card ${suggestion ? 'has-review' : ''}`}>
                <div className="lc-main">
                  <div className="lc-header">
                    <h3 className="lc-title">{article.title}</h3>
                    <div className="lc-badges">
                      <span className={`diff-badge diff-${article.difficulty_level}`}>
                        {diffNames[article.difficulty_level] || article.difficulty_level}
                      </span>
                      {suggestion && (
                        <span className="review-badge">
                          建议复习 ({suggestion.stillActiveCount}词)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="lc-meta">
                    <span>总词数 {article.word_count}</span>
                    <span>生词 {article.unknown_word_count}</span>
                    <span>生词率 {article.unknown_percentage}%</span>
                    <span>阅读于 {new Date(article.completed_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                  {suggestion && (
                    <div className="lc-active-words">
                      仍未掌握：{suggestion.stillActiveWords.map((w, i) => (
                        <span key={i} className="active-word-tag">{w}</span>
                      ))}
                      {suggestion.stillActiveCount > 5 && (
                        <span className="more-tag">等{suggestion.stillActiveCount}个</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="lc-actions">
                  <Link to={`/read/${article.id}`} className="btn-reread">
                    {suggestion ? '复习阅读' : '重新阅读'}
                  </Link>
                  <button className="btn-edit-article" onClick={() => startEdit(article.id)}>编辑</button>
                  {deleteConfirm === article.id ? (
                    <div className="delete-confirm">
                      <span>确定删除？</span>
                      <button className="btn-confirm-yes" onClick={() => handleDelete(article.id)}>确定</button>
                      <button className="btn-confirm-no" onClick={() => setDeleteConfirm(null)}>取消</button>
                    </div>
                  ) : (
                    <button className="btn-delete-article" onClick={() => setDeleteConfirm(article.id)}>删除</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Library
