import { useMemo, useState } from 'react'
import { BrainCircuit, PlayCircle, Save, ShieldCheck, Ticket } from 'lucide-react'
import BookingModal from '../components/BookingModal'
import TripComparison from '../components/TripComparison'
import { calculatePlanQualityScore, calculateTravelScore, scoreBreakdown } from '../utils/scoring'
import { savePlan } from '../utils/storage'
import { transportPlaces } from '../data/transportData'

const stationOptions = transportPlaces.map((item) => item.city)

function runScores(plan) {
  const travel = calculateTravelScore(plan)
  const quality = calculatePlanQualityScore(plan)
  const breakdown = scoreBreakdown(plan)
  const readiness = Number(plan.readinessScore || 0)
  const bookingChance = quality >= 82 ? 'Strong chance after live provider verification' : quality >= 68 ? 'Medium chance · keep backup ready' : 'Low chance · improve route/budget/date first'
  return { travel, quality, readiness, bookingChance, breakdown }
}

export default function AnalyzeJourney({ toast }) {
  const [plan, setPlan] = useState({ from: 'Hyderabad', to: 'Delhi', date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), quota: 'Normal', ticketType: 'Normal', classType: 'Sleeper', passengers: 1, budget: 1500, readinessScore: 0, mode: 'normal', transportMode: 'Train', routeCombo: 'Train only' })
  const [bookingOpen, setBookingOpen] = useState(false)
  const [scores, setScores] = useState(null)
  const previewPlan = useMemo(() => ({ ...plan, travelScore: scores?.travel || 0 }), [plan, scores])

  function update(fields) {
    setPlan((old) => ({ ...old, ...fields }))
    setScores(null)
  }

  function analyzeNow() {
    const next = runScores(plan)
    setScores(next)
    toast?.('Journey score updated from current route, budget, date and transport data.')
  }

  function saveBest() {
    if (!scores) {
      toast?.('Click Analyze Journey first, then save the scored route.')
      return
    }
    savePlan({ ...plan, travelScore: scores.travel, planQualityScore: scores.quality })
    toast('Analyzed route saved.')
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="badge"><BrainCircuit size={14} /> Score appears only after analysis</span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">Analyze Journey</h1>
          <p className="mt-2 max-w-2xl text-slate-300">Enter the route, date, transport, class and budget. The app calculates the score only after you click Analyze Journey, so the number reflects the current input.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary inline-flex items-center gap-2" onClick={analyzeNow}><PlayCircle size={18} />Analyze Journey</button>
          <button className="btn-soft inline-flex items-center gap-2" onClick={saveBest}><Save size={18} />Save Analyzed Route</button>
          <button className="btn-soft inline-flex items-center gap-2" onClick={() => setBookingOpen(true)}><Ticket size={18} />View Route Options</button>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="glass rounded-3xl p-5">
          <h2 className="text-2xl font-black text-white">Journey input</h2>
          <datalist id="analyze-station-list">
            {stationOptions.map((city) => <option key={city} value={city} />)}
          </datalist>
          <div className="mt-5 grid gap-4">
            <input list="analyze-station-list" className="input" value={plan.from} onChange={(e) => update({ from: e.target.value })} placeholder="Boarding railway station / city" />
            <input list="analyze-station-list" className="input" value={plan.to} onChange={(e) => update({ to: e.target.value })} placeholder="Destination railway station / city" />
            <select className="input" value={plan.transportMode} onChange={(e) => update({ transportMode: e.target.value, routeCombo: `${e.target.value} only` })}><option>Train</option><option>Flight</option><option>Bus</option></select>
            <input className="input date-input" type="date" value={plan.date} onChange={(e) => update({ date: e.target.value })} />
            <select className="input" value={plan.classType} onChange={(e) => update({ classType: e.target.value })}><option>Sleeper</option><option>3A</option><option>2A</option><option>Chair Car</option><option>Economy</option><option>AC Sleeper</option></select>
            <select className="input" value={Number(plan.passengers || 1)} onChange={(e) => update({ passengers: Number(e.target.value) })}>{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} passenger{count > 1 ? 's' : ''}</option>)}</select>
            <input className="input" type="number" value={plan.budget} onChange={(e) => update({ budget: Number(e.target.value) })} placeholder="Budget" />
          </div>
          <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
            <ShieldCheck className="mb-2" /> Score uses visible factors only: route fields, matching station/city data, budget vs estimated fare, selected service reliability, travel date validity and backup strength.
          </div>
        </div>

        <div className="grid gap-5">
          {!scores ? (
            <div className="glass rounded-3xl p-6">
              <h2 className="text-2xl font-black text-white">No score yet</h2>
              <p className="mt-2 text-slate-300">Click <b>Analyze Journey</b> after entering your details. The score will update only after analysis.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['Travel Score', `${scores.travel}/100`],
                  ['Plan Quality', `${scores.quality}/100`],
                  ['Booking Chance', scores.bookingChance]
                ].map(([label, value]) => (
                  <div key={label} className="glass rounded-3xl p-5">
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className="mt-3 text-2xl font-black text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="glass rounded-3xl p-5">
                <h2 className="text-2xl font-black text-white">Score breakdown</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {scores.breakdown.map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4">
                      <div className="flex justify-between text-sm font-bold text-slate-200"><span>{label}</span><span>{value}/100</span></div>
                      <div className="mt-2 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-400" style={{ width: `${value}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <TripComparison plan={plan} />
        </div>
      </section>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} plan={previewPlan} mode="normal" onSaved={() => toast('Analyzed route saved from booking modal.')} />
    </main>
  )
}
