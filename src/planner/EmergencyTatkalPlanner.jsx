import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bell, Clock, Ticket, TrainFront } from 'lucide-react'
import { tatkalRules } from '../data/journeyData'
import { getCabinOptions, getRouteInputLabels, servicesForMode, transportPlaces } from '../data/transportData'
import ServiceOptionsBoard from '../components/ServiceOptionsBoard'
import BackupPlan from '../components/BackupPlan'
import TatkalEmergencyTimer from '../components/TatkalEmergencyTimer'
import TrainRunningStatus from './TrainRunningStatus'
import SourceBadge from '../components/SourceBadge'

function Field({ label, children }) {
  return <label className="block text-sm font-bold text-red-100"><span className="mb-2 block">{label}</span>{children}</label>
}

const cityOptions = transportPlaces.map((item) => item.city)

function trainClassOptions() {
  return getCabinOptions('Train').filter((item) => !item.toLowerCase().includes('general'))
}

function isTatkalWindowOpen(classType = '') {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const currentMinutes = hour * 60 + minute
  const isAc = /(ac|cc|ec|1a|2a|3a|3e)/i.test(classType)
  const start = isAc ? 10 * 60 : 11 * 60
  const end = start + 60
  return {
    isAc,
    open: currentMinutes >= start && currentMinutes <= end,
    startText: isAc ? '10:00 AM for AC Tatkal' : '11:00 AM for Non-AC Tatkal',
    alarm5: isAc ? '9:55 AM' : '10:55 AM',
    alarm10: isAc ? '9:50 AM' : '10:50 AM'
  }
}

