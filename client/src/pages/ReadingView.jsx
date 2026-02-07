import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { articlesAPI } from '../api'

/**
 * 将文章内容拆分为可交互的 token
 */
function tokenize(text) {
  const tokens = []
  const regex = /([a-zA-Z]+)|([^a-zA-Z]+)/g
  let match
  let index = 0
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'word', text: match[1], lower: match[1].toLowerCase(), index: index++ })
    } else {
      tokens.push({ type: 'other', text: match[2] })
    }
  }
  return tokens
}

function ReadingView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [tokens, setTokens] = useState([])
  const [clickedWords, setClickedWords] = useState(new Set())  // 单词（红色）
  const [phrases, setPhrases] = useState([])                    // 词组（绿色）: { text, indices: number[] }
  const [loading, setLoading] = useState(true)
  const [showFinishPanel, setShowFinishPanel] = useState(false)
  const [wordMeanings, setWordMeanings] = useState({})
  const [finishing, setFinishing] = useState(false)

  // 拖动状态
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd, setDragEnd] = useState(null)
  const mouseDownRef = useRef(false)
  const hasDraggedRef = useRef(false)  // 区分点击和拖动

  // 用 ref 保存最新状态供 mouseup handler 使用
  const stateRef = useRef({})
  stateRef.current = { dragStart, dragEnd, clickedWords, phrases, tokens }

  useEffect(() => { loadArticle() }, [id])

  const loadArticle = async () => {
    try {
      const { data } = await articlesAPI.get(id)
      setArticle(data.article)
      const toks = tokenize(data.article.content)
      setTokens(toks)

      // 已掌握的单词/词组集合（重读时用于过滤）
      const masteredWordSet = new Set(data.masteredWords || [])
      const masteredPhraseSet = new Set(data.masteredPhrases || [])

      // 恢复单词标记，过滤掉已掌握的
      const restoredWords = (data.clickedWords || []).filter(w => !masteredWordSet.has(w))
      setClickedWords(new Set(restoredWords))

      // 恢复词组标记，过滤掉已掌握的
      if (data.clickedPhrases) {
        const restoredPhrases = data.clickedPhrases
          .filter(p => !masteredPhraseSet.has(p.text))
          .map(p => ({ text: p.text, indices: p.indices }))
        setPhrases(restoredPhrases)
      }
    } catch (err) {
      console.error('加载文章失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // ===== 词组 index 查找表：wordIndex -> phraseArrayIndex =====
  const phraseIndexMap = useMemo(() => {
    const map = new Map()
    phrases.forEach((p, pi) => {
      p.indices.forEach(wi => map.set(wi, pi))
    })
    return map
  }, [phrases])

  // ===== 拖动预览范围 =====
  const dragRange = useMemo(() => {
    if (dragStart === null || dragEnd === null || dragStart === dragEnd) return new Set()
    const min = Math.min(dragStart, dragEnd)
    const max = Math.max(dragStart, dragEnd)
    return new Set(tokens.filter(t => t.type === 'word' && t.index >= min && t.index <= max).map(t => t.index))
  }, [dragStart, dragEnd, tokens])

  // ===== 鼠标事件 =====
  const handleMouseDown = (wordIndex) => {
    mouseDownRef.current = true
    hasDraggedRef.current = false
    setDragStart(wordIndex)
    setDragEnd(wordIndex)
  }

  const handleMouseEnter = (wordIndex) => {
    if (mouseDownRef.current) {
      if (wordIndex !== stateRef.current.dragStart) {
        hasDraggedRef.current = true
      }
      setDragEnd(wordIndex)
    }
  }

  // 全局 mouseup 监听
  useEffect(() => {
    const handleMouseUp = () => {
      if (!mouseDownRef.current) return
      mouseDownRef.current = false

      const { dragStart: ds, dragEnd: de } = stateRef.current

      if (ds !== null && de !== null) {
        if (!hasDraggedRef.current) {
          handleSingleClick(ds)
        } else {
          createPhrase(ds, de)
        }
      }
      setDragStart(null)
      setDragEnd(null)
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  // ===== 单击逻辑 =====
  const handleSingleClick = (wordIndex) => {
    const { clickedWords: cw, phrases: ph, tokens: toks } = stateRef.current
    const token = toks.find(t => t.type === 'word' && t.index === wordIndex)
    if (!token) return

    // 如果在词组中 → 从词组移除该单词
    const phraseIdx = (() => {
      for (let i = 0; i < ph.length; i++) {
        if (ph[i].indices.includes(wordIndex)) return i
      }
      return -1
    })()

    if (phraseIdx >= 0) {
      removeWordFromPhrase(phraseIdx, wordIndex, ph, cw, toks)
      return
    }

    // 切换单个单词红色标记
    const newClicked = new Set(cw)
    if (newClicked.has(token.lower)) {
      newClicked.delete(token.lower)
      setClickedWords(newClicked)
      articlesAPI.unclickWord(id, token.lower).catch(console.error)
    } else {
      newClicked.add(token.lower)
      setClickedWords(newClicked)
      articlesAPI.clickWord(id, token.lower, wordIndex).catch(console.error)
    }
  }

  // ===== 拖动创建词组 =====
  const createPhrase = (startIdx, endIdx) => {
    const { clickedWords: cw, phrases: ph, tokens: toks } = stateRef.current
    const min = Math.min(startIdx, endIdx)
    const max = Math.max(startIdx, endIdx)
    const selectedTokens = toks.filter(t => t.type === 'word' && t.index >= min && t.index <= max)

    if (selectedTokens.length < 2) {
      if (selectedTokens.length === 1) handleSingleClick(selectedTokens[0].index)
      return
    }

    const indices = selectedTokens.map(t => t.index)
    const text = selectedTokens.map(t => t.lower).join(' ')

    // 移除范围内的单独单词标记
    const newClicked = new Set(cw)
    selectedTokens.forEach(t => {
      if (newClicked.has(t.lower)) {
        newClicked.delete(t.lower)
        articlesAPI.unclickWord(id, t.lower).catch(console.error)
      }
    })
    setClickedWords(newClicked)

    // 移除重叠的旧词组
    const overlapping = new Set()
    indices.forEach(i => {
      for (let pi = 0; pi < ph.length; pi++) {
        if (ph[pi].indices.includes(i)) overlapping.add(pi)
      }
    })
    overlapping.forEach(pi => {
      articlesAPI.unclickPhrase(id, ph[pi].text).catch(console.error)
    })

    const newPhrases = ph.filter((_, idx) => !overlapping.has(idx))
    newPhrases.push({ text, indices })
    setPhrases(newPhrases)

    // 保存到后端
    articlesAPI.clickPhrase(id, text, indices).catch(console.error)
  }

  // ===== 从词组中移除单词 =====
  const removeWordFromPhrase = (phraseIdx, wordIndex, currentPhrases, currentClicked, currentTokens) => {
    const phrase = currentPhrases[phraseIdx]
    const newIndices = phrase.indices.filter(i => i !== wordIndex)

    // 删除旧词组
    articlesAPI.unclickPhrase(id, phrase.text).catch(console.error)

    const newPhrases = [...currentPhrases]

    if (newIndices.length >= 2) {
      // 更新词组
      const newText = newIndices
        .map(i => currentTokens.find(t => t.type === 'word' && t.index === i)?.lower)
        .filter(Boolean).join(' ')
      newPhrases[phraseIdx] = { text: newText, indices: newIndices }
      setPhrases(newPhrases)
      articlesAPI.clickPhrase(id, newText, newIndices).catch(console.error)
    } else if (newIndices.length === 1) {
      // 剩1个词，转为单独生词（红色）
      newPhrases.splice(phraseIdx, 1)
      setPhrases(newPhrases)
      const token = currentTokens.find(t => t.type === 'word' && t.index === newIndices[0])
      if (token) {
        const newClicked = new Set(currentClicked)
        newClicked.add(token.lower)
        setClickedWords(newClicked)
        articlesAPI.clickWord(id, token.lower, newIndices[0]).catch(console.error)
      }
    } else {
      newPhrases.splice(phraseIdx, 1)
      setPhrases(newPhrases)
    }
  }

  // ===== 判断单词状态 =====
  const getWordClass = (tokenIndex, tokenLower) => {
    if (phraseIndexMap.has(tokenIndex)) return 'word-phrase'
    if (dragRange.has(tokenIndex)) return 'word-drag-preview'
    if (clickedWords.has(tokenLower)) return 'word-clicked'
    return ''
  }

  // ===== 完成阅读相关 =====
  const handleFinishReading = () => {
    const initialMeanings = {}
    clickedWords.forEach(word => {
      initialMeanings[word] = { meaning: '', context_sentence: '' }
    })
    phrases.forEach(p => {
      initialMeanings[p.text] = { meaning: '', context_sentence: '' }
    })
    setWordMeanings(initialMeanings)
    setShowFinishPanel(true)
  }

  const updateMeaning = (word, field, value) => {
    setWordMeanings(prev => ({ ...prev, [word]: { ...prev[word], [field]: value } }))
  }

  const submitFinish = async () => {
    setFinishing(true)
    try {
      const { data } = await articlesAPI.finish(id, wordMeanings)
      navigate(`/report/${data.report ? 'latest' : ''}`, {
        state: { report: data.report, articleTitle: article.title }
      })
    } catch (err) {
      alert('完成阅读失败: ' + (err.response?.data?.error || '未知错误'))
    } finally {
      setFinishing(false)
    }
  }

  const findContextSentence = (word) => {
    if (!article) return ''
    const sentences = article.content.split(/(?<=[.!?])\s+/)
    // 对词组进行整体匹配
    const searchWord = word.includes(' ') ? word.split(' ')[0] : word
    const found = sentences.find(s => new RegExp(`\\b${searchWord}\\b`, 'i').test(s))
    return found ? found.trim() : ''
  }

  if (loading) return <div className="loading">加载中...</div>
  if (!article) return <div className="loading">文章不存在</div>

  const diffNames = { A1: 'A1 入门', A2: 'A2 基础', B1: 'B1 中级', B2: 'B2 中高级', C1: 'C1 高级', C2: 'C2 精通' }

  // 合并所有标记项用于完成面板
  const allUnknowns = [
    ...Array.from(clickedWords).map(w => ({ type: 'word', text: w })),
    ...phrases.map(p => ({ type: 'phrase', text: p.text })),
  ].sort((a, b) => a.text.localeCompare(b.text))

  const totalMarked = clickedWords.size + phrases.length

  return (
    <div className="reading-page">
      <div className="reading-toolbar">
        <div className="toolbar-left">
          <button className="btn-back" onClick={() => navigate('/')}>&#8592; 返回</button>
          <h2 className="article-title-bar">{article.title}</h2>
          <span className={`diff-badge diff-${article.difficulty_level}`}>
            {diffNames[article.difficulty_level] || article.difficulty_level}
          </span>
        </div>
        <div className="toolbar-right">
          <span className="clicked-count">
            已标记 <strong className="count-red">{clickedWords.size}</strong> 个生词
            {phrases.length > 0 && <>, <strong className="count-green">{phrases.length}</strong> 个词组</>}
          </span>
          <button className="btn-finish" onClick={handleFinishReading} disabled={article.is_completed}>
            {article.is_completed ? '已完成' : '完成阅读'}
          </button>
        </div>
      </div>

      <div className="reading-hint">
        <span className="hint-item"><span className="red-demo">单击</span>标记不认识的生词（红色）</span>
        <span className="hint-sep">|</span>
        <span className="hint-item"><span className="green-demo">拖动</span>选择词组（绿色），点击绿色单词可从词组中移除</span>
      </div>

      <div className="article-content" onDragStart={e => e.preventDefault()}>
        {tokens.map((token, i) => {
          if (token.type === 'word') {
            const cls = getWordClass(token.index, token.lower)
            return (
              <span
                key={i}
                className={`readable-word ${cls}`}
                onMouseDown={(e) => { e.preventDefault(); handleMouseDown(token.index) }}
                onMouseEnter={() => handleMouseEnter(token.index)}
              >
                {token.text}
              </span>
            )
          } else {
            const parts = token.text.split('\n')
            return parts.map((part, j) => (
              <span key={`${i}-${j}`}>{j > 0 && <br />}{part}</span>
            ))
          }
        })}
      </div>

      {/* 完成阅读面板 */}
      {showFinishPanel && (
        <div className="finish-overlay">
          <div className="finish-panel">
            <div className="finish-header">
              <h2>完成阅读</h2>
              <button className="btn-close" onClick={() => setShowFinishPanel(false)}>&times;</button>
            </div>

            {totalMarked === 0 ? (
              <div className="finish-empty">
                <p>你没有标记任何生词或词组，看来这篇文章对你来说很简单！</p>
                <button className="btn-primary" onClick={submitFinish} disabled={finishing}>
                  {finishing ? '提交中...' : '确认完成'}
                </button>
              </div>
            ) : (
              <>
                <p className="finish-desc">
                  你标记了 {clickedWords.size} 个生词、{phrases.length} 个词组。可以填写释义（选填）：
                </p>
                <div className="meanings-scroll">
                  {allUnknowns.map(item => (
                    <div key={item.text} className="meaning-row">
                      <div className="meaning-word-header">
                        <span className={`meaning-word ${item.type === 'phrase' ? 'meaning-phrase' : ''}`}>
                          {item.text}
                        </span>
                        {item.type === 'phrase' && <span className="phrase-tag">词组</span>}
                        <span className="meaning-context">
                          {findContextSentence(item.text).substring(0, 80)}{findContextSentence(item.text).length > 80 ? '...' : ''}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="输入中文释义（选填）"
                        value={wordMeanings[item.text]?.meaning || ''}
                        onChange={(e) => updateMeaning(item.text, 'meaning', e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="finish-actions">
                  <button className="btn-primary" onClick={submitFinish} disabled={finishing}>
                    {finishing ? '正在生成报告...' : '确认完成并生成报告'}
                  </button>
                  <button className="btn-secondary" onClick={() => setShowFinishPanel(false)}>
                    继续阅读
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReadingView
