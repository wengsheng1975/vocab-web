import { useEffect, useState } from 'react'
import { statsAPI } from '../api'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const EVALUATION_ROW_COLORS = Object.freeze({
  unknown: 'bg-surface-100/85 text-surface-600',
  A1: 'bg-primary-50/85 text-primary-700',
  A2: 'bg-teal-50/85 text-teal-700',
  B1: 'bg-amber-50/85 text-amber-700',
  B2: 'bg-orange-50/85 text-orange-700',
  C1: 'bg-red-50/85 text-red-700',
  C2: 'bg-rose-50/85 text-rose-700',
})

const TARGET_COLORS = Object.freeze({
  strong: 'bg-amber-100/85 text-amber-800',
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

  const columns = tableData?.columns || []
  const rows = tableData?.rows || []
  const currentEstimatedLevel = tableData?.currentEstimatedLevel || 'unknown'
  const targetMeta = tableData?.targetMeta || {}
  const cefrHeaderVisible = columns.length >= 1
  const rightHeaderSpan = Math.max(1, columns.length - 1)
  const examHeaderSpan = Math.max(1, columns.length - 2)
  const abilityHeaderVisible = columns.length >= 2
  const abilityColumn = abilityHeaderVisible ? columns[columns.length - 1] : null
  const headColumns = abilityHeaderVisible
    ? columns.slice(1, -1)
    : columns.slice(1)
  const leftColumnCount = abilityHeaderVisible ? Math.max(1, columns.length - 1) : Math.max(1, columns.length)
  const abilityColumnWidth = abilityHeaderVisible ? 34 : 0
  const leftColumnWidth = abilityHeaderVisible
    ? `${(100 - abilityColumnWidth) / leftColumnCount}%`
    : `${100 / leftColumnCount}%`
  const abilityWidthStyle = abilityHeaderVisible ? `${abilityColumnWidth}%` : null

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="核心水平对比总表" />

      <Card padding="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-[13px] border-collapse table-fixed">
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
                    className="px-4 py-3 text-center align-middle font-semibold border-b border-r border-surface-200"
                  >
                    评估水平（CEFR）
                  </th>
                )}
                {abilityHeaderVisible ? (
                  <>
                    <th
                      colSpan={examHeaderSpan}
                      className="px-4 py-3 text-center font-semibold border-b border-r border-surface-200"
                    >
                      期望等级
                    </th>
                    <th
                      rowSpan={2}
                      className="px-4 py-3 text-center align-middle font-semibold border-b border-surface-200 whitespace-normal"
                    >
                      {abilityColumn?.label || '能力定位'}
                    </th>
                  </>
                ) : (
                  <th
                    colSpan={rightHeaderSpan}
                    className="px-4 py-3 text-center font-semibold border-b border-surface-200"
                  >
                    期望等级
                  </th>
                )}
              </tr>
              <tr className="bg-surface-50 text-surface-600">
                {headColumns.map((col) => {
                  return (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-center font-semibold border-b border-r border-surface-200"
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
                const isTargetRow = !!targetMeta?.referenceCefr && row.cefr === targetMeta.referenceCefr

                return (
                  <tr key={row.cefr} className="bg-white border-b border-surface-100">
                    {columns.map((col, colIndex) => {
                      const isTargetColumn = targetMeta?.columnKey === col.key && col.key !== 'cefr'
                      const isEvaluationCell = isCurrentRow && col.key === 'cefr'
                      const isTargetCell = isTargetRow && isTargetColumn
                      const isBoth = isEvaluationCell && isTargetCell
                      const isCefrCell = col.key === 'cefr'
                      const isAbilityCell = abilityHeaderVisible && colIndex === columns.length - 1
                      const needVerticalDivider = colIndex < columns.length - 1
                      const evaluationColor = EVALUATION_ROW_COLORS[currentEstimatedLevel] || EVALUATION_ROW_COLORS.unknown
                      const cellHighlightClass = isBoth
                        ? `${evaluationColor} ring-2 ring-amber-300 font-semibold`
                        : isEvaluationCell
                          ? `${evaluationColor} font-semibold`
                          : isTargetCell
                            ? `${TARGET_COLORS.strong} font-semibold`
                            : ''
                      return (
                        <td
                          key={`${row.cefr}-${col.key}`}
                          className={`px-4 py-3 text-center align-middle text-surface-700 ${isCefrCell ? 'font-semibold' : ''} ${isAbilityCell ? 'whitespace-normal break-words leading-relaxed' : ''} ${needVerticalDivider ? 'border-r border-surface-200' : ''} ${cellHighlightClass}`}
                        >
                          {row[col.key]}
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
