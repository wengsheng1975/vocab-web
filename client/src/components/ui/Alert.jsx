const styles = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-700',
    icon: (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    icon: (
      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: (
      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  info: {
    container: 'bg-sky-50 border-sky-200 text-sky-700',
    icon: (
      <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  },
}

export default function Alert({ type = 'error', children, onClose, className = '' }) {
  const style = styles[type] || styles.info

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm animate-slide-down ${style.container} ${className}`}>
      <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
      <div className="flex-1 font-medium">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-current/50 hover:text-current/80 transition-colors text-lg leading-none"
        >
          &times;
        </button>
      )}
    </div>
  )
}
