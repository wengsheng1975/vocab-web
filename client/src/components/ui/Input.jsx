export default function Input({
  label,
  required,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-surface-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-surface-800 placeholder-surface-400 transition-all duration-200 outline-none ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
        }`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function Textarea({
  label,
  required,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-surface-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-surface-800 placeholder-surface-400 transition-all duration-200 outline-none resize-y ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
        }`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function Select({
  label,
  children,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-surface-700">{label}</label>
      )}
      <select
        className="px-3.5 py-2.5 bg-white border border-surface-200 rounded-xl text-surface-800 transition-all duration-200 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
