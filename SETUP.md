# Jyotish AI — Setup Guide

## 1. Environment Variables

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=      # from Supabase project Settings → API
VITE_SUPABASE_ANON_KEY= # from Supabase project Settings → API
ANTHROPIC_API_KEY=      # from console.anthropic.com
PORT=3001
```

## 2. Supabase Setup

1. Create a free project at supabase.com
2. Go to SQL Editor and paste + run `supabase_schema.sql`
3. Enable Email auth under Authentication → Providers

## 3. Running Locally

Open two terminals:

```bash
# Terminal 1 — API server (Claude + geocoding)
npm run server

# Terminal 2 — Vite frontend
npm run dev
```

App available at http://localhost:5173

## 4. Project Structure

```
src/
  lib/
    astrology.js      # Vedic ephemeris engine (Lahiri ayanamsa, planets, dashas)
    supabase.js       # Supabase client
  components/
    BirthForm.jsx     # Birth details form with live geocoding
    RasiChart.jsx     # South Indian SVG chart
    PlanetTable.jsx   # Planetary positions table
    DashaTimeline.jsx # Vimshottari dasha list
    InterpretationPanel.jsx  # Streaming Claude AI reading
    Navigation.jsx    # Top nav with auth
    Starfield.jsx     # Animated starfield background
  pages/
    Home.jsx          # Main chart generator page
    AuthPage.jsx      # Sign in / sign up
    DashboardPage.jsx # Saved charts list
server/
  index.js            # Express API server
  routes/
    interpretations.js # Streaming Claude API route
    charts.js         # Geocoding proxy route
supabase_schema.sql   # Database schema + RLS policies
```

## 5. Key Features

- **Accurate calculations**: Sun, Moon, all 7 classical planets + Rahu/Ketu using Jean Meeus algorithms
- **Lahiri ayanamsa**: Proper sidereal conversion from tropical positions
- **Whole sign houses**: Traditional Vedic house system
- **27 Nakshatras**: Moon nakshatra with pada and lord
- **Vimshottari Dasha**: Full 120-year timeline with current period highlighted
- **South Indian SVG chart**: Crisp, responsive, gold-highlighted ascendant
- **Streaming AI readings**: Three depths (Quick / Deep Dive / Timing) via Claude
- **PDF export**: Jspdf-powered single-click export
- **Supabase auth + storage**: Save unlimited charts per account
- **Live geocoding**: Nominatim (OpenStreetMap) — no API key needed

## 6. Phase 2 Ideas

- D9 (Navamsha) chart tab
- Compatibility / synastry reports
- Antardasha (sub-period) breakdown
- Transit overlay on natal chart
- Muhurta (auspicious timing) suggestions
