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
      className={`rounded-xl p-4 transition-shadow duration-300 hover:shadow-md ${
        highlight
          ? 'bg-red-600 text-white'
          : 'bg-white border border-surface-200/80'
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
