const variants = {
  primary:
    'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-sm hover:from-primary-700 hover:to-primary-600 hover:shadow active:from-primary-800 active:to-primary-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-primary-600 disabled:hover:to-primary-500 disabled:hover:shadow-sm disabled:active:scale-100',
  secondary:
    'bg-white/90 text-surface-700 border border-surface-200 hover:bg-surface-50 hover:border-surface-300 active:bg-surface-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-surface-500 hover:text-surface-800 hover:bg-surface-50 active:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-sm hover:from-red-700 hover:to-red-600 hover:shadow active:from-red-800 active:to-red-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  accent:
    'bg-gradient-to-r from-accent-500 to-accent-400 text-white shadow-sm hover:from-accent-600 hover:to-accent-500 hover:shadow active:from-accent-700 active:to-accent-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  success:
    'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm hover:from-emerald-700 hover:to-emerald-600 hover:shadow active:from-emerald-800 active:to-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  soft:
    'bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-[13px] rounded-xl',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-sm rounded-xl',
  full: 'px-4 py-2.5 text-sm rounded-xl w-full',
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
