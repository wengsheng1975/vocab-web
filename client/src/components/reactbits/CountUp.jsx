import { useEffect, useRef, useState } from 'react'

export default function CountUp({
  to = 0,
  from = 0,
  duration = 1.5,
  separator = '',
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
  threshold = 0.2,
}) {
  const [value, setValue] = useState(from)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const start = performance.now()
          const dur = duration * 1000

          const tick = (now) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / dur, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = from + (to - from) * eased
            setValue(current)
            if (progress < 1) requestAnimationFrame(tick)
          }

          requestAnimationFrame(tick)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [to, from, duration])

  const formatted = (() => {
    const num = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString()
    if (!separator) return num
    const [int, dec] = num.split('.')
    const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    return dec ? `${withSep}.${dec}` : withSep
  })()

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