export default function EmergencyTatkalPlanner({ plan, update, onBook, onBookService, onBookBackup, toast }) {
  const routeLabels = getRouteInputLabels('Train')
  const [targetTrainCode, setTargetTrainCode] = useState('')
  const trainServices = useMemo(() => servicesForMode({ ...plan, transportMode: 'Train' }, 'Train'), [plan.from, plan.to, plan.date, plan.budget])
  const bestTatkalTrain = trainServices.slice().sort((a, b) => Number(b.reliability || 0) - Number(a.reliability || 0))[0]
  const selectedTatkalTrain = trainServices.find((item) => item.code === targetTrainCode) || null
  const emergencyClass = trainClassOptions().includes(plan.classType) ? plan.classType : 'Sleeper (SL)'
  const tatkalWindow = isTatkalWindowOpen(emergencyClass)
  const urgentPlan = {
    ...plan,
    transportMode: 'Train',
    routeCombo: 'Train only',
    classType: emergencyClass,
    ticketType: 'Tatkal / Emergency',
    quota: 'Tatkal / Emergency',
    urgency: 'Emergency',
    selectedService: selectedTatkalTrain || plan.selectedService || null
  }

  useEffect(() => {
    if (plan.transportMode !== 'Train' || plan.routeCombo !== 'Train only' || plan.ticketType !== 'Tatkal / Emergency') {
      update({ transportMode: 'Train', routeCombo: 'Train only', ticketType: 'Tatkal / Emergency', quota: 'Tatkal / Emergency', urgency: 'Emergency', classType: emergencyClass })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setAlarm(minutes) {
    toast?.(`Tatkal alarm prepared ${minutes} minutes before ${tatkalWindow.startText}. Browser alarm is a demo reminder; use phone alarm for real booking.`)
  }

  function bookSelectedTrain(service = selectedTatkalTrain) {
    if (!service) {
      toast?.('Select a train first. Available Tatkal train options are shown below.')
      return
    }
    onBookService?.(service, 'trains')
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="danger-glass rounded-3xl p-5 shadow-danger">
        <span className="badge border-red-400/30 bg-red-400/10 text-red-100"><AlertTriangle size={14} /> Emergency Mode · Tatkal trains only</span>
        <h2 className="mt-4 text-3xl font-black text-white">Tatkal train booking preparation</h2>
        <p className="mt-2 text-sm text-red-100/85">Emergency Mode is exclusively for Tatkal train planning. Flight, bus and mixed routes stay in Normal Mode or as fallback booking legs.</p>

        <datalist id="emergency-city-list">
          {cityOptions.map((city) => <option key={city} value={city} />)}
        </datalist>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label={routeLabels.from}><input list="emergency-city-list" className="input" value={plan.from} placeholder={routeLabels.fromPlaceholder} onChange={(e) => update({ from: e.target.value })} /></Field>
          <Field label={routeLabels.to}><input list="emergency-city-list" className="input" value={plan.to} placeholder={routeLabels.toPlaceholder} onChange={(e) => update({ to: e.target.value })} /></Field>
          <Field label="Date"><input className="input date-input" type="date" value={plan.date} onChange={(e) => update({ date: e.target.value })} /></Field>
          <Field label="Class"><select className="input" value={emergencyClass} onChange={(e) => update({ classType: e.target.value })}>{trainClassOptions().map((item) => <option key={item}>{item}</option>)}</select><span className="mt-1 block text-xs text-red-100/60">General / Unreserved is hidden because this mode is only for Tatkal preparation.</span></Field>
          <Field label="Passengers"><select className="input" value={Number(plan.passengers || 1)} onChange={(e) => update({ passengers: Number(e.target.value) })}>{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}</option>)}</select></Field>
          <Field label="Which train are you trying to book Tatkal for?"><select className="input" value={targetTrainCode} onChange={(e) => setTargetTrainCode(e.target.value)}><option value="">Show available Tatkal trains</option>{trainServices.map((item) => <option key={item.code} value={item.code}>{item.service} · {item.depart} · reliability {item.reliability || 0}/100</option>)}</select></Field>
        </div>

        <div className="mt-5 rounded-2xl border border-orange-300/30 bg-slate-950/60 p-4 text-sm text-orange-100">
          <p className="flex items-center gap-2 font-black text-white"><Clock size={18} /> Tatkal release window</p>
          <p className="mt-2">{tatkalWindow.open ? 'Tatkal window is currently open for this class demo.' : `Tatkal tickets are not released right now. Booking normally opens at ${tatkalWindow.startText}.`}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-soft" onClick={() => setAlarm(5)}><Bell size={16} /> Set alarm 5 min before · {tatkalWindow.alarm5}</button>
            <button className="btn-soft" onClick={() => setAlarm(10)}><Bell size={16} /> Set alarm 10 min before · {tatkalWindow.alarm10}</button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-danger inline-flex items-center gap-2" onClick={() => selectedTatkalTrain ? bookSelectedTrain(selectedTatkalTrain) : toast?.('Select a Tatkal train below or from the dropdown before opening payment gateway.')}><Ticket size={18} />Book selected Tatkal train →</button>
          {bestTatkalTrain && <button className="btn-soft" onClick={() => { setTargetTrainCode(bestTatkalTrain.code); toast?.(`${bestTatkalTrain.service} selected as best Tatkal chance.`) }}><TrainFront size={16} /> Select best chance train</button>}
        </div>
      </div>

      <div className="grid gap-5">
        <TatkalEmergencyTimer classType={emergencyClass} />

        <div className="danger-glass rounded-3xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-black text-white">Available Tatkal trains</h3>
              <p className="mt-1 text-sm text-red-100/80">Select a train, then open the payment gateway demo. Final seat and fare must be verified on IRCTC/provider API.</p>
            </div>
            <span className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-black text-red-100">{trainServices.length} trains</span>
          </div>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
            {trainServices.map((item) => {
              const selected = targetTrainCode === item.code
              return (
                <article key={item.code} className={`rounded-2xl border p-4 text-sm ${selected ? 'border-emerald-300 bg-emerald-400/10' : 'border-red-300/20 bg-slate-950/60'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2"><SourceBadge label={item.sourceBadge || 'Verified static data'} /><SourceBadge label="Provider verification required" /></div>
                      <h4 className="font-black text-white">{item.service}</h4>
                      <p className="mt-1 text-xs text-slate-300">{item.from} → {item.to}</p>
                    </div>
                    <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">₹{item.fare}</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-red-50/90 sm:grid-cols-2">
                    <p><b>Depart:</b> {item.depart}</p>
                    <p><b>Arrive:</b> {item.arrive}</p>
                    <p><b>Reliability:</b> {item.reliability || 0}/100</p>
                    <p><b>Classes:</b> {(item.classes || []).join(', ')}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-100" onClick={() => setTargetTrainCode(item.code)}>{selected ? 'Selected train' : 'Select train'}</button>
                    <button className="rounded-xl border border-orange-300/30 bg-orange-400/10 px-3 py-2 text-xs font-black text-orange-100" onClick={() => { setTargetTrainCode(item.code); bookSelectedTrain(item) }}><Ticket className="mr-1 inline" size={14} />Book Tatkal</button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <ServiceOptionsBoard plan={urgentPlan} compact focusMode="trains" onBookService={onBookService} />
        <BackupPlan plan={urgentPlan} compact onBookBackup={onBookBackup} />
        <TrainRunningStatus plan={urgentPlan} toast={toast} />

        <div className="rounded-3xl border border-red-400/25 bg-red-500/10 p-5 text-sm text-red-50">
          <h3 className="text-lg font-black text-white">If Tatkal fails</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              'Try the best-chance train from the Tatkal list first.',
              'If the user wants train-only travel, split the journey into two train legs through a nearby junction.',
              'Use normal bus or flight backup only when the traveler allows mixed transport.',
              'Do not retry payment blindly; check bank/UPI status first.'
            ].map((step) => <div key={step} className="rounded-2xl border border-red-200/20 bg-slate-950/60 p-3 font-bold">{step}</div>)}
          </div>
        </div>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 text-sm text-yellow-100">
          <h3 className="text-lg font-black">Tatkal guidance</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {tatkalRules.filter((rule) => !rule.toLowerCase().includes('urgent flight') && !rule.toLowerCase().includes('urgent bus')).map((rule) => <li key={rule}>{rule}</li>)}
            <li>This is a booking-preparation demo. Real ticket issue needs authorized IRCTC/provider integration.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
