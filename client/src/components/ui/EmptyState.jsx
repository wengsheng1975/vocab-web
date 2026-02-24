export default function EmptyState({ icon, title, description, children, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 bg-white/92 rounded-3xl border border-dashed border-surface-300 animate-fade-in shadow-[0_10px_26px_rgba(23,34,32,0.05)] ${className}`}>
      {icon && <div className="text-4xl mb-4 opacity-60">{icon}</div>}
      {title && <h3 className="text-lg font-semibold text-surface-700 mb-1">{title}</h3>}
      {description && <p className="text-sm text-surface-500 max-w-sm">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
