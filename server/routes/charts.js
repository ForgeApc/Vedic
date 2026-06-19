import { Router } from 'express'

const router = Router()

// Geocoding endpoint - uses a free geocoding API
router.get('/geocode', async (req, res) => {
  const { q } = req.query
  if (!q) return res.status(400).json({ error: 'Query required' })

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'VedicAstroApp/1.0' },
    })
    const data = await response.json()
    const results = data.map(r => ({
      display: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }))
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: 'Geocoding failed' })
  }
})

export default router
