export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'p-5',
  ...props
}) {
  return (
    <div
      className={`bg-white/92 rounded-2xl border border-surface-200/85 shadow-[0_8px_24px_rgba(23,34,32,0.05)] ${padding} ${
        hover
          ? 'transition-all duration-300 hover:shadow-[0_16px_34px_rgba(17,63,57,0.14)] hover:-translate-y-0.5'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
