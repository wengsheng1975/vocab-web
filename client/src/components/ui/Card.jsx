export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'p-5',
  ...props
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-surface-200/80 ${padding} ${
        hover
          ? 'transition-shadow duration-300 hover:shadow-md'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
