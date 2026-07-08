import { Link } from 'react-router-dom'
import { AlertTriangle, Download, FileText, MapPinned, PhoneCall, RefreshCw, ShieldCheck, Train, WifiOff } from 'lucide-react'
import { getDocuments, getOfflinePack, getSavedPlans, saveOfflinePack } from '../utils/storage'
import { buildComboLegs, routeCombos } from '../data/transportData'

function newestSavedPlan(pack) {
  return pack?.savedRoutes?.[0] || getSavedPlans()[0] || null
}

function bestOfflineBackup(plan) {
  if (!plan) return null
  const backupCombo = routeCombos
    .filter((combo) => combo.label !== (plan.routeCombo || `${plan.transportMode || 'Train'} only`))
    .sort((a, b) => (b.emergencyFit + b.reliability + b.cost) - (a.emergencyFit + a.reliability + a.cost))[0]
  if (!backupCombo) return null
  return { ...backupCombo, legs: buildComboLegs(backupCombo, plan) }
}

export default function OfflineOnlyMode({ status, toast }) {
  const pack = getOfflinePack()
  const plan = newestSavedPlan(pack)
  const docs = getDocuments()
  const backup = bestOfflineBackup(plan)
  const train = plan?.serviceOptions?.trains?.[0] || plan?.serviceOptions?.[0]

  function refreshPack() {
    saveOfflinePack()
    toast?.('Offline pack updated on this device.')
    window.location.reload()
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-[2rem] border border-lime-400/25 bg-lime-400/10 p-6 shadow-glow">
        <span className="badge border-lime-400/30 bg-lime-400/10 text-lime-100"><WifiOff size={14} /> Offline Mode Only</span>
        <h1 className="mt-5 text-4xl font-black text-white md:text-5xl">TravelMate Offline Pack</h1>
        <p className="mt-3 max-w-3xl text-lime-100/90">Internet is unavailable, so live search, booking checks, API refresh, maps and heavy comparison panels are hidden. Only saved route snapshots, offline documents, emergency numbers and one practical backup are shown.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-low inline-flex items-center gap-2" onClick={refreshPack}><RefreshCw size={18} /> Refresh local pack</button>
          <a className="btn-danger inline-flex items-center gap-2" href="tel:112"><PhoneCall size={18} /> Call 112</a>
        </div>
      </section>

      {!plan ? (
        <section className="mt-6 rounded-3xl border border-yellow-400/25 bg-yellow-400/10 p-6 text-yellow-100">
          <h2 className="text-2xl font-black text-white">No saved journey found</h2>
          <p className="mt-2">When internet returns, open Planner, choose route/mode/date, save the plan, then click Prepare Offline. After that, this page can show the saved journey during no-network situations.</p>
        </section>
      ) : (
        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <article className="low-glass rounded-3xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-200">Saved journey snapshot</p>
                <h2 className="mt-2 text-3xl font-black text-white">{plan.from} → {plan.to}</h2>
                <p className="mt-2 text-lime-100/90">Destination: {plan.to} · Journey mode: {plan.transportMode || 'Train'} · Date: {plan.date || 'Saved date'}</p>
              </div>
              <span className="rounded-full bg-lime-300 px-4 py-2 text-sm font-black text-slate-950">Offline ready</span>
            </div>
            {train && (
              <div className="mt-5 rounded-2xl border border-lime-300/20 bg-slate-950/80 p-4 text-sm text-lime-50">
                <p><b className="text-white">Train / service:</b> {train.service} ({train.code})</p>
                <p className="mt-1"><b className="text-white">Path:</b> {train.from} → {train.to}</p>
                <p className="mt-1"><b className="text-white">Timing:</b> {train.depart} → {train.arrive} · {train.duration}</p>
                <p className="mt-1"><b className="text-white">Fare estimate:</b> ₹{train.fare} · {train.status}</p>
                <p className="mt-2 text-xs text-yellow-100/90">Final live availability needs internet and official provider verification.</p>
              </div>
            )}
          </article>

          <article className="glass rounded-3xl p-5">
            <h2 className="flex items-center gap-2 text-2xl font-black text-white"><ShieldCheck className="text-cyan-300" /> Best practical backup</h2>
            {backup ? (
              <div className="mt-4 space-y-3">
                <p className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 font-black text-cyan-100">{backup.label}</p>
                {backup.legs.map((leg) => (
                  <p key={`${backup.label}-${leg.leg}`} className="rounded-xl bg-slate-950/70 p-3 text-sm text-slate-300"><b className="text-white">{leg.mode}:</b> {leg.service} · {leg.depart} → {leg.arrive} · ₹{leg.fare}</p>
                ))}
              </div>
            ) : <p className="mt-3 text-slate-300">No backup stored. Prepare offline pack after saving a route.</p>}
          </article>
        </section>
      )}

      <section className="mt-6 glass rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-black text-white"><FileText className="text-cyan-300" /> Offline important documents</h2>
          <span className="badge">Stored on this device</span>
        </div>
        <p className="mt-2 text-sm text-slate-400">Documents saved in the local vault remain available from this browser even without internet. They are not uploaded to cloud.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {docs.length === 0 ? (
            <p className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm font-bold text-yellow-100">No documents saved yet. Add ID, ticket, insurance and other important files in Safety Mode while online.</p>
          ) : docs.map((doc) => (
            <div key={doc.id} className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4">
              <p className="font-black text-white">{doc.name}</p>
              <p className="mt-1 text-sm text-slate-400">{doc.category} · {doc.note || 'No note'}</p>
              <a className="btn-soft mt-3 inline-flex items-center gap-2" href={doc.dataUrl} download={doc.name}><Download size={16} /> Open/download offline</a>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ['Emergency call', 'Use 112 for urgent danger. Browser opens the dialer; user confirms the call.'],
          ['Location sharing', 'GPS permission is required. If blocked, enter nearest landmark manually.'],
          ['Offline limitation', 'Live status, fresh fares and new bookings need internet.']
        ].map(([title, text]) => (
          <div key={title} className="rounded-3xl border border-slate-700/70 bg-slate-950/70 p-5">
            <MapPinned className="text-cyan-300" />
            <h3 className="mt-3 font-black text-white">{title}</h3>
            <p className="mt-2 text-sm text-slate-400">{text}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
