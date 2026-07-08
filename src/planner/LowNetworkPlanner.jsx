import { useMemo } from 'react'
import { CalendarDays, Save, ShoppingCart, Ticket, WifiOff } from 'lucide-react'
import { getOfflinePack, getSavedPlans, savePlan } from '../utils/storage'
import { getCabinOptions, getRouteInputLabels, transportModes, transportPlaces } from '../data/transportData'
import ServiceOptionsBoard from '../components/ServiceOptionsBoard'

function Field({ label, children }) {
  return <label className="block text-sm font-bold text-lime-100"><span className="mb-2 block">{label}</span>{children}</label>
}

const cityOptions = transportPlaces.map((item) => item.city)

function groupKeyFor(mode = 'Train') {
  return mode === 'Flight' ? 'flights' : mode === 'Bus' ? 'buses' : 'trains'
}

function serviceForSaved(saved) {
  const key = groupKeyFor(saved?.transportMode || 'Train')
  return saved?.serviceOptions?.[key]?.[0] || saved?.serviceOptions?.trains?.[0] || saved?.serviceOptions?.flights?.[0] || saved?.serviceOptions?.buses?.[0]
}

function SavedOfflineSnapshot({ pack }) {
  const saved = pack?.savedRoutes?.[0] || getSavedPlans()[0]
  const selectedService = serviceForSaved(saved)

  if (!saved) {
    return (
      <div className="low-glass rounded-3xl p-5">
        <h3 className="text-2xl font-black text-white">No saved offline plan yet</h3>
        <p className="mt-2 text-sm text-lime-100/85">When internet is available, create a route, choose journey mode/date/passengers, click Save Offline Route, then Prepare Offline. The same route appears here during no-network use.</p>
      </div>
    )
  }

  return (
    <div className="low-glass rounded-3xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-200">Offline saved plan</p>
          <h3 className="mt-1 text-2xl font-black text-white">{saved.from} → {saved.to}</h3>
          <p className="mt-1 text-sm text-lime-100/85">Destination: {saved.to} · Journey mode: {saved.transportMode || 'Train'} · Date: {saved.date || 'Saved date'}</p>
        </div>
        <span className="badge border-lime-400/30 bg-lime-400/10 text-lime-100">Stored on this device</span>
      </div>
      {selectedService && (
        <div className="mt-4 rounded-2xl border border-lime-300/20 bg-slate-950/70 p-4 text-sm text-lime-50">
          <p><b>Service:</b> {selectedService.service} ({selectedService.code})</p>
          <p className="mt-1"><b>Path:</b> {selectedService.from} → {selectedService.to}</p>
          <p className="mt-1"><b>Timing:</b> {selectedService.depart} → {selectedService.arrive} · {selectedService.duration}</p>
          <p className="mt-1"><b>Fare estimate:</b> ₹{selectedService.fare} · {selectedService.status}</p>
        </div>
      )}
      {pack?.savedDocuments?.length > 0 && (
        <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
          <p className="font-black text-white">Important documents listed in offline pack</p>
          <div className="mt-2 grid gap-2">
            {pack.savedDocuments.slice(0, 6).map((doc) => <a key={doc.id || doc.name} className="rounded-xl bg-slate-950/70 p-2 font-bold hover:bg-slate-900" href={doc.dataUrl} download={doc.name}>{doc.category || 'Document'} · {doc.name}</a>)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function LowNetworkPlanner({ plan, update, onBook, onBookService, toast, status }) {
  const selectedMode = plan.transportMode || 'Train'
  const routeLabels = getRouteInputLabels(selectedMode)
  const offlinePack = useMemo(() => getOfflinePack(), [status?.online])
  const lowPlan = { ...plan, transportMode: selectedMode, routeCombo: `${selectedMode} only`, classType: plan.classType || getCabinOptions(selectedMode)[0] }
  const focusMode = groupKeyFor(selectedMode)

  function handleTransportChange(value) {
    update({ transportMode: value, routeCombo: `${value} only`, classType: getCabinOptions(value)[0] })
  }

  function handleSave() {
    savePlan({ ...lowPlan, mode: 'low-network' })
    toast('Low-signal route saved. Use Prepare Offline to cache it for no-internet use.')
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="low-glass rounded-3xl p-5">
        <span className="badge border-lime-400/30 bg-lime-400/10 text-lime-100"><WifiOff size={14} /> Low Network / Battery Saver Mode</span>
        <h2 className="mt-4 text-3xl font-black text-white">Low-data ticket finder</h2>
        <p className="mt-2 text-sm text-lime-100/85">Use this when internet is weak. It keeps compact fields, shows only the selected transport, and still lets you open the Book Ticket demo flow.</p>

        <datalist id="low-city-list">
          {cityOptions.map((city) => <option key={city} value={city} />)}
        </datalist>

        <div className="mt-5 grid gap-4">
          <Field label={routeLabels.from}><input list="low-city-list" className="input" value={plan.from} placeholder={routeLabels.fromPlaceholder} onChange={(e) => update({ from: e.target.value })} /></Field>
          <Field label={routeLabels.to}><input list="low-city-list" className="input" value={plan.to} placeholder={routeLabels.toPlaceholder} onChange={(e) => update({ to: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mode of transport"><select className="input" value={selectedMode} onChange={(e) => handleTransportChange(e.target.value)}>{transportModes.map((mode) => <option key={mode}>{mode}</option>)}</select></Field>
            <Field label="Journey date"><div className="relative"><CalendarDays className="pointer-events-none absolute right-3 top-3 text-cyan-200" size={18} /><input className="input date-input pr-10" type="date" value={plan.date} onChange={(e) => update({ date: e.target.value })} /></div></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Passengers"><select className="input" value={Number(plan.passengers || 1)} onChange={(e) => update({ passengers: Number(e.target.value) })}>{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} passenger{count > 1 ? 's' : ''}</option>)}</select></Field>
            <Field label="Class / cabin"><select className="input" value={lowPlan.classType} onChange={(e) => update({ classType: e.target.value })}>{getCabinOptions(selectedMode).map((item) => <option key={item}>{item}</option>)}</select></Field>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-primary inline-flex items-center gap-2" onClick={onBook}><ShoppingCart size={18} />Book ticket</button>
          <button className="btn-low inline-flex items-center gap-2" onClick={handleSave}><Save size={18} />Save Offline Route</button>
          <button className="btn-soft inline-flex items-center gap-2" onClick={onBook}><Ticket size={18} />View selected options</button>
        </div>
      </div>

      <div className="grid gap-4">
        <SavedOfflineSnapshot pack={offlinePack} />
        <ServiceOptionsBoard plan={lowPlan} compact focusMode={focusMode} onBookService={onBookService} />
        <div className="low-glass rounded-3xl p-5">
          <h3 className="text-2xl font-black text-white">What stays available</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ['Saved route', 'Destination, path, service name, timing and fare estimate from the saved plan.'],
              ['Offline documents', 'Important document names/files remain available from the offline pack on this device.'],
              ['Emergency numbers', 'Call/copy emergency numbers from local data.'],
              ['Compact booking prep', 'Book Ticket opens the demo booking form; final confirmation still needs provider internet/API.']
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-lime-400/20 bg-slate-950/70 p-4">
                <h4 className="font-black text-lime-100">{title}</h4>
                <p className="mt-1 text-sm text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
