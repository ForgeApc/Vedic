import { PLANETS, PLANET_SYMBOLS, PLANET_COLORS, SIGNS } from '../lib/astrology'

export default function PlanetTable({ chart }) {
  if (!chart) return null
  const { planets, ascendant } = chart

  const rows = [
    { name: 'Ascendant', symbol: 'Asc', color: '#fcd34d', data: ascendant },
    ...PLANETS.map(p => ({ name: p, symbol: PLANET_SYMBOLS[p], color: PLANET_COLORS[p], data: planets[p] })),
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-white/10">
            <th className="text-left pb-2 pr-4">Planet</th>
            <th className="text-left pb-2 pr-4">Sign</th>
            <th className="text-left pb-2 pr-4">Degree</th>
            <th className="text-left pb-2 pr-4">House</th>
            <th className="text-left pb-2">Nakshatra</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ name, symbol, color, data }) => {
            if (!data) return null
            return (
              <tr key={name} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="py-2 pr-4">
                  <span className="flex items-center gap-2">
                    <span style={{ color }} className="text-base">{symbol}</span>
                    <span className="text-slate-200 font-medium">{name}</span>
                  </span>
                </td>
                <td className="py-2 pr-4 text-slate-300">{data.sign}</td>
                <td className="py-2 pr-4 text-slate-400">{data.degree?.toFixed(2)}°</td>
                <td className="py-2 pr-4">
                  {name !== 'Ascendant' && (
                    <span className="text-amber-400 font-semibold">{data.house}</span>
                  )}
                </td>
                <td className="py-2 text-slate-400 text-xs">
                  {data.nakshatra ? `${data.nakshatra.name} (Pada ${data.nakshatra.pada})` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
