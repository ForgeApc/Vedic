import { SIGNS, SIGN_SYMBOLS, PLANET_SYMBOLS, PLANET_COLORS, PLANETS } from '../lib/astrology'

// South Indian style chart (4x4 grid, signs fixed, top-left = Pisces)
// Layout:  Pis Ari Tau Gem
//          Aqu         Can
//          Cap         Leo
//          Sag Sco Lib Vir

const SOUTH_INDIAN_LAYOUT = [
  // [row, col, signIndex]
  [0, 0, 11], [0, 1, 0], [0, 2, 1],  [0, 3, 2],
  [1, 0, 10],                          [1, 3, 3],
  [2, 0, 9],                           [2, 3, 4],
  [3, 0, 8],  [3, 1, 7], [3, 2, 6],  [3, 3, 5],
]

function getCellPlanets(signIndex, planets, ascendant) {
  const items = []
  for (const planet of PLANETS) {
    const p = planets[planet]
    if (p && p.signIndex === signIndex) {
      items.push({ label: PLANET_SYMBOLS[planet], color: PLANET_COLORS[planet], name: planet })
    }
  }
  if (ascendant && ascendant.signIndex === signIndex) {
    items.push({ label: 'Asc', color: '#fcd34d', name: 'Ascendant' })
  }
  return items
}

export default function RasiChart({ chart, size = 400 }) {
  if (!chart) return null

  const { planets, ascendant } = chart
  const cellSize = size / 4
  const innerPad = 6
  const fontSize = Math.max(10, cellSize / 6)
  const signFontSize = Math.max(8, cellSize / 8)

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="w-full h-auto max-w-md mx-auto"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Background */}
      <rect width={size} height={size} fill="rgba(15,10,46,0.6)" rx="12" />

      {SOUTH_INDIAN_LAYOUT.map(([row, col, signIndex]) => {
        const x = col * cellSize
        const y = row * cellSize
        const planetsInCell = getCellPlanets(signIndex, planets, ascendant)
        const isAscSign = ascendant?.signIndex === signIndex

        return (
          <g key={signIndex}>
            {/* Cell border */}
            <rect
              x={x + 1}
              y={y + 1}
              width={cellSize - 2}
              height={cellSize - 2}
              fill={isAscSign ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)'}
              stroke={isAscSign ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.12)'}
              strokeWidth="1"
            />

            {/* Sign name */}
            <text
              x={x + innerPad}
              y={y + innerPad + signFontSize}
              fontSize={signFontSize}
              fill="rgba(148,163,184,0.7)"
              fontWeight="400"
            >
              {SIGN_SYMBOLS[signIndex]}
            </text>
            <text
              x={x + innerPad}
              y={y + innerPad + signFontSize * 2.1}
              fontSize={signFontSize * 0.85}
              fill="rgba(148,163,184,0.5)"
            >
              {SIGNS[signIndex].slice(0, 3)}
            </text>

            {/* Planet symbols */}
            {planetsInCell.map((item, idx) => {
              const col2 = idx % 2
              const row2 = Math.floor(idx / 2)
              const px = x + cellSize * 0.25 + col2 * cellSize * 0.45
              const py = y + cellSize * 0.45 + row2 * (fontSize + 4)
              return (
                <text
                  key={item.name}
                  x={px}
                  y={py}
                  fontSize={fontSize}
                  fill={item.color}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {item.label}
                </text>
              )
            })}
          </g>
        )
      })}

      {/* Center box (empty in south Indian chart) */}
      <rect
        x={cellSize + 1}
        y={cellSize + 1}
        width={cellSize * 2 - 2}
        height={cellSize * 2 - 2}
        fill="rgba(30,27,75,0.8)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
      {/* Center label */}
      <text
        x={size / 2}
        y={size / 2 - 8}
        textAnchor="middle"
        fontSize={13}
        fill="rgba(251,191,36,0.6)"
        fontFamily="Playfair Display, serif"
        fontWeight="600"
      >
        Rasi
      </text>
      <text
        x={size / 2}
        y={size / 2 + 10}
        textAnchor="middle"
        fontSize={11}
        fill="rgba(148,163,184,0.4)"
      >
        D1 Chart
      </text>
    </svg>
  )
}
