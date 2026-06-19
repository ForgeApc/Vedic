import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import interpretationsRouter from './routes/interpretations.js'
import chartsRouter from './routes/charts.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use(express.json())

app.use('/api/interpretations', interpretationsRouter)
app.use('/api/charts', chartsRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))
