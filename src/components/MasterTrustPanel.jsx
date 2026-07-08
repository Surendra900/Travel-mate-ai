import { DatabaseZap, ShieldCheck, WifiOff } from 'lucide-react'
import SourceBadge from './SourceBadge'

const rows = [
  ['Live API result', 'RapidAPI IRCTC / Aviationstack response from serverless backend.'],
  ['Verified static data', 'Curated local Indian travel dataset used for stable demo routes.'],
  ['Fallback estimate', 'Offline/local estimate shown when an API is missing, blocked, or empty.'],
  ['Provider verification required', 'Final fare, seat, PNR, payment, and ticket issue must be verified by an official provider.']
]

export default function MasterTrustPanel({ compact = false }) {
  return (
    <section className={`glass rounded-3xl ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-cyan-200"><ShieldCheck size={17} /> Trust layer</p>
          <h2 className="mt-1 text-2xl font-black text-white">Every travel result is source-labeled</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">TravelMate does not pretend demo or fallback data is live. Cards clearly show whether they came from an API, a verified static dataset, an estimate, or still need provider verification.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="badge"><DatabaseZap size={14} /> API-ready backend</span>
          <span className="badge"><WifiOff size={14} /> Offline-safe fallback</span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map(([label, text]) => (
          <div key={label} className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-3 text-sm text-slate-300">
            <SourceBadge label={label} />
            <p className="mt-2">{text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
