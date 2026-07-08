import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bookmark, DownloadCloud, RotateCw, Ticket, Trash2 } from 'lucide-react'
import BookingModal from '../components/BookingModal'
import { deletePlan, getOfflinePack, getSavedPlans, saveOfflinePack, setLoadedPlan } from '../utils/storage'
import { calculatePlanQualityScore, planVerdict, scoreBreakdown } from '../utils/scoring'

export default function SavedPlans({ toast }) {
  const [plans, setPlans] = useState([])
  const [bookingPlan, setBookingPlan] = useState(null)
  const [offline, setOffline] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    setPlans(getSavedPlans())
    setOffline(getOfflinePack())
  }, [])

  const latestPlanTime = plans.reduce((latest, plan) => Math.max(latest, new Date(plan.timestamp || 0).getTime()), 0)
  const offlineTime = offline?.generatedAt ? new Date(offline.generatedAt).getTime() : 0
  const routeReady = plans.some((plan) => plan.from && plan.to)
  const packCurrent = Boolean(offline && routeReady && offlineTime >= latestPlanTime && (offline.savedRoutes?.length || 0) >= plans.length)
  const canGeneratePack = routeReady && !packCurrent
  const packButtonLabel = !routeReady
    ? 'Save a route first'
    : packCurrent
      ? 'Offline Pack Up To Date'
      : offline
        ? 'Regenerate Offline Pack'
        : 'Generate Offline Pack'

  function refresh() {
    setPlans(getSavedPlans())
    setOffline(getOfflinePack())
  }

  function remove(id) {
    setPlans(deletePlan(id))
    toast('Saved plan deleted.')
  }

  function openPlan(plan) {
    setLoadedPlan(plan)
    navigate('/planner')
  }

  function makeOfflinePack() {
    if (!routeReady) {
      toast('Save at least one route before generating route offline pack.')
      return
    }
    if (packCurrent) {
      toast('Offline pack is already up to date.')
      return
    }
    const pack = saveOfflinePack()
    setOffline(pack)
    toast('Offline pack generated with saved routes, service snapshots and document metadata.')
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="badge"><Bookmark size={14} /> localStorage persistence</span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">Saved Plans & Offline Pack</h1>
          <p className="mt-2 max-w-2xl text-slate-300">Saved plans include journey mode, selected service snapshot, offline route details and a plan quality score so judges can see whether a plan is usable.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50" onClick={makeOfflinePack} disabled={!canGeneratePack}><DownloadCloud size={18} />{packButtonLabel}</button>
          <button className="btn-soft inline-flex items-center gap-2" onClick={refresh}><RotateCw size={18} />Refresh</button>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-sm text-cyan-50">
        <h2 className="text-xl font-black text-white">Offline pack condition</h2>
        <p className="mt-2">The full offline pack is generated only after at least one saved route exists. This prevents an empty pack and keeps the emergency cache focused on the actual journey.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className={`rounded-2xl border p-3 ${routeReady ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-yellow-300/30 bg-yellow-300/10 text-yellow-100'}`}>Route saved: <b>{routeReady ? 'Yes' : 'No'}</b></div>
          <div className={`rounded-2xl border p-3 ${packCurrent ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-slate-600 bg-slate-950/50 text-slate-300'}`}>Pack status: <b>{packCurrent ? 'Current' : 'Needs update'}</b></div>
          <div className="rounded-2xl border border-slate-600 bg-slate-950/50 p-3 text-slate-300">Saved routes: <b className="text-cyan-100">{plans.length}</b></div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.45fr]">
        <div className="grid gap-4">
          {plans.length === 0 ? (
            <div className="glass rounded-3xl p-8 text-center">
              <h2 className="text-2xl font-black text-white">No saved plans yet</h2>
              <p className="mt-2 text-slate-400">Open Planner, fill route details and click Save Plan.</p>
              <Link to="/planner" className="btn-primary mt-5 inline-block">Go to Planner</Link>
            </div>
          ) : plans.map((plan) => {
            const score = plan.planQualityScore || calculatePlanQualityScore(plan)
            const verdict = planVerdict(score)
            return (
              <div key={plan.id} className="glass rounded-3xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="badge">{plan.mode}</span>
                      <span className="badge">{plan.transportMode || 'Train'}</span>
                      <span className="rounded-full bg-cyan-400 px-3 py-1 text-sm font-black text-slate-950">Plan score {score}/100 · {verdict}</span>
                    </div>
                    <h2 className="mt-3 text-2xl font-black text-white">{plan.from} → {plan.to}</h2>
                    <p className="mt-1 text-sm text-slate-400">{plan.date} · {plan.ticketType || plan.quota} · {plan.classType} · {plan.passengers} passenger(s)</p>
                    <p className="mt-1 text-sm text-slate-400">Journey mode: {plan.transportMode || 'Train'} · Readiness: {plan.readinessScore || 0}%</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {(plan.scoreBreakdown || scoreBreakdown(plan)).map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-2 text-xs text-slate-300">
                          <div className="flex justify-between gap-2"><span>{label}</span><b className="text-cyan-100">{value}/100</b></div>
                          <div className="mt-1 h-1.5 rounded-full bg-slate-800"><div className="h-1.5 rounded-full bg-cyan-400" style={{ width: `${value}%` }} /></div>
                        </div>
                      ))}
                    </div>
                    {plan.serviceOptions?.trains?.[0] && <p className="mt-2 text-xs text-slate-400"><b className="text-cyan-100">Saved service:</b> {plan.serviceOptions.trains[0].service} / {plan.serviceOptions.flights?.[0]?.service} / {plan.serviceOptions.buses?.[0]?.service}</p>}
                    <p className="mt-1 text-xs text-slate-500">Saved {new Date(plan.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-soft" onClick={() => openPlan(plan)}>Open Plan</button>
                    <button className="btn-low" onClick={() => { setLoadedPlan({ ...plan, mode: 'low-network' }); navigate('/planner') }}>Use Offline</button>
                    <button className="btn-primary inline-flex items-center gap-2" onClick={() => setBookingPlan(plan)}><Ticket size={16} />View Options</button>
                    <button className="btn-danger inline-flex items-center gap-2" onClick={() => remove(plan.id)}><Trash2 size={16} />Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <aside className="glass h-fit rounded-3xl p-5">
          <h2 className="text-2xl font-black text-white">Offline Pack Status</h2>
          {offline ? (
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p><b className="text-cyan-200">Generated:</b> {new Date(offline.generatedAt).toLocaleString()}</p>
              <p><b className="text-cyan-200">Emergency flows:</b> {offline.emergencyCards?.length}</p>
                            <p><b className="text-cyan-200">Saved routes included:</b> {offline.savedRoutes?.length}</p>
              <p><b className="text-cyan-200">Transport hubs cached:</b> {offline.transportPlaces?.length || 0}</p>
              <p><b className="text-cyan-200">Route service snapshots:</b> {offline.currentRouteServices?.length || 0}</p>
              <p><b className="text-cyan-200">Document metadata:</b> {offline.savedDocuments?.length || 0}</p>
              <p className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-yellow-100">Offline pack is browser localStorage. It is enough for hackathon MVP, not a production sync system.</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No offline pack generated yet.</p>
          )}
        </aside>
      </section>

      <BookingModal open={Boolean(bookingPlan)} onClose={() => setBookingPlan(null)} plan={bookingPlan || {}} mode={bookingPlan?.mode || 'normal'} onSaved={() => toast('Saved again from booking modal.')} />
    </main>
  )
}
