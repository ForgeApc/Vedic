import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin, Clock, Calendar, User, Loader2 } from 'lucide-react'

export default function BirthForm({ onSubmit, isLoading }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      birthDate: '',
      birthTime: '',
      approximateTime: false,
      location: '',
      lat: '',
      lng: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  })

  const [locationQuery, setLocationQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)

  const approximateTime = watch('approximateTime')

  useEffect(() => {
    if (locationQuery.length < 3) { setSuggestions([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/charts/geocode?q=${encodeURIComponent(locationQuery)}`)
        const data = await res.json()
        setSuggestions(data.slice(0, 5))
      } catch { setSuggestions([]) }
      setSearching(false)
    }, 500)
  }, [locationQuery])

  function selectLocation(s) {
    setValue('location', s.display.split(',').slice(0, 3).join(', '))
    setValue('lat', s.lat)
    setValue('lng', s.lng)
    setLocationQuery(s.display.split(',').slice(0, 3).join(', '))
    setSuggestions([])
  }

  const timezones = Intl.supportedValuesOf?.('timeZone') || [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney',
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          <User size={14} className="inline mr-1.5 text-amber-400" />
          Full Name
        </label>
        <input
          {...register('name', { required: 'Name is required' })}
          placeholder="e.g. Arjuna Sharma"
          className="input-field"
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
      </div>

      {/* Date & Time row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            <Calendar size={14} className="inline mr-1.5 text-amber-400" />
            Date of Birth
          </label>
          <input
            type="date"
            {...register('birthDate', { required: 'Birth date is required' })}
            className="input-field"
          />
          {errors.birthDate && <p className="text-red-400 text-xs mt-1">{errors.birthDate.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            <Clock size={14} className="inline mr-1.5 text-amber-400" />
            Time of Birth
          </label>
          <input
            type="time"
            {...register('birthTime', { required: !approximateTime && 'Birth time is required' })}
            disabled={approximateTime}
            className="input-field disabled:opacity-40"
          />
          {errors.birthTime && <p className="text-red-400 text-xs mt-1">{errors.birthTime.message}</p>}
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('approximateTime')}
              className="w-3.5 h-3.5 accent-amber-400"
            />
            <span className="text-xs text-slate-400">Time unknown (use noon — less accurate)</span>
          </label>
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Timezone
        </label>
        <select {...register('timezone')} className="input-field">
          {timezones.map(tz => (
            <option key={tz} value={tz} className="bg-indigo-950">{tz}</option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="relative">
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          <MapPin size={14} className="inline mr-1.5 text-amber-400" />
          Birth Location
        </label>
        <div className="relative">
          <input
            value={locationQuery}
            onChange={e => setLocationQuery(e.target.value)}
            placeholder="City, Country (e.g. Mumbai, India)"
            className="input-field pr-8"
          />
          {searching && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 animate-spin" />
          )}
        </div>
        <input type="hidden" {...register('location', { required: 'Location is required' })} />
        <input type="hidden" {...register('lat', { required: true })} />
        <input type="hidden" {...register('lng', { required: true })} />
        {errors.location && <p className="text-red-400 text-xs mt-1">Please select a location from the list</p>}

        {suggestions.length > 0 && (
          <ul className="absolute z-30 w-full mt-1 glass-card border border-white/20 overflow-hidden">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => selectLocation(s)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-amber-300 transition-colors border-b border-white/5 last:border-0"
                >
                  {s.display.split(',').slice(0, 4).join(',')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {approximateTime && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-300">
          ⚠️ Without an accurate birth time, the Ascendant and house placements cannot be determined. Sun, Moon, and planetary sign placements will still be calculated.
        </div>
      )}

      <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Calculating Chart...
          </span>
        ) : (
          'Generate My Vedic Chart ✦'
        )}
      </button>
    </form>
  )
}
