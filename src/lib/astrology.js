// Vedic Astrology Calculation Engine
// Based on Jean Meeus "Astronomical Algorithms" with Lahiri ayanamsa

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

export const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']

export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

export const PLANET_SYMBOLS = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
}

export const PLANET_COLORS = {
  Sun: '#f59e0b', Moon: '#e2e8f0', Mars: '#ef4444', Mercury: '#22c55e',
  Jupiter: '#f97316', Venus: '#ec4899', Saturn: '#94a3b8', Rahu: '#8b5cf6', Ketu: '#6b7280',
}

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
]

const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
]

const DASHA_YEARS = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
}

const DASHA_ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']

function toRad(d) { return d * DEG_TO_RAD }
function toDeg(r) { return r * RAD_TO_DEG }
function norm360(d) { return ((d % 360) + 360) % 360 }

// Julian Day Number from calendar date
export function julianDay(year, month, day, hour = 12) {
  if (month <= 2) { year -= 1; month += 12 }
  const A = Math.floor(year / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5 + hour / 24
}

// Lahiri ayanamsa (degrees to subtract from tropical to get sidereal)
function lahiriAyanamsa(JD) {
  const T = (JD - 2451545.0) / 36525.0
  return 23.85 + 0.0137 * T  // simplified linear approximation
}

// Sun's ecliptic longitude (tropical)
function sunLongitude(JD) {
  const T = (JD - 2451545.0) / 36525.0
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T)
  const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T)
  const Mr = toRad(M)
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
          + 0.000289 * Math.sin(3 * Mr)
  return norm360(L0 + C)
}

// Moon's ecliptic longitude (tropical) — simplified
function moonLongitude(JD) {
  const T = (JD - 2451545.0) / 36525.0
  const Lp = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T)
  const M  = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T)
  const Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T)
  const D  = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T)
  const F  = norm360(93.2720950  + 483202.0175233 * T - 0.0036539 * T * T)
  const Mr = toRad(M); const Mpr = toRad(Mp); const Dr = toRad(D); const Fr = toRad(F)
  const lng = Lp
    + 6.288774 * Math.sin(Mpr)
    + 1.274027 * Math.sin(2*Dr - Mpr)
    + 0.658314 * Math.sin(2*Dr)
    + 0.213618 * Math.sin(2*Mpr)
    - 0.185116 * Math.sin(Mr)
    - 0.114332 * Math.sin(2*Fr)
    + 0.058793 * Math.sin(2*Dr - 2*Mpr)
    + 0.057066 * Math.sin(2*Dr - Mr - Mpr)
    + 0.053322 * Math.sin(2*Dr + Mpr)
    + 0.045758 * Math.sin(2*Dr - Mr)
    + 0.041773 * Math.sin(Mp - Mr)
    + 0.034720 * Math.sin(Dr)
    + 0.030403 * Math.sin(Mp + Mr)
    - 0.028647 * Math.sin(2*(Dr - Mpr))
    + 0.028252 * Math.sin(2*Dr - Mr + Mpr)   // correction sign
    - 0.024649 * Math.sin(2*Fr - 2*Dr)
  return norm360(lng)
}

// Simplified outer planet longitudes
function marsLongitude(JD) {
  const T = (JD - 2451545.0) / 36525.0
  const L = norm360(355.433275 + 19140.2993313 * T + 0.000284 * T * T)
  const M = toRad(norm360(19.3730 + 19140.30268 * T))
  return norm360(L + 10.691 * Math.sin(M) + 0.623 * Math.sin(2*M))
}

function mercuryLongitude(JD) {
  const T = (JD - 2451545.0) / 36525.0
  const L = norm360(252.250906 + 149472.6746358 * T)
  const M = toRad(norm360(174.7948 + 149472.515 * T))
  return norm360(L + 23.440 * Math.sin(M) + 2.9 * Math.sin(2*M))
}

function jupiterLongitude(JD) {
  const T = (JD - 2451545.0) / 36525.0
  const L = norm360(34.351519 + 3034.9056606 * T)
  const M = toRad(norm360(20.9 + 3034.906 * T))
  return norm360(L + 5.55 * Math.sin(M) + 0.168 * Math.sin(2*M))
}

function venusLongitude(JD) {
  const T = (JD - 2451545.0) / 36525.0
  const L = norm360(181.979801 + 58517.8156760 * T)
  const M = toRad(norm360(212.2 + 58517.80 * T))
  return norm360(L + 0.7758 * Math.sin(M) + 0.0033 * Math.sin(2*M))
}

