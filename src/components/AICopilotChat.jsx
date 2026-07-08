import { useMemo, useState } from 'react'
import { Bot, CheckCircle2, MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { findTransportPlace, routeCombos, transportPlaces } from '../data/transportData'
import { calculateRouteComboScore } from '../utils/scoring'

const samplePrompts = [
  'I need to reach Delhi by tomorrow morning under ₹1500',
  'From Hyderabad to Mumbai tonight, cheapest route',
  'Emergency flight to Bengaluru today under ₹6000'
]

function todayIso(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function normalize(text = '') {
  return text.toLowerCase().replace(/[^a-z0-9₹\s]/g, ' ')
}

function findCity(text, fallback) {
  const clean = normalize(text)
  const direct = findTransportPlace(clean) || transportPlaces.find((place) => clean.includes(place.city.toLowerCase()))
  return direct?.city || fallback
}

function findFromCity(text, fallback) {
  const clean = normalize(text)
  const afterFrom = clean.match(/from\s+([a-z\s]+?)(\s+to|\s+reach|\s+by|\s+under|$)/)
  if (afterFrom?.[1]) {
    const match = findTransportPlace(afterFrom[1]) || transportPlaces.find((place) => afterFrom[1].includes(place.city.toLowerCase()))
    if (match) return match.city
  }
  return fallback
}

function parseBudget(text, fallback) {
  const match = text.match(/(?:₹|rs\.?|inr|under|below)\s*(\d{3,6})/i) || text.match(/(\d{3,6})\s*(?:rs|rupees|₹|inr)/i)
  return match ? Number(match[1]) : fallback
}

function inferTransport(text, budget) {
  const clean = normalize(text)
  if (clean.includes('flight') || clean.includes('airport')) return 'Flight'
  if (clean.includes('bus')) return 'Bus'
  if (clean.includes('train') || clean.includes('tatkal')) return 'Train'
  if (budget && budget <= 1800) return 'Train'
  if (budget && budget >= 5000) return 'Flight'
  return 'Train'
}

function inferDate(text) {
  const clean = normalize(text)
  if (clean.includes('today') || clean.includes('tonight')) return todayIso(0)
  if (clean.includes('tomorrow')) return todayIso(1)
  return todayIso(0)
}

function inferMode(text) {
  const clean = normalize(text)
  if (clean.includes('emergency') || clean.includes('urgent') || clean.includes('tonight') || clean.includes('tomorrow morning')) return 'emergency'
  return 'normal'
}

function bestCombo(plan) {
  return routeCombos
    .map((combo) => ({ ...combo, score: calculateRouteComboScore(combo, plan) }))
    .sort((a, b) => b.score - a.score)[0]
}

export default function AICopilotChat({ plan, update, setManualMode, toast }) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('I need to reach Delhi by tomorrow morning under ₹1500')
  const [result, setResult] = useState(null)

  const helperText = useMemo(() => {
    if (!result) return 'Type a natural travel need. Copilot will fill the planner using local rules.'
    return `${result.to} · ${result.transportMode} · ${result.routeCombo} · ₹${result.budget}`
  }, [result])

  function analyze(text = prompt) {
    const budget = parseBudget(text, plan.budget)
    const mode = inferMode(text)
    const transportMode = inferTransport(text, budget)
    const to = findCity(text, plan.to)
    const from = findFromCity(text, plan.from)
    const draft = {
      ...plan,
      from,
      to,
      date: inferDate(text),
      budget,
      transportMode,
      urgency: mode === 'emergency' ? 'Emergency' : 'Normal',
      ticketType: mode === 'emergency' ? (transportMode === 'Train' ? 'Tatkal / Emergency' : 'Emergency / Urgent') : 'Normal',
      quota: mode === 'emergency' ? (transportMode === 'Train' ? 'Tatkal / Emergency' : 'Emergency / Urgent') : 'Normal',
      classType: transportMode === 'Flight' ? 'Economy' : transportMode === 'Bus' ? 'AC Bus' : 'Sleeper'
    }
    const selected = bestCombo(draft)
    const finalPlan = { ...draft, routeCombo: selected.label, aiNote: selected.note }
    update(finalPlan)
    setManualMode(mode)
    setResult({ ...finalPlan, score: selected.score })
    toast?.(`AI Copilot filled planner: ${selected.label} selected.`)
  }

  return (
    <>
      {!open && (
        <button
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400 px-5 py-4 font-black text-slate-950 shadow-glow hover:scale-[1.02]"
          onClick={() => setOpen(true)}
        >
          <Bot size={20} /> AI Copilot
        </button>
      )}

      {open && (
        <section className="fixed bottom-5 right-5 z-50 w-[min(92vw,420px)] rounded-3xl border border-cyan-400/30 bg-slate-950/95 p-4 shadow-glow backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="badge"><Sparkles size={14} /> AI Travel Copilot · local rules</p>
              <h3 className="mt-3 text-xl font-black text-white">Ask in plain English</h3>
              <p className="mt-1 text-sm text-slate-400">{helperText}</p>
            </div>
            <button className="btn-soft px-3" onClick={() => setOpen(false)} aria-label="Close AI Copilot"><X size={16} /></button>
          </div>

          <textarea
            className="input mt-4 min-h-[94px] resize-none"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: I need to reach Delhi by tomorrow morning under ₹1500"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {samplePrompts.map((item) => (
              <button key={item} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-cyan-400/40" onClick={() => setPrompt(item)}>
                {item}
              </button>
            ))}
          </div>

          <button className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2" onClick={() => analyze()}>
            <Send size={17} /> Fill planner + recommend route
          </button>

          {result && (
            <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <h4 className="flex items-center gap-2 font-black"><CheckCircle2 size={17} /> Applied AI plan</h4>
              <p className="mt-2">{result.from} → {result.to} on {result.date}</p>
              <p className="mt-1">Route: <b>{result.routeCombo}</b> · Score <b>{result.score}/100</b></p>
              <p className="mt-1 text-emerald-200/80">{result.aiNote}</p>
            </div>
          )}
        </section>
      )}
    </>
  )
}
