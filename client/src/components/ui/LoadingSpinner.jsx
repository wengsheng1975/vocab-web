export default function LoadingSpinner({ text = '加载中...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[300px] gap-4 animate-fade-in ${className}`}>
      <div className="relative w-11 h-11">
        <div className="absolute inset-0 rounded-full border-2 border-surface-200/90" />
        <div className="absolute inset-0 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full bg-primary-50/60" />
      </div>
      <span className="text-sm text-surface-500 font-medium">{text}</span>
    </div>
  )
}

export function SkeletonLine({ className = '' }) {
  return (
    <div className={`h-4 bg-surface-100 rounded-lg animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-surface-100 via-surface-50 to-surface-100 ${className}`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white/92 rounded-2xl border border-surface-200/85 p-5 space-y-3 shadow-[0_8px_24px_rgba(23,34,32,0.05)]">
      <SkeletonLine className="w-3/4 h-5" />
      <SkeletonLine className="w-1/2" />
      <SkeletonLine className="w-full" />
    </div>
  )
}
