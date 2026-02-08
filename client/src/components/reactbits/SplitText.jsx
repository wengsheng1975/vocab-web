import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function SplitText({
  text = '',
  tag: Tag = 'p',
  className = '',
  delay = 50,
  duration = 0.8,
  ease = 'power3.out',
  splitType = 'words',
  from = { opacity: 0, y: 30 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  textAlign = 'left',
  onAnimationComplete,
}) {
  const containerRef = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el || hasAnimated.current) return

    const items = el.querySelectorAll('.split-item')
    gsap.set(items, from)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          gsap.to(items, {
            ...to,
            duration,
            ease,
            stagger: delay / 1000,
            onComplete: onAnimationComplete,
          })
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [text])

  const parts = splitType === 'chars'
    ? text.split('').map((ch, i) => (
        <span key={i} className="split-item inline-block" style={{ whiteSpace: ch === ' ' ? 'pre' : undefined }}>
          {ch}
        </span>
      ))
    : text.split(' ').map((word, i) => (
        <span key={i} className="split-item inline-block mr-[0.3em]">
          {word}
        </span>
      ))

  return (
    <Tag ref={containerRef} className={className} style={{ textAlign }}>
      {parts}
    </Tag>
  )
}
