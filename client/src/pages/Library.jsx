import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { articlesAPI, statsAPI } from '../api'
import Button from '../components/ui/Button'
import { DiffBadge, StatusBadge } from '../components/ui/Badge'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal'
import AnimatedContent from '../components/reactbits/AnimatedContent'

function Library() {
  const [articles, setArticles] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [folders, setFolders] = useState([])
  const [uncategorizedCount, setUncategorizedCount] = useState(0)

  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState(false)
  const [renamingFolderId, setRenamingFolderId] = useState(null)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [activeFolder, setActiveFolder] = useState('all')
  const [draggingArticleId, setDraggingArticleId] = useState(null)
  const [dragOverTarget, setDragOverTarget] = useState(null)

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)

  const navigate = useNavigate()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [articlesRes, suggestionsRes, foldersRes] = await Promise.all([
        articlesAPI.getAll(),
        statsAPI.reviewSuggestions(),
        articlesAPI.getFolders(),
      ])
      setArticles(articlesRes.data?.articles ?? [])
      setSuggestions(suggestionsRes.data?.suggestions ?? [])
      setFolders(foldersRes.data?.folders ?? [])
      setUncategorizedCount(foldersRes.data?.uncategorizedCount ?? 0)
    } catch (err) {
      console.error('加载文库失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const suggestionMap = useMemo(() => {
    const map = {}
    suggestions.forEach((s) => { map[s.articleId] = s })
    return map
  }, [suggestions])

  const visibleArticles = useMemo(() => {
    if (activeFolder === 'all') return articles
    if (activeFolder === 'uncategorized') return articles.filter((a) => !a.folder_id)
    return articles.filter((a) => Number(a.folder_id) === Number(activeFolder))
  }, [articles, activeFolder])

  const handleDelete = async (id) => {
    try {
      await articlesAPI.delete(id)
      setDeleteConfirm(null)
      await loadData()
    } catch (err) {
      alert('删除失败: ' + (err.response?.data?.error || '未知错误'))
    }
  }

  const startEdit = async (articleId) => {
    try {
      const { data } = await articlesAPI.get(articleId)
      setEditingId(articleId)
      setEditTitle(data.article.title)
      setEditContent(data.article.content)
    } catch {
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
        await loadData()
      }
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.error || '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    const safeName = newFolderName.trim()
    if (!safeName) return

    setCreatingFolder(true)
    try {
      await articlesAPI.createFolder({ name: safeName })
      setNewFolderName('')
      await loadData()
    } catch (err) {
      alert(err.response?.data?.error || '创建文件夹失败')
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleDeleteFolder = async (folderId, folderName) => {
    const confirmed = window.confirm(`删除文件夹「${folderName}」？该文件夹下文章将回到未分类。`)
    if (!confirmed) return

    try {
      await articlesAPI.deleteFolder(folderId)
      if (Number(activeFolder) === Number(folderId)) {
        setActiveFolder('all')
      }
      await loadData()
    } catch (err) {
      alert(err.response?.data?.error || '删除文件夹失败')
    }
  }

  const handleRenameFolder = async (folder) => {
    if (!folder?.id) return
    const input = window.prompt('请输入新的文件夹名称', folder.name || '')
    if (input === null) return

    const safeName = input.trim()
    if (!safeName) {
      alert('文件夹名称不能为空')
      return
    }
    if (safeName.length > 30) {
      alert('文件夹名称不能超过 30 个字符')
      return
    }
    if (safeName.toLowerCase() === String(folder.name || '').trim().toLowerCase()) {
      return
    }

    setRenamingFolderId(folder.id)
    try {
      await articlesAPI.renameFolder(folder.id, { name: safeName })
      await loadData()
    } catch (err) {
      alert(err.response?.data?.error || '重命名失败')
    } finally {
      setRenamingFolderId(null)
    }
  }

  const moveArticleToFolder = async (articleId, folderId) => {
    setMoving(true)
    try {
      await articlesAPI.moveToFolder(articleId, folderId)
      await loadData()
    } catch (err) {
      alert(err.response?.data?.error || '移动文章失败')
    } finally {
      setMoving(false)
    }
  }

  const onArticleDragStart = (e, articleId, articleTitle) => {
    setDraggingArticleId(articleId)
    e.dataTransfer.setData('text/plain', String(articleId))
    e.dataTransfer.effectAllowed = 'move'

    // 使用小尺寸拖拽预览，避免默认整张卡片过大
    const dragChip = document.createElement('div')
    dragChip.style.position = 'fixed'
    dragChip.style.top = '-9999px'
    dragChip.style.left = '-9999px'
    dragChip.style.zIndex = '9999'
    dragChip.style.padding = '6px 10px'
    dragChip.style.maxWidth = '220px'
    dragChip.style.border = '1px solid #bfdbfe'
    dragChip.style.borderRadius = '8px'
    dragChip.style.background = '#eff6ff'
    dragChip.style.color = '#1d4ed8'
    dragChip.style.fontSize = '12px'
    dragChip.style.fontWeight = '600'
    dragChip.style.whiteSpace = 'nowrap'
    dragChip.style.overflow = 'hidden'
    dragChip.style.textOverflow = 'ellipsis'
    dragChip.style.boxShadow = '0 6px 18px rgba(30,64,175,0.16)'
    dragChip.textContent = `移动文章：${articleTitle || '未命名文章'}`
    document.body.appendChild(dragChip)
    e.dataTransfer.setDragImage(dragChip, 12, 12)
    requestAnimationFrame(() => {
      dragChip.remove()
    })
  }

  const onArticleDragEnd = () => {
    setDraggingArticleId(null)
    setDragOverTarget(null)
  }

  const onFolderDrop = async (e, folderId) => {
    e.preventDefault()
    setDragOverTarget(null)

    const articleId = Number(e.dataTransfer.getData('text/plain') || draggingArticleId)
    if (!articleId) return

    const article = articles.find((a) => a.id === articleId)
    const currentFolderId = article?.folder_id ? Number(article.folder_id) : null
    const nextFolderId = folderId === null ? null : Number(folderId)
    if (currentFolderId === nextFolderId) return

    await moveArticleToFolder(articleId, nextFolderId)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="文库">
        <span className="text-[13px] text-surface-500 bg-surface-100 px-2.5 py-1 rounded-md font-medium">
          共 {articles.length} 篇文章
          {articles.filter((a) => !a.is_completed).length > 0 && `（${articles.filter((a) => !a.is_completed).length} 篇未读完）`}
        </span>
      </PageHeader>

      {suggestions.length > 0 && (
        <AnimatedContent distance={15} duration={0.4}>
          <div className="rounded-xl bg-amber-50/80 border border-amber-200/50 p-4 mb-5 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <div>
              <h3 className="text-[13px] font-semibold text-amber-800 mb-0.5">复习提醒</h3>
              <p className="text-[12px] text-amber-600">您有 {suggestions.length} 篇已读文章中仍存在未掌握的生词/词组，建议重新阅读。</p>
            </div>
          </div>
        </AnimatedContent>
      )}

      <div className="bg-white rounded-xl border border-surface-200/80 p-4 mb-4">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <h3 className="text-[14px] font-semibold text-surface-800">自定义文件夹（可拖拽文章分类，双击名称可改名）</h3>
          {moving && <span className="text-[12px] text-primary-600 font-medium">移动中...</span>}
          {renamingFolderId && <span className="text-[12px] text-primary-600 font-medium">重命名中...</span>}
        </div>

        <form onSubmit={handleCreateFolder} className="flex gap-2 mb-3">
          <input
            type="text"
            maxLength={30}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="新建文件夹名称（最多30字）"
            className="flex-1 px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
          />
          <Button size="sm" type="submit" disabled={creatingFolder || !newFolderName.trim()}>
            {creatingFolder ? '创建中...' : '新建文件夹'}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveFolder('all')}
            className={`px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors ${activeFolder === 'all' ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'}`}
          >
            全部 ({articles.length})
          </button>

          <div
            onClick={() => setActiveFolder('uncategorized')}
            onDragOver={(e) => { e.preventDefault(); setDragOverTarget('uncategorized') }}
            onDragLeave={() => setDragOverTarget(null)}
            onDrop={(e) => onFolderDrop(e, null)}
            className={`px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors cursor-pointer ${activeFolder === 'uncategorized' ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'} ${dragOverTarget === 'uncategorized' ? '!bg-emerald-50 !border-emerald-300 !text-emerald-700' : ''}`}
            title="把文章拖到这里可移回未分类"
          >
            未分类 ({uncategorizedCount})
          </div>

          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              onDragOver={(e) => { e.preventDefault(); setDragOverTarget(folder.id) }}
              onDragLeave={() => setDragOverTarget(null)}
              onDrop={(e) => onFolderDrop(e, folder.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors cursor-pointer ${Number(activeFolder) === Number(folder.id) ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'} ${Number(dragOverTarget) === Number(folder.id) ? '!bg-emerald-50 !border-emerald-300 !text-emerald-700' : ''}`}
              title="把文章拖到这里分类"
            >
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  handleRenameFolder(folder)
                }}
                className="select-none"
                title="双击重命名"
              >
                {folder.name} ({folder.articleCount})
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteFolder(folder.id, folder.name)
                }}
                disabled={renamingFolderId === folder.id}
                className="w-4 h-4 rounded text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label={`删除文件夹 ${folder.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <Modal open={!!editingId} onClose={cancelEdit} maxWidth="max-w-2xl">
        <ModalHeader onClose={cancelEdit}>编辑文章</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-surface-600">标题</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-surface-600">内容</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={15}
                className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 outline-none resize-y focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all leading-relaxed"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button className="flex-1" onClick={() => saveEdit(true)} disabled={saving}>{saving ? '保存中...' : '保存并阅读'}</Button>
          <Button variant="secondary" onClick={() => saveEdit(false)} disabled={saving}>仅保存</Button>
          <Button variant="ghost" onClick={cancelEdit}>取消</Button>
        </ModalFooter>
      </Modal>

      {articles.length === 0 ? (
        <EmptyState title="文库为空" description="导入文章开始阅读，您的阅读记录将保存在这里。">
          <Link to="/import"><Button size="sm">导入第一篇文章</Button></Link>
        </EmptyState>
      ) : visibleArticles.length === 0 ? (
        <EmptyState title="该分类暂无文章" description="把右侧文章卡片拖到对应文件夹即可归类。">
          <Button size="sm" variant="secondary" onClick={() => setActiveFolder('all')}>查看全部文章</Button>
        </EmptyState>
      ) : (
        <AnimatedContent stagger={0.05} distance={15} duration={0.4}>
          <div className="space-y-2">
            {visibleArticles.map((article) => {
              const suggestion = suggestionMap[article.id]
              const folderLabel = article.folder_name || '未分类'

              return (
                <div
                  key={article.id}
                  draggable
                  onDragStart={(e) => onArticleDragStart(e, article.id, article.title)}
                  onDragEnd={onArticleDragEnd}
                  className={`bg-white rounded-xl border border-surface-200/80 transition-shadow duration-200 hover:shadow-sm overflow-hidden cursor-grab active:cursor-grabbing ${draggingArticleId === article.id ? 'opacity-70' : ''} ${suggestion ? 'border-l-[3px] border-l-amber-400' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start p-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="font-semibold text-surface-800 text-[15px]">{article.title}</h3>
                        <DiffBadge level={article.difficulty_level} />
                        {!article.is_completed && <StatusBadge text="未读完" color="warning" />}
                        {suggestion && <StatusBadge text={`建议复习 (${suggestion.stillActiveCount}词)`} color="warning" />}
                        <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded-md text-[11px] font-medium">{folderLabel}</span>
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
