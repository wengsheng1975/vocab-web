const variants = {
  primary:
    'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow active:bg-primary-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600 disabled:hover:shadow-sm disabled:active:scale-100',
  secondary:
    'bg-transparent text-surface-700 border border-surface-200 hover:bg-surface-50 hover:border-surface-300 active:bg-surface-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-surface-500 hover:text-surface-800 hover:bg-surface-50 active:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow active:bg-red-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  accent:
    'bg-accent-600 text-white shadow-sm hover:bg-accent-700 hover:shadow active:bg-accent-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  success:
    'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow active:bg-emerald-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  soft:
    'bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-[13px] rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-sm rounded-lg',
  full: 'px-4 py-2.5 text-sm rounded-lg w-full',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
