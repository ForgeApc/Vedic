import { useState, useRef, useEffect } from 'react'
import { Sparkles, ChevronDown, Loader2, Download } from 'lucide-react'
import { chartToPrompt } from '../lib/astrology'
import jsPDF from 'jspdf'

const TYPES = [
  { id: 'quick',  label: 'Quick Read',   desc: '~2 min · Sun, Moon & Ascendant overview' },
  { id: 'deep',   label: 'Deep Dive',    desc: '~8 min · Full chart + houses + yogas' },
  { id: 'timing', label: 'Timing & Dashas', desc: '~5 min · Current & upcoming life periods' },
]

function renderMarkdown(text) {
  // Very simple markdown renderer for ### headers, **bold**, paragraphs
  return text
    .replace(/### (.+)/g, '<h3 class="font-serif text-xl text-amber-300 mt-6 mb-2 font-semibold">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-amber-200 font-semibold">$1</strong>')
    .replace(/\n\n/g, '</p><p class="text-slate-300 leading-relaxed mb-3">')
    .replace(/^/, '<p class="text-slate-300 leading-relaxed mb-3">')
    .replace(/$/, '</p>')
}

export default function InterpretationPanel({ chart, name }) {
  const [type, setType] = useState('quick')
  const [customFocus, setCustomFocus] = useState('')
  const [text, setText] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [done, setDone] = useState(false)
  const [showFocus, setShowFocus] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    setText('')
    setDone(false)
  }, [chart, type])

  async function generate() {
    if (!chart) return
    setText('')
    setDone(false)
    setStreaming(true)

    const chartPrompt = chartToPrompt(chart, name)
    const res = await fetch('/api/interpretations/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chartPrompt, type, customFocus, name }),
    })

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done: readerDone, value } = await reader.read()
      if (readerDone) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') { setDone(true); setStreaming(false); break }
        try {
          const { text: chunk } = JSON.parse(payload)
          if (chunk) setText(prev => prev + chunk)
        } catch { /* ignore parse errors */ }
      }
    }
    setStreaming(false)
    setDone(true)
  }

  function exportPDF() {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(`Vedic Chart Reading — ${name}`, 14, 20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    const lines = doc.splitTextToSize(text.replace(/###/g, '\n\n').replace(/\*\*/g, ''), 180)
    doc.text(lines, 14, 35)
    doc.save(`${name.replace(/\s+/g, '_')}_vedic_chart.pdf`)
  }

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-2 flex-wrap">
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
              type === t.id
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{TYPES.find(t => t.id === type)?.desc}</p>

      {/* Custom focus toggle */}
      <button
        onClick={() => setShowFocus(s => !s)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition-colors"
      >
        <ChevronDown size={13} className={`transition-transform ${showFocus ? 'rotate-180' : ''}`} />
        Custom focus (optional)
      </button>
      {showFocus && (
        <textarea
          value={customFocus}
          onChange={e => setCustomFocus(e.target.value)}
          placeholder="e.g. Focus on career and finances, or relationship patterns, or spiritual path..."
          className="input-field h-20 text-sm resize-none"
        />
      )}

      {/* Generate button */}
      <button onClick={generate} disabled={streaming} className="btn-primary w-full flex items-center justify-center gap-2">
        {streaming ? (
          <><Loader2 size={16} className="animate-spin" /> Channeling the cosmos...</>
        ) : (
          <><Sparkles size={16} /> Generate {TYPES.find(t => t.id === type)?.label}</>
        )}
      </button>

      {/* Interpretation output */}
      {(text || streaming) && (
        <div className="mt-4">
          <div
            ref={contentRef}
            className="interpretation-content prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
          />
          {streaming && (
            <div className="flex items-center gap-2 text-amber-400/60 text-sm mt-2">
              <Loader2 size={13} className="animate-spin" />
              Receiving interpretation...
            </div>
          )}
          {done && (
            <button
              onClick={exportPDF}
              className="btn-secondary flex items-center gap-2 mt-6 text-sm"
            >
              <Download size={15} />
              Export as PDF
            </button>
          )}
        </div>
      )}
    </div>
  )
}
