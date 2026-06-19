import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, Trash2, ExternalLink, Star, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function DashboardPage({ user }) {
  const [charts, setCharts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    fetchCharts()
  }, [user])

  async function fetchCharts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('charts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error) setCharts(data || [])
    setLoading(false)
  }

  async function deleteChart(id) {
    if (!confirm('Delete this chart?')) return
    await supabase.from('charts').delete().eq('id', id)
    setCharts(prev => prev.filter(c => c.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-amber-400" />
      </div>
    )
  }

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-100">My Charts</h1>
          <p className="text-slate-400 text-sm mt-1">{user.email}</p>
        </div>
        <Link to="/" className="btn-primary text-sm">
          + New Chart
        </Link>
      </div>

      {charts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Star size={40} className="text-amber-400/30 mx-auto mb-4" />
          <h2 className="font-serif text-xl text-slate-300 mb-2">No charts saved yet</h2>
          <p className="text-slate-500 text-sm mb-6">Generate your first Vedic birth chart to get started.</p>
          <Link to="/" className="btn-primary inline-block">Create Your Chart</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {charts.map(chart => (
            <div key={chart.id} className="glass-card p-5 hover:border-amber-500/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-100 text-lg">{chart.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <Calendar size={11} />
                    {chart.birth_date}
                    {chart.birth_time && ` at ${chart.birth_time}`}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{chart.birth_location}</p>
                </div>
                <button
                  onClick={() => deleteChart(chart.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {chart.ascendant && (
                <div className="flex gap-3 text-xs">
                  <span className="bg-amber-500/10 text-amber-300 px-2 py-1 rounded-lg">
                    {chart.ascendant.sign} Asc
                  </span>
                  {chart.planets?.Moon && (
                    <span className="bg-slate-500/10 text-slate-300 px-2 py-1 rounded-lg">
                      ☽ {chart.planets.Moon.sign}
                    </span>
                  )}
                  {chart.planets?.Sun && (
                    <span className="bg-amber-600/10 text-amber-400 px-2 py-1 rounded-lg">
                      ☉ {chart.planets.Sun.sign}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 text-xs text-slate-600">
                Saved {new Date(chart.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
