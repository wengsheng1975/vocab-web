export default function Aurora({
  className = '',
  colorStops = ['#6366f1', '#06b6d4', '#8b5cf6', '#0ea5e9'],
  speed = 6,
  blur = 80,
  opacity = 0.4,
  size = 60,
}) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <style>{`
        @keyframes aurora-drift-1 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          25% { transform: translate(10%, -15%) scale(1.1); }
          50% { transform: translate(-5%, 10%) scale(0.95); }
          75% { transform: translate(15%, 5%) scale(1.05); }
        }
        @keyframes aurora-drift-2 {
          0%, 100% { transform: translate(0%, 0%) scale(1.05); }
          25% { transform: translate(-15%, 10%) scale(0.95); }
          50% { transform: translate(10%, -5%) scale(1.1); }
          75% { transform: translate(-10%, -10%) scale(1); }
        }
        @keyframes aurora-drift-3 {
          0%, 100% { transform: translate(0%, 0%) scale(0.95); }
          33% { transform: translate(20%, 15%) scale(1.1); }
          66% { transform: translate(-15%, -10%) scale(1); }
        }
        @keyframes aurora-drift-4 {
          0%, 100% { transform: translate(5%, -5%) scale(1); }
          50% { transform: translate(-20%, 15%) scale(1.15); }
        }
      `}</style>
      {colorStops.map((color, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: `${size + i * 10}%`,
            height: `${size + i * 10}%`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            opacity,
            filter: `blur(${blur}px)`,
            animation: `aurora-drift-${(i % 4) + 1} ${speed + i * 2}s ease-in-out infinite`,
            top: `${10 + i * 15}%`,
            left: `${-10 + i * 20}%`,
          }}
        />
      ))}
    </div>
  )
}