function saturnLongitude(JD) {
  const T = (JD - 2451545.0) / 36525.0
  const L = norm360(50.077444 + 1222.1138488 * T)
  const M = toRad(norm360(317.0 + 1222.114 * T))
  return norm360(L + 6.3585 * Math.sin(M) + 0.2204 * Math.sin(2*M))
}

// Rahu (mean north node) - retrograde
function rahuLongitude(JD) {
  const T = (JD - 2451545.0) / 36525.0
  return norm360(125.0445479 - 1934.1362608 * T + 0.0020754 * T * T)
}

function ascendantDegree(JD, lat, lng) {
  // RAMC (Right Ascension of Midheaven in degrees)
  const T = (JD - 2451545.0) / 36525.0
  const theta0 = 280.46061837 + 360.98564736629 * (JD - 2451545) + 0.000387933 * T * T
  const RAMC = norm360(theta0 + lng)
  const eps = toRad(23.4392911 - 0.013004167 * T) // obliquity
  const RAMCr = toRad(RAMC)
  const latr = toRad(lat)
  const asc = toDeg(Math.atan2(
    Math.cos(RAMCr),
    -(Math.sin(RAMCr) * Math.cos(eps) + Math.tan(latr) * Math.sin(eps))
  ))
  return norm360(asc)
}

function toSidereal(tropicalDeg, JD) {
  return norm360(tropicalDeg - lahiriAyanamsa(JD))
}

function signAndDegree(siderealLong) {
  const signIndex = Math.floor(siderealLong / 30)
  const degree = siderealLong - signIndex * 30
  return { signIndex, sign: SIGNS[signIndex], degree }
}

function getNakshatra(siderealLong) {
  const index = Math.floor(siderealLong / (360 / 27))
  const pada = Math.floor((siderealLong % (360 / 27)) / (360 / 108)) + 1
  return { name: NAKSHATRAS[index], index, pada, lord: NAKSHATRA_LORDS[index] }
}

// Vimshottari Dasha calculation
function vimshottariDasha(moonLong, birthJD) {
  const nakIndex = Math.floor(moonLong / (360 / 27))
  const lord = NAKSHATRA_LORDS[nakIndex]
  const posInNak = moonLong % (360 / 27)
  const nakSize = 360 / 27
  const fractionElapsed = posInNak / nakSize
  const lordOrderIndex = DASHA_ORDER.indexOf(lord)
  const remainingYears = DASHA_YEARS[lord] * (1 - fractionElapsed)

  const dashas = []
  let currentJD = birthJD
  // Add remaining part of birth nakshatra dasha
  dashas.push({
    lord,
    years: remainingYears,
    startJD: currentJD,
    endJD: currentJD + remainingYears * 365.25,
    isCurrent: true,
    isPartial: true,
  })
  currentJD += remainingYears * 365.25

  // Add subsequent dashas (120 year cycle)
  for (let i = 1; i < 9; i++) {
    const nextLord = DASHA_ORDER[(lordOrderIndex + i) % 9]
    const years = DASHA_YEARS[nextLord]
    dashas.push({
      lord: nextLord,
      years,
      startJD: currentJD,
      endJD: currentJD + years * 365.25,
      isCurrent: false,
      isPartial: false,
    })
    currentJD += years * 365.25
  }

  return dashas
}

function jdToDate(JD) {
  const Z = Math.floor(JD + 0.5)
  const F = JD + 0.5 - Z
  let A = Z
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25)
    A = Z + 1 + alpha - Math.floor(alpha / 4)
  }
  const B = A + 1524
  const C = Math.floor((B - 122.1) / 365.25)
  const D = Math.floor(365.25 * C)
  const E = Math.floor((B - D) / 30.6001)
  const day = B - D - Math.floor(30.6001 * E)
  const month = E < 14 ? E - 1 : E - 13
  const year = month > 2 ? C - 4716 : C - 4715
  return new Date(year, month - 1, day)
}

