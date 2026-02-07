import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { articlesAPI } from '../api'

function ImportArticle() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  // 语法检查状态（内容）
  const [issues, setIssues] = useState([])
  const [checking, setChecking] = useState(false)
  const [checkSource, setCheckSource] = useState('')
  const [dismissedOffsets, setDismissedOffsets] = useState(new Set())
  const [autoFixedCount, setAutoFixedCount] = useState(0)
  const [hoveredIssue, setHoveredIssue] = useState(null)
  const debounceRef = useRef(null)
  const prevContentRef = useRef('')

  // 语法检查状态（标题）
  const [titleIssues, setTitleIssues] = useState([])
  const [checkingTitle, setCheckingTitle] = useState(false)
  const titleDebounceRef = useRef(null)
  const prevTitleRef = useRef('')

  // 防抖触发语法检查
  const triggerCheck = useCallback((text) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!text || text.trim().length < 10) {
      setIssues([])
      setCheckSource('')
      return
    }
    debounceRef.current = setTimeout(async () => {
      setChecking(true)
      try {
        const { data } = await articlesAPI.grammarCheck(text)
        setCheckSource(data.source)
        setIssues(data.issues || [])
        setDismissedOffsets(new Set())

        // 自动修复 severity='auto' 的问题
        let fixedText = text
        let fixedCount = 0
        const autoIssues = (data.issues || [])
          .filter(i => i.severity === 'auto' && i.suggestions.length > 0)
          .sort((a, b) => b.offset - a.offset) // 从后往前替换，避免偏移错乱

        for (const issue of autoIssues) {
          const before = fixedText.substring(0, issue.offset)
          const after = fixedText.substring(issue.offset + issue.length)
          fixedText = before + issue.suggestions[0] + after
          fixedCount++
        }

        if (fixedCount > 0 && fixedText !== text) {
          setContent(fixedText)
          setAutoFixedCount(fixedCount)
          // 自动修复后重新检查剩余问题
          setTimeout(async () => {
            try {
              const { data: recheck } = await articlesAPI.grammarCheck(fixedText)
              setIssues(recheck.issues || [])
              setCheckSource(recheck.source)
            } catch (e) { /* ignore */ }
          }, 500)
        } else {
          setAutoFixedCount(0)
        }
      } catch (err) {
        console.error('语法检查失败:', err)
      } finally {
        setChecking(false)
      }
    }, 1500)
  }, [])

  // 内容变化时触发检查
  useEffect(() => {
    if (content !== prevContentRef.current) {
      prevContentRef.current = content
      triggerCheck(content)
    }
  }, [content, triggerCheck])

  // 标题语法检查（防抖）
  const triggerTitleCheck = useCallback((text) => {
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current)
    if (!text || text.trim().length < 3) { setTitleIssues([]); return }
    titleDebounceRef.current = setTimeout(async () => {
      setCheckingTitle(true)
      try {
        const { data } = await articlesAPI.grammarCheck(text)
        // 只保留 warning 级别（标题格式不自动修复，因为标题大小写规则不同）
        setTitleIssues((data.issues || []).filter(i => i.severity === 'warning'))
      } catch (e) { /* ignore */ }
      finally { setCheckingTitle(false) }
    }, 1500)
  }, [])

  // 文件上传处理
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop().toLowerCase()
    if (!['txt', 'docx', 'pdf'].includes(ext)) {
      setError('不支持的文件格式，请选择 .txt、.docx 或 .pdf 文件')
      return
    }

    setError('')
    setUploading(true)
    try {
      const { data } = await articlesAPI.uploadFile(file)
      setContent(data.text)
      if (!title) {
        setTitle(data.filename || '')
      }
    } catch (err) {
      setError(err.response?.data?.error || '文件解析失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (title !== prevTitleRef.current) {
      prevTitleRef.current = title
      triggerTitleCheck(title)
    }
  }, [title, triggerTitleCheck])

  // 内容变化时，标记修改区域为 dismissed
  const handleContentChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)

    // 如果用户手动编辑了有问题的区域，标记为 dismissed
    if (issues.length > 0 && newContent !== content) {
      const newDismissed = new Set(dismissedOffsets)
      issues.forEach(issue => {
        const oldText = content.substring(issue.offset, issue.offset + issue.length)
        const newText = newContent.substring(issue.offset, issue.offset + issue.length)
        if (oldText !== newText) {
          newDismissed.add(issue.offset)
        }
      })
      setDismissedOffsets(newDismissed)
    }
  }

  // 应用建议修复
  const applySuggestion = (issue, suggestion) => {
    const before = content.substring(0, issue.offset)
    const after = content.substring(issue.offset + issue.length)
    setContent(before + suggestion + after)
    const newDismissed = new Set(dismissedOffsets)
    newDismissed.add(issue.offset)
    setDismissedOffsets(newDismissed)
    setHoveredIssue(null)
  }

  // 忽略问题
  const dismissIssue = (issue) => {
    const newDismissed = new Set(dismissedOffsets)
    newDismissed.add(issue.offset)
    setDismissedOffsets(newDismissed)
    setHoveredIssue(null)
  }

  // 未解决的问题
  const activeIssues = issues.filter(i => !dismissedOffsets.has(i.offset))
  const warningIssues = activeIssues.filter(i => i.severity === 'warning')

  const handleImport = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await articlesAPI.import({ title, content })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || '导入失败')
    } finally {
      setLoading(false)
    }
  }

  const startReading = () => {
    if (result?.article?.id) {
      navigate(`/read/${result.article.id}`)
    }
  }

  const levelNames = {
    A1: 'A1 入门', A2: 'A2 基础', B1: 'B1 中级',
    B2: 'B2 中高级', C1: 'C1 高级', C2: 'C2 精通',
  }

  // 渲染带标记的文本预览
  const renderAnnotatedPreview = () => {
    if (!content || issues.length === 0) return null

    const visibleIssues = issues
      .filter(i => i.severity === 'warning' && !dismissedOffsets.has(i.offset))
      .sort((a, b) => a.offset - b.offset)

    if (visibleIssues.length === 0) return null

    const parts = []
    let lastIndex = 0

    for (const issue of visibleIssues) {
      if (issue.offset < lastIndex) continue
      if (issue.offset > lastIndex) {
        parts.push(<span key={`t-${lastIndex}`}>{content.substring(lastIndex, issue.offset)}</span>)
      }
      const issueText = content.substring(issue.offset, issue.offset + issue.length)
      parts.push(
        <span
          key={`i-${issue.offset}`}
          className="grammar-error"
          onMouseEnter={() => setHoveredIssue(issue)}
          onMouseLeave={() => setHoveredIssue(null)}
        >
          {issueText}
          {hoveredIssue === issue && (
            <span className="grammar-tooltip">
              <span className="gt-message">{issue.message}</span>
              {issue.suggestions.length > 0 && (
                <span className="gt-suggestions">
                  {issue.suggestions.map((s, i) => (
                    <button key={i} className="gt-suggest-btn" onMouseDown={(e) => { e.preventDefault(); applySuggestion(issue, s) }}>
                      {s}
                    </button>
                  ))}
                </span>
              )}
              <button className="gt-dismiss-btn" onMouseDown={(e) => { e.preventDefault(); dismissIssue(issue) }}>
                忽略
              </button>
            </span>
          )}
        </span>
      )
      lastIndex = issue.offset + issue.length
    }
    if (lastIndex < content.length) {
      parts.push(<span key={`t-${lastIndex}`}>{content.substring(lastIndex)}</span>)
    }

    return <div className="grammar-preview">{parts}</div>
  }

  return (
    <div className="import-page">
      <div className="page-header">
        <h1>导入文章</h1>
      </div>

      {!result ? (
        <form onSubmit={handleImport} className="import-form">
          <p className="form-desc">
            粘贴一篇英文文章，系统会自动检查语法并评估难度。阅读时你可以点击不认识的单词将其加入生词库。
          </p>

          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label>
              文章标题 <span className="required">*</span>
              {checkingTitle && <span className="check-status checking">检查中...</span>}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给文章起一个标题，方便日后查找"
              required
            />
            {titleIssues.length > 0 && (
              <div className="title-issues">
                {titleIssues.map((issue, i) => (
                  <div key={i} className="title-issue-item">
                    <span className="tii-msg">{issue.message}</span>
                    {issue.suggestions.length > 0 && (
                      <span className="tii-suggestions">
                        建议：{issue.suggestions.map((s, j) => (
                          <button key={j} className="gt-suggest-btn" onClick={() => {
                            const before = title.substring(0, issue.offset)
                            const after = title.substring(issue.offset + issue.length)
                            setTitle(before + s + after)
                          }}>{s}</button>
                        ))}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <div className="content-label-row">
              <label>
                文章内容 <span className="required">*</span>
                {checking && <span className="check-status checking">检查中...</span>}
                {!checking && checkSource && (
                  <span className="check-status done">
                    {checkSource === 'languagetool' ? '已检查 (LanguageTool)' : '已检查 (本地)'}
                  </span>
                )}
              </label>
              <div className="file-upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.docx,.pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn-upload-file"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? '解析中...' : '打开本地文件'}
                </button>
                <span className="upload-hint">支持 .txt .docx .pdf</span>
              </div>
            </div>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="手动输入、粘贴文本，或点击上方按钮打开本地文件..."
              rows={12}
              required
            />
          </div>

          {/* 语法检查摘要 */}
          {(autoFixedCount > 0 || activeIssues.length > 0) && (
            <div className="grammar-summary">
              {autoFixedCount > 0 && (
                <span className="gs-fixed">已自动修复 {autoFixedCount} 处格式问题</span>
              )}
              {warningIssues.length > 0 && (
                <span className="gs-warnings">{warningIssues.length} 处语法建议（见下方预览）</span>
              )}
              {warningIssues.length === 0 && activeIssues.length === 0 && autoFixedCount > 0 && (
                <span className="gs-clean">所有问题已处理</span>
              )}
            </div>
          )}

          {/* 语法问题预览 */}
          {renderAnnotatedPreview()}

          <button type="submit" className="btn-primary" disabled={loading || checking}>
            {loading ? '正在分析...' : checking ? '正在检查语法...' : '导入并分析'}
          </button>
        </form>
      ) : (
        <div className="import-result">
          <h2>文章分析结果</h2>

          <div className="analysis-card">
            <div className="analysis-header">
              <h3>{result.article.title}</h3>
            </div>

            <div className="analysis-grid">
              <div className="analysis-item">
                <span className="analysis-label">难度等级</span>
                <span className={`diff-badge diff-${result.difficulty.level}`}>
                  {levelNames[result.difficulty.level] || result.difficulty.level}
                </span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">难度评分</span>
                <span className="analysis-value">{result.difficulty.score}/100</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">总词数</span>
                <span className="analysis-value">{result.difficulty.details.wordCount}</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">不重复词数</span>
                <span className="analysis-value">{result.difficulty.details.uniqueWordCount}</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">平均词长</span>
                <span className="analysis-value">{result.difficulty.details.avgWordLength}</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">常用词占比</span>
                <span className="analysis-value">{result.difficulty.details.commonRatio}%</span>
              </div>
            </div>

            {result.appropriateness && (
              <div className={`appropriateness-msg ${result.appropriateness.appropriate ? 'appropriate' : 'inappropriate'}`}>
                {result.appropriateness.message}
              </div>
            )}

            <div className="analysis-levels">
              <h4>词汇等级分布</h4>
              <div className="level-bars">
                {Object.entries(result.difficulty.details.levelDistribution).map(([level, count]) => {
                  const total = result.difficulty.details.uniqueWordCount
                  const pct = total > 0 ? (count / total) * 100 : 0
                  return (
                    <div key={level} className="level-bar-item">
                      <span className="lb-label">{level}</span>
                      <div className="lb-track">
                        <div className={`lb-fill diff-bg-${level.replace('+', 'plus')}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="lb-count">{count} ({Math.round(pct)}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="import-actions">
            <button className="btn-primary" onClick={startReading}>
              开始阅读
            </button>
            <button className="btn-secondary" onClick={() => { setResult(null); setTitle(''); setContent(''); setIssues([]); setAutoFixedCount(0); }}>
              重新导入
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportArticle
