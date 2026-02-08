export default function EmptyState({ icon, title, description, children, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 bg-white rounded-2xl border-2 border-dashed border-surface-200 animate-fade-in ${className}`}>
      {icon && <div className="text-4xl mb-4 opacity-60">{icon}</div>}
      {title && <h3 className="text-lg font-semibold text-surface-600 mb-1">{title}</h3>}
      {description && <p className="text-sm text-surface-400 max-w-sm">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
