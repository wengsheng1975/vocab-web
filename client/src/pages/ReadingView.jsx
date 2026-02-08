import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { articlesAPI } from '../api'
import Button from '../components/ui/Button'
import { DiffBadge } from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal'

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
  const [clickedWords, setClickedWords] = useState(new Set())
  const [phrases, setPhrases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFinishPanel, setShowFinishPanel] = useState(false)
  const [wordMeanings, setWordMeanings] = useState({})
  const [finishing, setFinishing] = useState(false)

  // 拼写建议弹窗
  const [spellPopup, setSpellPopup] = useState(null) // { word, wordIndex, suggestions, x, y }

  const [dragStart, setDragStart] = useState(null)
  const [dragEnd, setDragEnd] = useState(null)
  const mouseDownRef = useRef(false)
  const hasDraggedRef = useRef(false)

  const stateRef = useRef({})
  stateRef.current = { dragStart, dragEnd, clickedWords, phrases, tokens }

  useEffect(() => { loadArticle() }, [id])

  const loadArticle = async () => {
    try {
      const { data } = await articlesAPI.get(id)
      setArticle(data.article)
      const toks = tokenize(data.article.content)
      setTokens(toks)
      const masteredWordSet = new Set(data.masteredWords || [])
      const masteredPhraseSet = new Set(data.masteredPhrases || [])
      const restoredWords = (data.clickedWords || []).filter(w => !masteredWordSet.has(w))
      setClickedWords(new Set(restoredWords))
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

  const phraseIndexMap = useMemo(() => {
    const map = new Map()
    phrases.forEach((p, pi) => { p.indices.forEach(wi => map.set(wi, pi)) })
    return map
  }, [phrases])

  const dragRange = useMemo(() => {
    if (dragStart === null || dragEnd === null || dragStart === dragEnd) return new Set()
    const min = Math.min(dragStart, dragEnd)
    const max = Math.max(dragStart, dragEnd)
    return new Set(tokens.filter(t => t.type === 'word' && t.index >= min && t.index <= max).map(t => t.index))
  }, [dragStart, dragEnd, tokens])

  const handleMouseDown = (wordIndex) => { mouseDownRef.current = true; hasDraggedRef.current = false; setDragStart(wordIndex); setDragEnd(wordIndex) }
  const handleMouseEnter = (wordIndex) => { if (mouseDownRef.current) { if (wordIndex !== stateRef.current.dragStart) hasDraggedRef.current = true; setDragEnd(wordIndex) } }

  useEffect(() => {
    const handleMouseUp = () => {
      if (!mouseDownRef.current) return
      mouseDownRef.current = false
      const { dragStart: ds, dragEnd: de } = stateRef.current
      if (ds !== null && de !== null) { if (!hasDraggedRef.current) handleSingleClick(ds); else createPhrase(ds, de) }
      setDragStart(null); setDragEnd(null)
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  const handleSingleClick = (wordIndex) => {
    const { clickedWords: cw, phrases: ph, tokens: toks } = stateRef.current
    const token = toks.find(t => t.type === 'word' && t.index === wordIndex)
    if (!token) return
    const phraseIdx = (() => { for (let i = 0; i < ph.length; i++) { if (ph[i].indices.includes(wordIndex)) return i } return -1 })()
    if (phraseIdx >= 0) { removeWordFromPhrase(phraseIdx, wordIndex, ph, cw, toks); return }
    const newClicked = new Set(cw)
    if (newClicked.has(token.lower)) {
      newClicked.delete(token.lower)
      setClickedWords(newClicked)
      setSpellPopup(null)
      articlesAPI.unclickWord(id, token.lower).catch(console.error)
    } else {
      newClicked.add(token.lower)
      setClickedWords(newClicked)
      articlesAPI.clickWord(id, token.lower, wordIndex).then(({ data }) => {
        if (data.spelling && data.spelling.suggestions.length > 0) {
          // 找到该单词在页面上的 DOM 位置
          const el = document.querySelector(`[data-word-index="${wordIndex}"]`)
          const rect = el ? el.getBoundingClientRect() : { left: 200, bottom: 200 }
          setSpellPopup({
            word: token.lower,
            wordIndex,
            suggestions: data.spelling.suggestions,
            x: rect.left,
            y: rect.bottom + window.scrollY + 4,
          })
        }
      }).catch(console.error)
    }
  }

  const createPhrase = (startIdx, endIdx) => {
    const { clickedWords: cw, phrases: ph, tokens: toks } = stateRef.current
    const min = Math.min(startIdx, endIdx); const max = Math.max(startIdx, endIdx)
    const selectedTokens = toks.filter(t => t.type === 'word' && t.index >= min && t.index <= max)
    if (selectedTokens.length < 2) { if (selectedTokens.length === 1) handleSingleClick(selectedTokens[0].index); return }
    const indices = selectedTokens.map(t => t.index); const text = selectedTokens.map(t => t.lower).join(' ')
    const newClicked = new Set(cw)
    selectedTokens.forEach(t => { if (newClicked.has(t.lower)) { newClicked.delete(t.lower); articlesAPI.unclickWord(id, t.lower).catch(console.error) } })
    setClickedWords(newClicked)
    const overlapping = new Set()
    indices.forEach(i => { for (let pi = 0; pi < ph.length; pi++) { if (ph[pi].indices.includes(i)) overlapping.add(pi) } })
    overlapping.forEach(pi => { articlesAPI.unclickPhrase(id, ph[pi].text).catch(console.error) })
    const newPhrases = ph.filter((_, idx) => !overlapping.has(idx)); newPhrases.push({ text, indices }); setPhrases(newPhrases)
    articlesAPI.clickPhrase(id, text, indices).catch(console.error)
  }

  const removeWordFromPhrase = (phraseIdx, wordIndex, currentPhrases, currentClicked, currentTokens) => {
    const phrase = currentPhrases[phraseIdx]; const newIndices = phrase.indices.filter(i => i !== wordIndex)
    articlesAPI.unclickPhrase(id, phrase.text).catch(console.error)
    const newPhrases = [...currentPhrases]
    if (newIndices.length >= 2) {
      const newText = newIndices.map(i => currentTokens.find(t => t.type === 'word' && t.index === i)?.lower).filter(Boolean).join(' ')
      newPhrases[phraseIdx] = { text: newText, indices: newIndices }; setPhrases(newPhrases)
      articlesAPI.clickPhrase(id, newText, newIndices).catch(console.error)
    } else if (newIndices.length === 1) {
      newPhrases.splice(phraseIdx, 1); setPhrases(newPhrases)
      const token = currentTokens.find(t => t.type === 'word' && t.index === newIndices[0])
      if (token) { const nc = new Set(currentClicked); nc.add(token.lower); setClickedWords(nc); articlesAPI.clickWord(id, token.lower, newIndices[0]).catch(console.error) }
    } else { newPhrases.splice(phraseIdx, 1); setPhrases(newPhrases) }
  }

  const getWordClass = (tokenIndex, tokenLower) => {
    if (phraseIndexMap.has(tokenIndex)) return 'word-phrase'
    if (dragRange.has(tokenIndex)) return 'word-drag-preview'
    if (clickedWords.has(tokenLower)) return 'word-clicked'
    return ''
  }

  const handleFinishReading = () => {
    const initialMeanings = {}
    clickedWords.forEach(word => { initialMeanings[word] = { meaning: '', context_sentence: '' } })
    phrases.forEach(p => { initialMeanings[p.text] = { meaning: '', context_sentence: '' } })
    setWordMeanings(initialMeanings); setShowFinishPanel(true)
  }

  const updateMeaning = (word, field, value) => { setWordMeanings(prev => ({ ...prev, [word]: { ...prev[word], [field]: value } })) }

  const submitFinish = async () => {
    setFinishing(true)
    try {
      const { data } = await articlesAPI.finish(id, wordMeanings)
      navigate(`/report/${data.report ? 'latest' : ''}`, { state: { report: data.report, articleTitle: article.title } })
    } catch (err) { alert('完成阅读失败: ' + (err.response?.data?.error || '未知错误')) }
    finally { setFinishing(false) }
  }

  const findContextSentence = (word) => {
    if (!article) return ''
    const sentences = article.content.split(/(?<=[.!?])\s+/)
    const searchWord = word.includes(' ') ? word.split(' ')[0] : word
    const escaped = searchWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const found = sentences.find(s => new RegExp(`\\b${escaped}\\b`, 'i').test(s))
    return found ? found.trim() : ''
  }

  if (loading) return <LoadingSpinner />
  if (!article) return <div className="flex items-center justify-center min-h-[300px] text-surface-400">文章不存在</div>

  const allUnknowns = [
    ...Array.from(clickedWords).map(w => ({ type: 'word', text: w })),
    ...phrases.map(p => ({ type: 'phrase', text: p.text })),
  ].sort((a, b) => a.text.localeCompare(b.text))
  const totalMarked = clickedWords.size + phrases.length

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="sticky top-14 z-40 bg-white/90 backdrop-blur-sm rounded-xl border border-surface-200/60 p-3 sm:p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/')} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-surface-50 text-surface-500 hover:bg-surface-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <h2 className="font-semibold text-surface-800 text-[15px] truncate">{article.title}</h2>
          <DiffBadge level={article.difficulty_level} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-surface-500">
            已标记 <span className="font-semibold text-red-500">{clickedWords.size}</span> 词
            {phrases.length > 0 && <>, <span className="font-semibold text-emerald-500">{phrases.length}</span> 词组</>}
          </span>
          <Button variant="success" size="sm" onClick={handleFinishReading}>
            {article.is_completed ? '再次完成' : '完成阅读'}
          </Button>
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-center gap-3 flex-wrap px-3.5 py-2.5 bg-sky-50/80 border border-sky-200/50 rounded-lg text-[12px] text-sky-700 mb-4">
        <span><span className="font-semibold text-red-500">单击</span> 标记生词（红色）</span>
        <span className="text-sky-300">|</span>
        <span><span className="font-semibold text-emerald-500">拖动</span> 选择词组（绿色），点击绿色词可移除</span>
      </div>

      {/* Article Content */}
      <div className="bg-white rounded-xl border border-surface-200/80 p-6 sm:p-8 text-lg leading-[2.2] text-surface-700 min-h-[300px] select-none" onDragStart={e => e.preventDefault()}>
        {tokens.map((token, i) => {
          if (token.type === 'word') {
            const cls = getWordClass(token.index, token.lower)
            return (
              <span key={i} className={`readable-word ${cls}`}
                data-word-index={token.index}
                onMouseDown={(e) => { e.preventDefault(); handleMouseDown(token.index) }}
                onMouseEnter={() => handleMouseEnter(token.index)}>
                {token.text}
              </span>
            )
          } else {
            const parts = token.text.split('\n')
            return parts.map((part, j) => <span key={`${i}-${j}`}>{j > 0 && <br />}{part}</span>)
          }
        })}
      </div>

      {/* 拼写建议弹窗 */}
      {spellPopup && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-surface-200 p-3 animate-scale-in"
          style={{ left: Math.min(spellPopup.x, window.innerWidth - 280), top: spellPopup.y, minWidth: 220, maxWidth: 320 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-amber-600 font-semibold flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              可能的拼写错误
            </span>
            <button onClick={() => setSpellPopup(null)} className="text-surface-400 hover:text-surface-600 text-sm leading-none">&times;</button>
          </div>
          <p className="text-[12px] text-surface-500 mb-2">
            "<span className="font-semibold text-red-500">{spellPopup.word}</span>" 不在词库中，你想说的是：
          </p>
          <div className="flex flex-wrap gap-1.5">
            {spellPopup.suggestions.map(s => (
              <button
                key={s}
                onClick={() => {
                  // 替换：取消旧词，标记正确词
                  const cw = new Set(clickedWords)
                  cw.delete(spellPopup.word)
                  cw.add(s)
                  setClickedWords(cw)
                  articlesAPI.unclickWord(id, spellPopup.word).catch(() => {})
                  articlesAPI.clickWord(id, s, spellPopup.wordIndex).catch(() => {})
                  setSpellPopup(null)
                }}
                className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-[13px] font-semibold hover:bg-primary-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSpellPopup(null)}
            className="mt-2 w-full text-center text-[11px] text-surface-400 hover:text-surface-600 transition-colors"
          >
            保留原样（不更正）
          </button>
        </div>
      )}

      {/* Finish Panel Modal */}
      <Modal open={showFinishPanel} onClose={() => setShowFinishPanel(false)} maxWidth="max-w-2xl">
        <ModalHeader onClose={() => setShowFinishPanel(false)}>完成阅读</ModalHeader>
        {totalMarked === 0 ? (
          <ModalBody className="text-center py-10">
            <p className="text-surface-500 text-[13px] mb-5">你没有标记任何生词或词组，看来这篇文章对你来说很简单！</p>
            <Button onClick={submitFinish} disabled={finishing}>{finishing ? '提交中...' : '确认完成'}</Button>
          </ModalBody>
        ) : (
          <>
            <div className="px-5 py-2.5 text-[13px] text-surface-500 border-b border-surface-100 bg-surface-50/50">
              你标记了 <span className="font-semibold text-red-500">{clickedWords.size}</span> 个生词、
              <span className="font-semibold text-emerald-500">{phrases.length}</span> 个词组。可以填写释义（选填）：
            </div>
            <ModalBody className="max-h-[50vh]">
              <div className="space-y-3.5">
                {allUnknowns.map(item => {
                  const ctx = findContextSentence(item.text)
                  return (
                    <div key={item.text} className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-[15px] ${item.type === 'phrase' ? 'text-emerald-600' : 'text-primary-600'}`}>{item.text}</span>
                        {item.type === 'phrase' && <span className="text-[10px] font-medium bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md">词组</span>}
                        <span className="text-[11px] text-surface-400 italic truncate max-w-xs">{ctx.substring(0, 80)}{ctx.length > 80 ? '...' : ''}</span>
                      </div>
                      <input type="text" placeholder="输入中文释义（选填）" value={wordMeanings[item.text]?.meaning || ''} onChange={(e) => updateMeaning(item.text, 'meaning', e.target.value)}
                        className="w-full px-3 py-2 bg-surface-50 border border-surface-200 rounded-lg text-[13px] text-surface-800 placeholder-surface-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all" />
                    </div>
                  )
                })}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button className="flex-1" onClick={submitFinish} disabled={finishing}>
                {finishing ? '正在生成报告...' : '确认完成并生成报告'}
              </Button>
              <Button variant="secondary" onClick={() => setShowFinishPanel(false)}>继续阅读</Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  )
}

export default ReadingView
