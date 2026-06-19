import { PLANET_COLORS } from '../lib/astrology'

export default function DashaTimeline({ dashas }) {
  if (!dashas?.length) return null

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 mb-3">Vimshottari Mahadasha — 120 year planetary cycle</p>
      {dashas.map((d, i) => (
        <div
          key={i}
          className={`flex items-center justify-between rounded-lg px-4 py-2.5 transition-all ${
            d.isCurrent
              ? 'bg-amber-500/15 border border-amber-500/40'
              : 'bg-white/3 border border-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: PLANET_COLORS[d.lord] || '#94a3b8' }}
            />
            <div>
              <span className={`font-semibold ${d.isCurrent ? 'text-amber-300' : 'text-slate-200'}`}>
                {d.lord}
              </span>
              {d.isCurrent && (
                <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-medium">
                  CURRENT
                </span>
              )}
              <p className="text-xs text-slate-500">{d.years} years</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>{d.startDate}</p>
            <p className="text-slate-600">↓</p>
            <p>{d.endDate}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
