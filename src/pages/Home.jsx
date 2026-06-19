import { useState } from 'react'
import { Star } from 'lucide-react'
import BirthForm from '../components/BirthForm'
import RasiChart from '../components/RasiChart'
import PlanetTable from '../components/PlanetTable'
import DashaTimeline from '../components/DashaTimeline'
import InterpretationPanel from '../components/InterpretationPanel'
import { calculateChart } from '../lib/astrology'
import { supabase } from '../lib/supabase'

function timezoneOffsetHours(tz) {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
  const tzMs = new Date(now.toLocaleString('en-US', { timeZone: tz })).getTime()
  return (tzMs - utcMs) / 3600000
}

export default function Home({ user }) {
  const [chart, setChart] = useState(null)
  const [formData, setFormData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('chart')

  async function handleSubmit(data) {
    setIsLoading(true)
    setError('')
    try {
      // Convert local time to UTC using timezone offset
      const offsetHours = timezoneOffsetHours(data.timezone)
      const [h, m] = (data.approximateTime ? '12:00' : data.birthTime).split(':').map(Number)
      const utcHour = h + m / 60 - offsetHours
      const utcTimeStr = `${Math.floor(((utcHour % 24) + 24) % 24).toString().padStart(2, '0')}:${Math.round(((utcHour % 1 + 1) % 1) * 60).toString().padStart(2, '0')}`

      const result = calculateChart(
        data.birthDate,
        utcTimeStr,
        parseFloat(data.lat),
        parseFloat(data.lng)
      )
      setChart(result)
      setFormData(data)

      // Save to Supabase if logged in
      if (user) {
        const { error: dbErr } = await supabase.from('charts').insert({
          user_id: user.id,
          name: data.name,
          birth_date: data.birthDate,
          birth_time: data.birthTime,
          birth_location: data.location,
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng),
          timezone: data.timezone,
          planets: result.planets,
          ascendant: result.ascendant,
          dashas: result.dashas,
          ayanamsa: result.ayanamsa,
        })
        if (dbErr) console.warn('Could not save chart:', dbErr.message)
      }
    } catch (err) {
      setError('Chart calculation failed. Please check birth details and try again.')
      console.error(err)
    }
    setIsLoading(false)
  }

  const tabs = [
    { id: 'chart',    label: 'Rasi Chart' },
    { id: 'planets',  label: 'Planets' },
    { id: 'dashas',   label: 'Dashas' },
    { id: 'reading',  label: '✦ AI Reading' },
  ]

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
      {/* Hero */}
      {!chart && (
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-4 py-1.5 rounded-full mb-6">
            <Star size={13} className="fill-amber-400" />
            Classical Jyotish · Lahiri Ayanamsa · Vimshottari Dasha
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-100 mb-4 leading-tight">
            Your Vedic Astrology
            <span className="block gold-gradient">Birth Chart & Reading</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Enter your birth details for a personalized Jyotish chart with AI-powered planetary interpretations.
          </p>
        </div>
      )}

      <div className={`grid gap-8 ${chart ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1 max-w-xl mx-auto'}`}>
        {/* Form */}
        <div className={chart ? 'lg:col-span-2' : ''}>
          <div className="glass-card p-6">
            <h2 className="font-serif text-xl font-semibold text-amber-300 mb-5">Birth Details</h2>
            <BirthForm onSubmit={handleSubmit} isLoading={isLoading} />
            {error && <p className="text-red-400 text-sm mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          </div>

          {!user && chart && (
            <div className="mt-4 glass-card p-4 text-center">
              <p className="text-slate-400 text-sm">
                <a href="/auth" className="text-amber-400 hover:underline font-medium">Sign in</a> to save this chart to your profile
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {chart && (
          <div className="lg:col-span-3 space-y-4">
            {/* Chart title */}
            <div className="glass-card px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-semibold text-slate-100">{formData?.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formData?.birthDate} · {formData?.birthTime || 'Noon'} · {formData?.location}
                </p>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  {chart.ascendant.sign} Ascendant · {chart.planets.Moon?.sign} Moon · {chart.planets.Sun?.sign} Sun
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Ayanamsa: {chart.ayanamsa}°</p>
                <p>Whole Sign Houses</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 glass-card p-1">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === t.id
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="glass-card p-6">
              {activeTab === 'chart' && (
                <div>
                  <h3 className="section-header">Rasi Chart (D1)</h3>
                  <RasiChart chart={chart} size={380} />
                  <p className="text-xs text-slate-500 text-center mt-3">South Indian style · Signs fixed · Ascendant highlighted in gold</p>
                </div>
              )}
              {activeTab === 'planets' && (
                <div>
                  <h3 className="section-header">Planetary Positions</h3>
                  <PlanetTable chart={chart} />
                </div>
              )}
              {activeTab === 'dashas' && (
                <div>
                  <h3 className="section-header">Vimshottari Dasha Timeline</h3>
                  <DashaTimeline dashas={chart.dashas} />
                </div>
              )}
              {activeTab === 'reading' && (
                <div>
                  <h3 className="section-header">AI Interpretation</h3>
                  <InterpretationPanel chart={chart} name={formData?.name} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
