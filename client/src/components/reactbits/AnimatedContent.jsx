import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function AnimatedContent({
  children,
  className = '',
  distance = 30,
  direction = 'vertical',
  duration = 0.7,
  delay = 0,
  ease = 'power3.out',
  threshold = 0.15,
  reverse = false,
  stagger = 0,
  scale = 1,
  blur = 0,
}) {
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || hasAnimated.current) return

    const fromProps = {
      opacity: 0,
      ...(direction === 'vertical' ? { y: reverse ? -distance : distance } : { x: reverse ? -distance : distance }),
      ...(scale !== 1 ? { scale } : {}),
      ...(blur > 0 ? { filter: `blur(${blur}px)` } : {}),
    }

    const toProps = {
      opacity: 1,
      ...(direction === 'vertical' ? { y: 0 } : { x: 0 }),
      ...(scale !== 1 ? { scale: 1 } : {}),
      ...(blur > 0 ? { filter: 'blur(0px)' } : {}),
      duration,
      delay,
      ease,
      ...(stagger > 0 ? { stagger } : {}),
    }

    const targets = stagger > 0 ? el.children : el
    gsap.set(targets, fromProps)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          gsap.to(targets, toProps)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
