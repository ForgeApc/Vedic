import { useMemo } from 'react'

export default function Starfield() {
  const stars = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => ({
      id: i,
      top: `${(i * 37 + 13) % 100}%`,
      left: `${(i * 53 + 7) % 100}%`,
      size: (i % 3) + 1,
      duration: `${2 + (i % 4)}s`,
      delay: `${(i % 30) * 0.1}s`,
    }))
  }, [])

  return (
    <div className="stars" aria-hidden="true">
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            '--duration': s.duration,
            animationDelay: s.delay,
            opacity: 0.3 + (s.id % 5) * 0.1,
          }}
        />
      ))}
    </div>
  )
}
