import CountUp from '../reactbits/CountUp'

export default function StatCard({
  icon,
  value,
  label,
  sub,
  highlight = false,
  className = '',
}) {
  const numericValue = typeof value === 'number' ? value : parseInt(value, 10)
  const isNumeric = !isNaN(numericValue)

  return (
    <div
      className={`rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 ${
        highlight
          ? 'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-[0_14px_24px_rgba(185,28,28,0.25)]'
          : 'bg-white/92 border border-surface-200/85 shadow-[0_8px_24px_rgba(23,34,32,0.05)] hover:shadow-[0_14px_28px_rgba(17,63,57,0.12)]'
      } ${className}`}
    >
      {icon && <div className="text-xl mb-1.5">{icon}</div>}
      <div className={`text-2xl font-bold tracking-tight leading-none ${highlight ? '' : 'text-surface-800'}`}>
        {isNumeric ? <CountUp to={numericValue} duration={1.2} /> : value}
      </div>
      <div className={`text-[13px] mt-1 font-medium ${highlight ? 'text-white/75' : 'text-surface-500'}`}>
        {label}
      </div>
      {sub && (
        <div className={`text-[11px] mt-0.5 ${highlight ? 'text-white/55' : 'text-surface-400'}`}>
          {sub}
        </div>
      )}
    </div>
  )
}
