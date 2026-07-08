import { estimateCarbonKg } from '../utils/scoring'

function carbonLevel(kg) {
  if (kg <= 60) return ['Low impact', '≈ 3 days of home electricity']
  if (kg <= 180) return ['Medium impact', '≈ 1 week of home electricity']
  return ['High impact', '≈ 2+ weeks of home electricity']
}

export default function CarbonCalculator({ plan, icon }) {
  const mode = plan.mode || plan.transportMode || 'Train'
  const kg = estimateCarbonKg({ distance: 1500, mode, passengers: Number(plan.passengers || 1) })
  const [level, context] = carbonLevel(kg)

  return (
    <div className="glass rounded-3xl p-5">
      <span className="text-emerald-300">{icon}</span>
      <h3 className="mt-3 text-xl font-black text-white">Carbon Calculator</h3>
      <p className="mt-1 text-sm text-slate-400">Shown only in Normal Mode, hidden during emergencies.</p>
      <p className="mt-4 text-4xl font-black text-emerald-200">{kg} kg</p>
      <div className="mt-3 inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-100">{level}</div>
      <p className="mt-2 text-sm text-slate-400">{context} · estimated CO₂ for {mode.toLowerCase()} route.</p>
    </div>
  )
}
