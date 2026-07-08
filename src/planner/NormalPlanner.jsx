import { BarChart3, Save, Ticket } from 'lucide-react'
import { savePlan } from '../utils/storage'
import PNRTracker from './PNRTracker'
import PricePredictor from './PricePredictor'
import TransportStatus from './TransportStatus'
import TrainRunningStatus from './TrainRunningStatus'
import LiveStationDashboard from './LiveStationDashboard'
import SeatAvailabilityChecker from './SeatAvailabilityChecker'
import FlightInstructions from './FlightInstructions'
import RouteMap from '../components/RouteMap'
import TripComparison from '../components/TripComparison'
import ServiceOptionsBoard from '../components/ServiceOptionsBoard'
import BackupPlan from '../components/BackupPlan'
import { airlineRules, getCabinOptions, getRouteInputLabels, transportModes, transportPlaces } from '../data/transportData'

function Field({ label, children }) {
  return <label className="block text-sm font-bold text-slate-300"><span className="mb-2 block">{label}</span>{children}</label>
}

const cityOptions = transportPlaces.map((item) => item.city)

function classOptions(mode) {
  return getCabinOptions(mode)
}

export default function NormalPlanner({ plan, update, onBook, onBookService, onBookBackup, toast }) {
  const routeLabels = getRouteInputLabels(plan.transportMode)
  function handleSave() {
    savePlan({ ...plan, mode: 'normal' })
    toast('Normal route plan saved with quality score.')
  }

  function handleTransportChange(value) {
    const nextClass = getCabinOptions(value)[0]
    update({ transportMode: value, classType: nextClass, ticketType: 'Normal', quota: 'Normal', routeCombo: `${value} only` })
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
      <div className="glass rounded-3xl p-5 shadow-glow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-cyan-200">Normal Mode · Train + Flight + Bus</p>
            <h2 className="text-2xl font-black text-white">Full route dashboard</h2>
          </div>
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-right" title="Travel Success Score: route completeness, budget, readiness, mode and backup quality.">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Travel Success Score</p>
            <p className="text-xl font-black text-white">{plan.travelScore}/100</p>
          </div>
        </div>

        <datalist id="city-list">
          {cityOptions.map((city) => <option key={city} value={city} />)}
        </datalist>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label={routeLabels.from}><input list="city-list" className="input" value={plan.from} placeholder={routeLabels.fromPlaceholder} onChange={(e) => update({ from: e.target.value })} /></Field>
          <Field label={routeLabels.to}><input list="city-list" className="input" value={plan.to} placeholder={routeLabels.toPlaceholder} onChange={(e) => update({ to: e.target.value })} /></Field>
          <Field label="Transport method"><select className="input" value={plan.transportMode} onChange={(e) => handleTransportChange(e.target.value)}>{transportModes.map((mode) => <option key={mode}>{mode}</option>)}</select></Field>
          <Field label="Date"><input className="input date-input" type="date" value={plan.date} onChange={(e) => update({ date: e.target.value })} /></Field>
          <Field label="Passengers"><select className="input" value={Number(plan.passengers || 1)} onChange={(e) => update({ passengers: Number(e.target.value) })}>{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}</option>)}</select><span className="mt-1 block text-xs text-slate-500">Maximum 6 passengers.</span></Field>
          <Field label="Budget (₹)"><input className="input" type="number" value={plan.budget} onChange={(e) => update({ budget: e.target.value })} /></Field>
          <Field label="Class / cabin"><select className="input" value={plan.classType} onChange={(e) => update({ classType: e.target.value })}>{classOptions(plan.transportMode).map((item) => <option key={item}>{item}</option>)}</select><span className="mt-1 block text-xs text-slate-500">Shows the full cabin/class list for the selected transport mode.</span></Field>
          {plan.transportMode === 'Flight' && <Field label="Airline"><select className="input" value={plan.airline} onChange={(e) => update({ airline: e.target.value })}>{Object.keys(airlineRules).map((item) => <option key={item}>{item}</option>)}</select></Field>}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-primary inline-flex items-center gap-2" onClick={() => toast('For accurate data, use the route board/live tools below and book from a card marked Live API result. Generic fallback booking is disabled here.')}><Ticket size={18} />Use live result below →</button>
          <button className="btn-soft inline-flex items-center gap-2" onClick={handleSave}><Save size={18} />Save Plan</button><span className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs font-bold text-yellow-100">Generic static booking is disabled here to avoid confusing fallback with live data.</span>
        </div>
      </div>

      <div className="grid gap-5">
        <RouteMap plan={plan} />
        <ServiceOptionsBoard plan={plan} focusMode={plan.transportMode === 'Train' ? 'trains' : plan.transportMode === 'Flight' ? 'flights' : 'buses'} onBookService={onBookService} />
        <TripComparison plan={plan} />
        <BackupPlan plan={plan} onBookBackup={onBookBackup} />
        {plan.transportMode === 'Flight' && <FlightInstructions airline={plan.airline} />}
        <div className="grid gap-5 md:grid-cols-2">
          <PricePredictor plan={plan} icon={<BarChart3 size={20} />} />
          {plan.transportMode === 'Train' ? <PNRTracker /> : <TransportStatus mode={plan.transportMode} />}
          {plan.transportMode === 'Train' ? <TrainRunningStatus plan={plan} toast={toast} /> : null}
          {plan.transportMode === 'Train' ? <SeatAvailabilityChecker plan={plan} toast={toast} /> : null}
          {plan.transportMode === 'Train' ? <LiveStationDashboard /> : null}
        </div>
      </div>
    </div>
  )
}