// Main chart calculation function
export function calculateChart(birthDate, birthTimeStr, lat, lng) {
  // Parse date and time
  const [year, month, day] = birthDate.split('-').map(Number)
  const [hours, minutes] = birthTimeStr.split(':').map(Number)
  const utHour = hours + minutes / 60  // Assumes UTC; in production, convert from local tz

  const JD = julianDay(year, month, day, utHour)
  const ayanamsa = lahiriAyanamsa(JD)

  // Calculate tropical longitudes
  const tropSun = sunLongitude(JD)
  const tropMoon = moonLongitude(JD)
  const tropMars = marsLongitude(JD)
  const tropMerc = mercuryLongitude(JD)
  const tropJup = jupiterLongitude(JD)
  const tropVen = venusLongitude(JD)
  const tropSat = saturnLongitude(JD)
  const tropRahu = rahuLongitude(JD)
  const tropAsc = ascendantDegree(JD, lat, lng)

  // Convert to sidereal
  const positions = {
    Sun:     toSidereal(tropSun, JD),
    Moon:    toSidereal(tropMoon, JD),
    Mars:    toSidereal(tropMars, JD),
    Mercury: toSidereal(tropMerc, JD),
    Jupiter: toSidereal(tropJup, JD),
    Venus:   toSidereal(tropVen, JD),
    Saturn:  toSidereal(tropSat, JD),
    Rahu:    toSidereal(tropRahu, JD),
    Ketu:    norm360(toSidereal(tropRahu, JD) + 180),
  }

  const ascSidereal = toSidereal(tropAsc, JD)

  // Build planet objects
  const planets = {}
  for (const [planet, long] of Object.entries(positions)) {
    const { signIndex, sign, degree } = signAndDegree(long)
    const nakshatra = planet === 'Moon' ? getNakshatra(long) : null
    // Whole sign house: ascendant sign = house 1
    const ascSignIndex = Math.floor(ascSidereal / 30)
    const house = ((signIndex - ascSignIndex + 12) % 12) + 1

    planets[planet] = { longitude: long, signIndex, sign, degree, house, nakshatra }
  }

  // Ascendant info
  const ascSign = signAndDegree(ascSidereal)
  const ascNakshatra = getNakshatra(ascSidereal)

  // Dasha calculation
  const moonLong = positions.Moon
  const dashas = vimshottariDasha(moonLong, JD)

  // Find current dasha
  const today = new Date()
  const todayJD = julianDay(today.getFullYear(), today.getMonth() + 1, today.getDate())
  let currentDasha = dashas[0]
  for (const d of dashas) {
    if (todayJD >= d.startJD && todayJD < d.endJD) {
      currentDasha = { ...d, isCurrent: true }
    }
  }

  // Map dashas to readable dates
  const dashasFormatted = dashas.map(d => ({
    lord: d.lord,
    years: parseFloat(d.years.toFixed(1)),
    startDate: jdToDate(d.startJD).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    endDate: jdToDate(d.endJD).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    isCurrent: todayJD >= d.startJD && todayJD < d.endJD,
  }))

  return {
    planets,
    ascendant: {
      longitude: ascSidereal,
      signIndex: ascSign.signIndex,
      sign: ascSign.sign,
      degree: ascSign.degree,
      nakshatra: ascNakshatra,
    },
    dashas: dashasFormatted,
    currentDasha: currentDasha ? { lord: currentDasha.lord, startDate: jdToDate(currentDasha.startJD), endDate: jdToDate(currentDasha.endJD) } : null,
    ayanamsa: parseFloat(ayanamsa.toFixed(4)),
    JD,
  }
}

// Format a chart for Claude prompt
export function chartToPrompt(chart, name) {
  const lines = [`Birth Chart for: ${name}`, `Ayanamsa (Lahiri): ${chart.ayanamsa}°`, '']
  lines.push('PLANETARY POSITIONS (Sidereal / Vedic):')
  for (const planet of PLANETS) {
    const p = chart.planets[planet]
    if (!p) continue
    const deg = p.degree.toFixed(2)
    const nak = p.nakshatra ? ` | Nakshatra: ${p.nakshatra.name} Pada ${p.nakshatra.pada} (Lord: ${p.nakshatra.lord})` : ''
    lines.push(`  ${planet}: ${p.sign} ${deg}° | House ${p.house}${nak}`)
  }
  lines.push('')
  lines.push(`ASCENDANT (Lagna): ${chart.ascendant.sign} ${chart.ascendant.degree.toFixed(2)}° | Nakshatra: ${chart.ascendant.nakshatra.name}`)
  lines.push('')
  lines.push('VIMSHOTTARI DASHA PERIODS:')
  for (const d of chart.dashas) {
    const marker = d.isCurrent ? ' ← CURRENT' : ''
    lines.push(`  ${d.lord} Dasha (${d.years} yrs): ${d.startDate} – ${d.endDate}${marker}`)
  }
  return lines.join('\n')
}
