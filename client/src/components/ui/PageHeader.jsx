export default function PageHeader({ title, children, className = '' }) {
  return (
    <div className={`mb-7 animate-fade-in ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[clamp(1.48rem,1.2rem+0.8vw,2rem)] font-bold text-surface-800 tracking-tight">{title}</h1>
          <div className="mt-1 h-[2px] w-[4.5rem] rounded-full bg-gradient-to-r from-primary-400 to-accent-400" />
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
