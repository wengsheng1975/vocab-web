export default function ShinyText({
  text,
  children,
  className = '',
  speed = 3,
  disabled = false,
}) {
  const content = text || children

  if (disabled) {
    return <span className={className}>{content}</span>
  }

  return (
    <span
      className={`inline-block bg-clip-text ${className}`}
      style={{
        backgroundImage: 'linear-gradient(120deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animation: `shiny-slide ${speed}s ease-in-out infinite`,
      }}
    >
      <style>{`
        @keyframes shiny-slide {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {content}
    </span>
  )
}
