import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { articlesAPI } from '../api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Alert from '../components/ui/Alert'
import { DiffBadge } from '../components/ui/Badge'
import PageHeader from '../components/ui/PageHeader'
import AnimatedContent from '../components/reactbits/AnimatedContent'

function ImportArticle() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const [issues, setIssues] = useState([])
  const [checking, setChecking] = useState(false)
  const [checkSource, setCheckSource] = useState('')
  const [dismissedOffsets, setDismissedOffsets] = useState(new Set())
  const [autoFixedCount, setAutoFixedCount] = useState(0)
  const [hoveredIssue, setHoveredIssue] = useState(null)
  const debounceRef = useRef(null)
  const prevContentRef = useRef('')
  const skipNextCheckRef = useRef(false)

  const [titleIssues, setTitleIssues] = useState([])
  const [checkingTitle, setCheckingTitle] = useState(false)
  const titleDebounceRef = useRef(null)
  const prevTitleRef = useRef('')

  const triggerCheck = useCallback((text) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!text || text.trim().length < 10) { setIssues([]); setCheckSource(''); return }
    debounceRef.current = setTimeout(async () => {
      setChecking(true)
      try {
        const { data } = await articlesAPI.grammarCheck(text)
        setCheckSource(data.source); setIssues(data.issues || []); setDismissedOffsets(new Set())
        let fixedText = text; let fixedCount = 0
        const autoIssues = (data.issues || []).filter(i => i.severity === 'auto' && i.suggestions.length > 0).sort((a, b) => b.offset - a.offset)
        for (const issue of autoIssues) {
          fixedText = fixedText.substring(0, issue.offset) + issue.suggestions[0] + fixedText.substring(issue.offset + issue.length)
          fixedCount++
        }
        if (fixedCount > 0 && fixedText !== text) {
          skipNextCheckRef.current = true
          setContent(fixedText)
          setAutoFixedCount(fixedCount)
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

  useEffect(() => {
    if (content !== prevContentRef.current) {
      prevContentRef.current = content
      if (skipNextCheckRef.current) {
        skipNextCheckRef.current = false
        return
      }
      triggerCheck(content)
    }
    // 组件卸载时清理防抖定时器，防止内存泄漏
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [content, triggerCheck])

  const triggerTitleCheck = useCallback((text) => {
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current)
    if (!text || text.trim().length < 3) { setTitleIssues([]); return }
    titleDebounceRef.current = setTimeout(async () => {
      setCheckingTitle(true)
      try { const { data } = await articlesAPI.grammarCheck(text); setTitleIssues((data.issues || []).filter(i => i.severity === 'warning')) }
      catch {} finally { setCheckingTitle(false) }
    }, 1500)
  }, [])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['txt', 'docx', 'pdf'].includes(ext)) { setError('不支持的文件格式'); return }
    setError(''); setUploading(true)
    try { const { data } = await articlesAPI.uploadFile(file); setContent(data.text); if (!title) setTitle(data.filename || '') }
    catch (err) { setError(err.response?.data?.error || '文件解析失败') }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  useEffect(() => {
    if (title !== prevTitleRef.current) { prevTitleRef.current = title; triggerTitleCheck(title) }
    return () => { if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current) }
  }, [title, triggerTitleCheck])

  const handleContentChange = (e) => {
    const nc = e.target.value; setContent(nc)
    if (issues.length > 0 && nc !== content) {
      const nd = new Set(dismissedOffsets)
      issues.forEach(i => { if (content.substring(i.offset, i.offset + i.length) !== nc.substring(i.offset, i.offset + i.length)) nd.add(i.offset) })
      setDismissedOffsets(nd)
    }
  }

  const applySuggestion = (issue, suggestion) => {
    setContent(content.substring(0, issue.offset) + suggestion + content.substring(issue.offset + issue.length))
    setDismissedOffsets(new Set([...dismissedOffsets, issue.offset])); setHoveredIssue(null)
  }

  const dismissIssue = (issue) => { setDismissedOffsets(new Set([...dismissedOffsets, issue.offset])); setHoveredIssue(null) }

  const activeIssues = issues.filter(i => !dismissedOffsets.has(i.offset))
  const warningIssues = activeIssues.filter(i => i.severity === 'warning')

  const handleImport = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { const { data } = await articlesAPI.import({ title, content }); setResult(data) }
    catch (err) { setError(err.response?.data?.error || '导入失败') }
    finally { setLoading(false) }
  }

  const startReading = () => { if (result?.article?.id) navigate(`/read/${result.article.id}`) }
  const levelNames = { A1: 'A1 入门', A2: 'A2 基础', B1: 'B1 中级', B2: 'B2 中高级', C1: 'C1 高级', C2: 'C2 精通' }

  const renderAnnotatedPreview = () => {
    if (!content || issues.length === 0) return null
    const visible = issues.filter(i => i.severity === 'warning' && !dismissedOffsets.has(i.offset)).sort((a, b) => a.offset - b.offset)
    if (visible.length === 0) return null
    const parts = []; let last = 0
    for (const issue of visible) {
      if (issue.offset < last) continue
      if (issue.offset > last) parts.push(<span key={`t-${last}`}>{content.substring(last, issue.offset)}</span>)
      parts.push(
        <span key={`i-${issue.offset}`} className="grammar-error" onMouseEnter={() => setHoveredIssue(issue)} onMouseLeave={() => setHoveredIssue(null)}>
          {content.substring(issue.offset, issue.offset + issue.length)}
          {hoveredIssue === issue && (
            <span className="absolute left-0 top-full mt-1 bg-white border border-surface-200 rounded-lg shadow-lg p-2.5 z-50 min-w-[200px] max-w-[320px] text-[13px] leading-relaxed whitespace-normal no-underline">
              <span className="block text-surface-700 mb-1.5">{issue.message}</span>
              {issue.suggestions.length > 0 && (
                <span className="flex gap-1 flex-wrap mb-1.5">
                  {issue.suggestions.map((s, i) => (
                    <button key={i} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-md text-[12px] font-medium hover:bg-primary-100 transition-colors" onMouseDown={(e) => { e.preventDefault(); applySuggestion(issue, s) }}>{s}</button>
                  ))}
                </span>
              )}
              <button className="px-1.5 py-0.5 bg-surface-100 text-surface-500 rounded-md text-[11px] hover:bg-surface-200 transition-colors" onMouseDown={(e) => { e.preventDefault(); dismissIssue(issue) }}>忽略</button>
            </span>
          )}
        </span>
      )
      last = issue.offset + issue.length
    }
    if (last < content.length) parts.push(<span key={`t-${last}`}>{content.substring(last)}</span>)
    return <div className="p-3.5 bg-white border border-surface-200 rounded-lg text-[13px] leading-[1.8] text-surface-700 max-h-[240px] overflow-y-auto whitespace-pre-wrap break-words mb-4">{parts}</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="导入文章" />
      <AnimatedContent distance={20} duration={0.5}>
        {!result ? (
          <Card padding="p-5 sm:p-7">
            <p className="text-[13px] text-surface-500 leading-relaxed mb-5">
              粘贴一篇英文文章，系统会自动检查语法并评估难度。阅读时可以点击不认识的单词加入生词库。
            </p>
            {error && <Alert type="error" className="mb-4">{error}</Alert>}
            <form onSubmit={handleImport} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-[13px] font-medium text-surface-600">文章标题 <span className="text-red-500">*</span></label>
                  {checkingTitle && <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">检查中...</span>}
                </div>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="给文章起一个标题" required className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 placeholder-surface-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all duration-150" />
                {titleIssues.length > 0 && (
                  <div className="space-y-1 mt-1">
                    {titleIssues.map((issue, i) => (
                      <div key={i} className="flex items-center gap-2 flex-wrap px-2.5 py-1.5 bg-red-50 rounded-md text-[12px] text-red-600">
                        <span>{issue.message}</span>
                        {issue.suggestions.length > 0 && <span className="flex gap-1 items-center text-surface-500">建议：{issue.suggestions.map((s, j) => (
                          <button key={j} className="px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded font-medium hover:bg-primary-100 transition-colors" onClick={() => { setTitle(title.substring(0, issue.offset) + s + title.substring(issue.offset + issue.length)) }}>{s}</button>
                        ))}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[13px] font-medium text-surface-600">文章内容 <span className="text-red-500">*</span></label>
                    {checking && <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">检查中...</span>}
                    {!checking && checkSource && <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">已检查</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input ref={fileInputRef} type="file" accept=".txt,.docx,.pdf" onChange={handleFileSelect} style={{ display: 'none' }} />
                    <Button variant="accent" size="xs" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? '解析中...' : '打开本地文件'}
                    </Button>
                    <span className="text-[11px] text-surface-400">.txt .docx .pdf</span>
                  </div>
                </div>
                <textarea value={content} onChange={handleContentChange} placeholder="手动输入、粘贴文本，或点击上方按钮打开本地文件..." rows={12} required className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-800 placeholder-surface-400 outline-none resize-y focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all duration-150 leading-relaxed" />
              </div>
              {(autoFixedCount > 0 || activeIssues.length > 0) && (
                <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-surface-50 rounded-lg text-[12px]">
                  {autoFixedCount > 0 && <span className="text-emerald-600 font-medium">已自动修复 {autoFixedCount} 处</span>}
                  {warningIssues.length > 0 && <span className="text-amber-600 font-medium">{warningIssues.length} 处语法建议</span>}
                  {warningIssues.length === 0 && activeIssues.length === 0 && autoFixedCount > 0 && <span className="text-emerald-600 font-medium">所有问题已处理</span>}
                </div>
              )}
              {renderAnnotatedPreview()}
              <Button type="submit" size="full" disabled={loading || checking}>
                {loading ? '正在分析...' : checking ? '正在检查语法...' : '导入并分析'}
              </Button>
            </form>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card padding="p-5 sm:p-7">
              <h2 className="text-lg font-bold text-surface-800 mb-5">{result.article.title}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                {[
                  { label: '难度等级', value: <DiffBadge level={result.difficulty.level} />, sub: levelNames[result.difficulty.level] },
                  { label: '难度评分', value: `${result.difficulty.score}/100` },
                  { label: '总词数', value: result.difficulty.details.wordCount },
                  { label: '不重复词数', value: result.difficulty.details.uniqueWordCount },
                  { label: '平均词长', value: result.difficulty.details.avgWordLength },
                  { label: '常用词占比', value: `${result.difficulty.details.commonRatio}%` },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="text-center p-3 bg-surface-50 rounded-lg">
                    <div className="text-[11px] text-surface-400 mb-1">{label}</div>
                    <div className="text-base font-bold text-surface-800">{value}</div>
                    {sub && <div className="text-[11px] text-surface-400 mt-0.5">{sub}</div>}
                  </div>
                ))}
              </div>
              {result.appropriateness && (
                <div className={`px-3.5 py-2.5 rounded-lg text-[13px] font-medium mb-5 ${result.appropriateness.appropriate ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {result.appropriateness.message}
                </div>
              )}
              <div>
                <h3 className="text-[12px] font-medium text-surface-400 mb-2">词汇等级分布</h3>
                <div className="space-y-1.5">
                  {Object.entries(result.difficulty.details.levelDistribution).map(([level, count]) => {
                    const total = result.difficulty.details.uniqueWordCount
                    const pct = total > 0 ? (count / total) * 100 : 0
                    return (
                      <div key={level} className="flex items-center gap-2.5">
                        <span className="w-7 text-[12px] text-surface-500 text-right font-medium">{level}</span>
                        <div className="flex-1 h-4 bg-surface-100 rounded overflow-hidden">
                          <div className={`h-full rounded diff-bg-${level.replace('+', 'plus')} transition-all duration-500`} style={{ width: `${pct}%`, minWidth: count > 0 ? '2px' : 0 }} />
                        </div>
                        <span className="w-20 text-[11px] text-surface-400">{count} ({Math.round(pct)}%)</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
            <div className="flex gap-2">
              <Button onClick={startReading} className="flex-1">开始阅读</Button>
              <Button variant="secondary" onClick={() => { setResult(null); setTitle(''); setContent(''); setIssues([]); setAutoFixedCount(0) }}>重新导入</Button>
            </div>
          </div>
        )}
      </AnimatedContent>
    </div>
  )
}

export default ImportArticle
