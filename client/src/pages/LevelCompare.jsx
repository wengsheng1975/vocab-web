import { useEffect, useState } from 'react'
import { statsAPI } from '../api'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const EVALUATION_ROW_COLORS = Object.freeze({
  unknown: 'bg-blue-100/85 text-blue-900',
  A1: 'bg-blue-100/85 text-blue-900',
  A2: 'bg-blue-100/85 text-blue-900',
  B1: 'bg-blue-100/85 text-blue-900',
  B2: 'bg-blue-100/85 text-blue-900',
  C1: 'bg-blue-100/85 text-blue-900',
  C2: 'bg-blue-100/85 text-blue-900',
})

const TARGET_COLORS = Object.freeze({
  strong: 'bg-red-100/85 text-red-800',
})

const GAOKAO_COLUMN = Object.freeze({ key: 'gaokao', label: '高考英语全国卷' })
const GAOKAO_SCORE_BY_CEFR = Object.freeze({
  C2: '—',
  C1: '140+',
  B2: '120-139',
  B1: '90-119',
  A2: '60-89',
  A1: '<60',
})

function LevelCompare() {
  const [loading, setLoading] = useState(true)
  const [tableData, setTableData] = useState(null)

  useEffect(() => {
    statsAPI.levelCompareTable()
      .then((res) => setTableData(res.data))
      .catch((err) => console.error('加载水平对比总表失败:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const rawColumns = tableData?.columns || []
  const hasGaokaoColumn = rawColumns.some((col) => col?.key === 'gaokao')
  const columns = hasGaokaoColumn
    ? rawColumns
    : [
        ...(rawColumns.slice(0, 1) || []),
        GAOKAO_COLUMN,
        ...(rawColumns.slice(1) || []),
      ]
  const rawRows = tableData?.rows || []
  const rows = rawRows.map((row) => ({
    ...row,
    gaokao: row?.gaokao || GAOKAO_SCORE_BY_CEFR[row?.cefr] || '—',
  }))
  const currentEstimatedLevel = tableData?.currentEstimatedLevel || 'unknown'
  const targetLevel = String(tableData?.targetLevel || '')
  const targetMeta = tableData?.targetMeta || {}
  const normalizedTargetMeta = targetLevel.startsWith('gaokao_national')
    ? { ...targetMeta, columnKey: 'gaokao' }
    : targetMeta
  const cefrHeaderVisible = columns.length >= 1
  const rightHeaderSpan = Math.max(1, columns.length - 1)
  const examHeaderSpan = Math.max(1, columns.length - 2)
  const abilityHeaderVisible = columns.length >= 2
  const abilityColumn = abilityHeaderVisible ? columns[columns.length - 1] : null
  const headColumns = abilityHeaderVisible
    ? columns.slice(1, -1)
    : columns.slice(1)
  const leftColumnCount = abilityHeaderVisible ? Math.max(1, columns.length - 1) : Math.max(1, columns.length)
  const abilityColumnWidth = abilityHeaderVisible ? 26 : 0
  const leftColumnWidth = abilityHeaderVisible
    ? `${(100 - abilityColumnWidth) / leftColumnCount}%`
    : `${100 / leftColumnCount}%`
  const abilityWidthStyle = abilityHeaderVisible ? `${abilityColumnWidth}%` : null

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="核心水平对比总表" />

      <Card padding="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-0 text-[12px] border-collapse table-fixed">
            <colgroup>
              {columns.map((col, idx) => (
                <col
                  key={`col-${col.key}`}
                  style={{ width: abilityHeaderVisible && idx === columns.length - 1 ? abilityWidthStyle : leftColumnWidth }}
                />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-white text-surface-700">
                {cefrHeaderVisible && (
                  <th
                    rowSpan={2}
                    className="px-2.5 py-2 text-center align-middle font-semibold border-b border-r border-surface-200 whitespace-normal break-words"
                  >
                    评估水平（CEFR）
                  </th>
                )}
                {abilityHeaderVisible ? (
                  <>
                    <th
                      colSpan={examHeaderSpan}
                      className="px-2.5 py-2 text-center font-semibold border-b border-r border-surface-200 whitespace-normal break-words"
                    >
                      期望等级/参加考试
                    </th>
                    <th
                      rowSpan={2}
                      className="px-2.5 py-2 text-center align-middle font-semibold border-b border-surface-200 whitespace-normal break-words"
                    >
                      {abilityColumn?.label || '能力定位'}
                    </th>
                  </>
                ) : (
                  <th
                    colSpan={rightHeaderSpan}
                    className="px-2.5 py-2 text-center font-semibold border-b border-surface-200 whitespace-normal break-words"
                  >
                    期望等级/参加考试
                  </th>
                )}
              </tr>
              <tr className="bg-surface-50 text-surface-600">
                {headColumns.map((col) => {
                  return (
                    <th
                      key={col.key}
                      className="px-2.5 py-2 text-center font-semibold border-b border-r border-surface-200 whitespace-normal break-words"
                    >
                      {col.label}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isCurrentRow = row.cefr === currentEstimatedLevel
                const isTargetRow = !!normalizedTargetMeta?.referenceCefr && row.cefr === normalizedTargetMeta.referenceCefr

                return (
                  <tr key={row.cefr} className="bg-white border-b border-surface-100">
                    {columns.map((col, colIndex) => {
                      const isTargetColumn = normalizedTargetMeta?.columnKey === col.key && col.key !== 'cefr'
                      const isEvaluationCell = isCurrentRow && col.key === 'cefr'
                      const isTargetCell = isTargetRow && isTargetColumn
                      const isBoth = isEvaluationCell && isTargetCell
                      const isCefrCell = col.key === 'cefr'
                      const isAbilityCell = abilityHeaderVisible && colIndex === columns.length - 1
                      const needVerticalDivider = colIndex < columns.length - 1
                      const evaluationColor = EVALUATION_ROW_COLORS[currentEstimatedLevel] || EVALUATION_ROW_COLORS.unknown
                      const cellHighlightClass = isBoth
                        ? `${evaluationColor} ring-2 ring-red-300 font-semibold`
                        : isEvaluationCell
                          ? `${evaluationColor} font-semibold`
                          : isTargetCell
                            ? `${TARGET_COLORS.strong} font-semibold`
                            : ''
                      const cellValue = typeof row[col.key] === 'string' ? row[col.key].trim() : row[col.key]
                      return (
                        <td
                          key={`${row.cefr}-${col.key}`}
                          className={`px-2.5 py-2 text-center align-middle text-surface-700 whitespace-normal break-words ${isCefrCell ? 'font-semibold' : ''} ${isAbilityCell ? 'leading-relaxed' : ''} ${needVerticalDivider ? 'border-r border-surface-200' : ''} ${cellHighlightClass}`}
                        >
                          {cellValue}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default LevelCompare
