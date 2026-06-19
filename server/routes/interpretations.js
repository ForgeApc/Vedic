import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an expert Vedic astrologer with 25 years of experience in classical Jyotish.
You interpret birth charts using:
- Planetary dignity (exaltation, debilitation, own sign, moolatrikona)
- Bhava analysis (house meanings and planetary placements)
- Graha drishti (planetary aspects) and yogas (conjunctions and special combinations)
- Nakshatra qualities and their lords
- Vimshottari Dasha timing
- Rashi characteristics

Guidelines:
1. Be specific and data-driven — cite actual placements (e.g. "Moon in Rohini nakshatra in 4th house suggests...")
2. Be balanced — acknowledge both strengths and challenges
3. Be empowering — offer practical insights for growth and self-understanding
4. Use Sanskrit terms where appropriate but always explain them in accessible English
5. Organize your response with clear section headers
6. Be humble about astrology's role — it offers guidance, not destiny
7. Aim for depth over breadth

Format your response using markdown with ### headers for sections.`

function buildPrompt(chartPrompt, type, customFocus) {
  const focusLine = customFocus ? `\nSpecific focus requested: ${customFocus}` : ''

  if (type === 'quick') {
    return `${chartPrompt}${focusLine}

Please provide a Quick Read covering:
### Sun Sign Analysis
(Core identity, ego, life purpose — 2-3 paragraphs)

### Moon Sign & Nakshatra
(Emotional nature, inner self, mind — 2-3 paragraphs)

### Ascendant (Lagna)
(Physical appearance, personality projection, life approach — 2-3 paragraphs)

### Key Strengths & Challenges
(Top 3 planetary strengths and challenges with brief explanation)`
  }

  if (type === 'deep') {
    return `${chartPrompt}${focusLine}

Please provide a comprehensive Deep Dive interpretation covering:
### Lagna & Overall Chart Signature
### First House — Self & Personality
### Second House — Wealth, Family & Speech
### Fourth House — Home, Mother & Emotional Security
### Fifth House — Intelligence, Children & Past Life Merits
### Seventh House — Relationships & Partnership
### Ninth House — Dharma, Fortune & Spirituality
### Tenth House — Career, Status & Public Life
### Notable Yogas
(Identify any Raj Yogas, Dhana Yogas, or other important planetary combinations)
### Mahadasha Analysis
(Interpret the current dasha period and what it means for the native)
### Practical Guidance
(3-5 specific, actionable insights for this person)`
  }

  if (type === 'timing') {
    return `${chartPrompt}${focusLine}

Please provide a Life Timing & Phases interpretation covering:
### Current Mahadasha Period
(Deep interpretation of the current dasha lord's themes, what to expect)
### Upcoming Planetary Periods
(Next 2-3 dashas and what they will activate in the chart)
### Key Life Themes by Period
(Map major life events/themes to dasha periods already passed if inferrable)
### Auspicious Areas to Focus On Now
### Challenges to Navigate
### Practical Timing Advice`
  }

  return `${chartPrompt}${focusLine}\n\nPlease provide a balanced chart interpretation with key insights.`
}

router.post('/generate', async (req, res) => {
  const { chartPrompt, type = 'quick', customFocus, name } = req.body

  if (!chartPrompt) {
    return res.status(400).json({ error: 'chartPrompt is required' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const userPrompt = buildPrompt(chartPrompt, type, customFocus)

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error('Claude API error:', err)
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

export default router
