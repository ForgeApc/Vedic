import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  const [noResults, setNoResults] = useState(false)
  const [dropdownPos, setDropdownPos] = useState(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const approximateTime = watch('approximateTime')

  useEffect(() => {
    if (locationQuery.length < 3) { setSuggestions([]); setNoResults(false); return }
    setNoResults(false)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)

      // Position dropdown based on input element
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect()
        setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width })
      }

      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=6&addressdetails=1`
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
        const data = await res.json()
        const mapped = data.map(r => ({
          display: r.display_name,
          short: [r.address?.city || r.address?.town || r.address?.village || r.address?.county, r.address?.state, r.address?.country].filter(Boolean).join(', '),
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        }))
        setSuggestions(mapped)
        setNoResults(mapped.length === 0)
      } catch {
        setSuggestions([])
        setNoResults(true)
      }
      setSearching(false)
    }, 400)
  }, [locationQuery])

  function selectLocation(s) {
    const label = s.short || s.display.split(',').slice(0, 3).join(', ')
    setValue('location', label)
    setValue('lat', s.lat)
    setValue('lng', s.lng)
    setLocationQuery(label)
    setSuggestions([])
    setNoResults(false)
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
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          <MapPin size={14} className="inline mr-1.5 text-amber-400" />
          Birth Location
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            value={locationQuery}
            onChange={e => { setLocationQuery(e.target.value); setValue('location', ''); setValue('lat', ''); setValue('lng', '') }}
            placeholder="Type a city name, e.g. Mumbai"
            className="input-field pr-8"
            autoComplete="off"
          />
          {searching && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 animate-spin" />
          )}
        </div>
        <input type="hidden" {...register('location', { required: true })} />
        <input type="hidden" {...register('lat', { required: true })} />
        <input type="hidden" {...register('lng', { required: true })} />
        {errors.location && <p className="text-red-400 text-xs mt-1">Please select a location from the dropdown</p>}
        {noResults && locationQuery.length >= 3 && !searching && (
          <p className="text-slate-500 text-xs mt-1">No locations found — try a different city name</p>
        )}

        {/* Portal dropdown so it's never clipped by overflow:hidden parents */}
        {suggestions.length > 0 && dropdownPos && createPortal(
          <ul
            style={{ position: 'absolute', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999, background: '#1e1b4b' }}
            className="rounded-xl border border-white/20 overflow-hidden shadow-2xl shadow-black/60"
          >
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); selectLocation(s) }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 transition-colors border-b border-white/10 last:border-0"
                >
                  <span className="font-medium">{s.short}</span>
                  <span className="block text-xs text-slate-500 truncate mt-0.5">{s.display}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body
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
