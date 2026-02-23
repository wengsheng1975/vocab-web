import { useEffect, useRef } from 'react'

export default function BlurText({
  text = '',
  className = '',
  animateBy = 'words',
  direction = 'top',
  delay = 100,
  stepDuration = 0.4,
  threshold = 0.1,
  onAnimationComplete,
}) {
  const containerRef = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el || hasAnimated.current) return

    const items = el.querySelectorAll('.blur-item')
    items.forEach(item => {
      item.style.opacity = '0'
      item.style.filter = 'blur(8px)'
      item.style.transform = direction === 'top' ? 'translateY(-10px)' : 'translateY(10px)'
    })

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          items.forEach((item, i) => {
            item.style.transition = `opacity ${stepDuration}s ease, filter ${stepDuration}s ease, transform ${stepDuration}s ease`
            item.style.transitionDelay = `${i * delay}ms`
            requestAnimationFrame(() => {
              item.style.opacity = '1'
              item.style.filter = 'blur(0px)'
              item.style.transform = 'translateY(0)'
            })
          })
          if (onAnimationComplete) {
            setTimeout(onAnimationComplete, items.length * delay + stepDuration * 1000)
          }
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [text])

  const parts = animateBy === 'letters'
    ? text.split('').map((ch, i) => (
        <span key={i} className="blur-item inline-block" style={{ whiteSpace: ch === ' ' ? 'pre' : undefined }}>
          {ch}
        </span>
      ))
    : text.split(' ').map((word, i) => (
        <span key={i} className="blur-item inline-block mr-[0.3em]">
          {word}
        </span>
      ))

  return (
    <p ref={containerRef} className={className}>
      {parts}
    </p>
  )
}
