export default function PageHeader({ title, children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-6 flex-wrap gap-3 animate-fade-in ${className}`}>
      <h1 className="text-2xl font-bold text-surface-800 tracking-tight">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
