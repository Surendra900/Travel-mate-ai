import { estimatePrice } from '../utils/scoring'

export default function PricePredictor({ plan, icon }) {
  const price = estimatePrice({
    distance: 1500,
    passengers: Number(plan.passengers || 1),
    classType: plan.classType,
    urgency: plan.urgency,
    transportMode: plan.transportMode
  })
  const budget = Number(plan.budget || 0)
  const hasBudget = budget > 0
  const withinBudget = hasBudget && price <= budget

  return (
    <div className="glass rounded-3xl p-5">
      <span className="text-cyan-300">{icon}</span>
      <h3 className="mt-3 text-xl font-black text-white">AI Price Predictor</h3>
      <p className="mt-1 text-sm text-slate-400">Local estimate, not live pricing.</p>
      <p className="mt-4 text-4xl font-black text-cyan-200">₹{price}</p>
      <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${withinBudget ? 'bg-emerald-400/15 text-emerald-200' : 'bg-yellow-400/15 text-yellow-100'}`}>
        {hasBudget ? withinBudget ? `✓ Within budget by ₹${budget - price}` : `⚠ Above budget by ₹${price - budget}` : 'Add budget to compare'}
      </div>
      <p className="mt-2 text-sm text-slate-400">Budget: ₹{budget || 'not set'} · Route: {plan.from} → {plan.to}</p>
    </div>
  )
}
