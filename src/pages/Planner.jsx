import { useEffect, useMemo, useState } from 'react'
import BookingModal from '../components/BookingModal'
import NormalPlanner from '../planner/NormalPlanner'
import EmergencyTatkalPlanner from '../planner/EmergencyTatkalPlanner'
import LowNetworkPlanner from '../planner/LowNetworkPlanner'
import { consumeLoadedPlan } from '../utils/storage'
import { calculateTravelScore } from '../utils/scoring'
import AICopilotChat from '../components/AICopilotChat'
import MasterTrustPanel from '../components/MasterTrustPanel'
import SourceBadge from '../components/SourceBadge'
import { searchLiveTransport } from '../services/LiveTransportApi'

const basePlan = {
  from: '',
  to: '',
  transportMode: 'Train',
  routeCombo: 'Train only',
  airline: 'Indigo',
  date: new Date().toISOString().slice(0, 10),
  ticketType: 'Normal',
  quota: 'Normal',
  classType: 'Sleeper (SL)',
  passengers: 1,
  budget: 1500,
  urgency: 'Normal',
  readinessScore: 0
}

export default function Planner({ status, toast }) {
  const [manualMode, setManualMode] = useState('normal')
  const [plan, setPlan] = useState(basePlan)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingPlan, setBookingPlan] = useState(null)
  const [liveResults, setLiveResults] = useState([])
  const [liveStatus, setLiveStatus] = useState({ loading: false, mode: 'idle', message: '' })

  useEffect(() => {
    const loaded = consumeLoadedPlan()
    if (loaded) {
      setPlan((old) => ({ ...old, ...loaded }))
      if (loaded.mode) setManualMode(loaded.mode)
      toast('Loaded saved plan into planner.')
    }

    try {
      const pending = JSON.parse(localStorage.getItem('travelmate-pending-voice-command'))
      if (pending) {
        localStorage.removeItem('travelmate-pending-voice-command')
        if (pending.mode) setManualMode(pending.mode)
        if (pending.plan) setPlan((old) => ({ ...old, ...pending.plan }))
        toast('Voice command applied after opening planner.')
      }
    } catch {
      localStorage.removeItem('travelmate-pending-voice-command')
    }
  }, [toast])

  useEffect(() => {
    function handleVoiceUpdate(event) {
      const detail = event.detail || {}
      if (detail.mode) setManualMode(detail.mode)
      if (detail.openBooking) setBookingOpen(true)
      if (detail.plan) {
        setPlan((old) => ({ ...old, ...detail.plan }))
        toast('Voice command applied to planner.')
      }
    }

    window.addEventListener('travelmate:voice-planner', handleVoiceUpdate)
    return () => window.removeEventListener('travelmate:voice-planner', handleVoiceUpdate)
  }, [toast])

  const forcedOffline = status.online === false
  const forcedLowSignal = status.recommendedMode === 'low-network'
  const mode = (forcedOffline || forcedLowSignal) ? 'low-network' : manualMode
  const enrichedPlan = useMemo(() => ({
    ...plan,
    mode,
    readinessScore: plan.readinessScore || 0,
    travelScore: calculateTravelScore({ ...plan, mode })
  }), [plan, mode])

  function update(fields) {
    setPlan((old) => ({ ...old, ...fields }))
  }

  function routeReady(nextPlan = enrichedPlan) {
    return Boolean(String(nextPlan.from || '').trim() && String(nextPlan.to || '').trim())
  }

  function openBooking(nextPlan = enrichedPlan) {
    if (!routeReady(nextPlan)) {
      toast('Enter From and To before opening ticket booking.')
      return
    }
    setBookingPlan(nextPlan)
    setBookingOpen(true)
  }

  function openBackupBooking(combo, leg = null) {
    if (!routeReady()) {
      toast('Enter From and To before booking a backup leg.')
      return
    }
    const transportFromLeg = leg?.mode || enrichedPlan.transportMode
    setBookingPlan({
      ...enrichedPlan,
      transportMode: transportFromLeg,
      routeCombo: combo?.label || enrichedPlan.routeCombo,
      selectedBackup: combo,
      selectedService: leg ? { ...leg, service: leg.service, code: leg.code } : undefined,
      selectedProvider: leg ? `Backup leg ${leg.leg}` : 'Local backup recommendation'
    })
    setBookingOpen(true)
  }

  function openServiceBooking(service, groupKey) {
    if (!routeReady()) {
      toast('Enter From and To before booking a ticket.')
      return
    }
    const transportFromGroup = groupKey === 'flights' ? 'Flight' : groupKey === 'buses' ? 'Bus' : 'Train'
    setBookingPlan({
      ...enrichedPlan,
      transportMode: transportFromGroup,
      routeCombo: `${transportFromGroup} only`,
      selectedService: service,
      selectedServiceCode: service?.code,
      selectedServiceName: service?.service || service?.serviceName,
      liveVerification: service?.verification,
      sourceBadge: service?.sourceBadge
    })
    setBookingOpen(true)
  }

  async function handleLiveSearch() {
    const transport = enrichedPlan.transportMode || 'Train'
    const from = enrichedPlan.from || ''
    const to = enrichedPlan.to || ''

    if (!from.trim() || !to.trim()) {
      toast('Enter From and To first.')
      return
    }

    setLiveStatus({ loading: true, mode: 'checking', message: `Checking ${transport} provider endpoint...` })
    const data = await searchLiveTransport({
      transport,
      from,
      to,
      date: enrichedPlan.date,
      adults: enrichedPlan.passengers || 1
    })
    setLiveResults(Array.isArray(data.results) ? data.results : [])
    setLiveStatus({
      loading: false,
      mode: data.mode || (data.ok ? 'ready' : 'fallback'),
      message: data.message || `${transport} provider checked.`,
      sourceBadge: data.sourceBadge
    })
  }

  function openLiveResultBooking(item) {
    setBookingPlan({
      ...enrichedPlan,
      selectedService: item,
      selectedServiceCode: item.code,
      selectedServiceName: item.serviceName || item.service,
      selectedProvider: item.provider,
      liveVerification: item.verification,
      sourceBadge: item.sourceBadge || (liveStatus.mode === 'live' ? 'Live API result' : 'Fallback estimate')
    })
    setBookingOpen(true)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="badge">Network mode: {(forcedOffline || forcedLowSignal) ? 'low signal/offline → low-network' : 'online'}</span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">Journey Planner</h1>
          <p className="mt-2 max-w-3xl text-slate-300">Plan train, flight and bus journeys with live provider checks where available. Every result is labeled as live, verified, fallback, or provider-required.</p>
        </div>
        <div className="glass rounded-2xl p-2">
          {[
            ['normal', 'Normal tickets'],
            ['emergency', 'Tatkal emergency'],
            ['low-network', 'Low Signal']
          ].map(([value, label]) => {
            const active = manualMode === value
            const emergencyTab = value === 'emergency'
            return (
              <button
                key={value}
                className={`rounded-xl px-3 py-2 text-sm font-bold ${
                  active
                    ? emergencyTab ? 'bg-red-500 text-white shadow-danger' : 'bg-cyan-400 text-slate-950'
                    : emergencyTab ? 'border border-red-400/40 bg-red-500/10 text-red-100 hover:bg-red-500/20' : 'text-slate-300 hover:bg-slate-800'
                }`}
                onClick={() => !(forcedOffline || forcedLowSignal) && setManualMode(value)}
                disabled={(forcedOffline || forcedLowSignal) && value !== 'low-network'}
              >
                {(forcedOffline || forcedLowSignal) && value === 'low-network' ? 'Low Signal Mode Active' : label}
              </button>
            )
          })}
        </div>
      </section>

      {(forcedOffline || forcedLowSignal) && (
        <div className="mt-6 rounded-3xl border border-red-400/30 bg-red-500/10 p-5 text-red-50">
          <h2 className="text-xl font-black">Automatic Offline Shift Enabled</h2>
          <p className="mt-2 text-sm text-red-100/90">Internet is unavailable/too weak, so Normal and Emergency live panels are locked. The planner is now using compact offline fields, saved route snapshots, emergency data, and localStorage only.</p>
        </div>
      )}

      <div className="mt-8">
        <MasterTrustPanel compact />
      </div>

      <section className="mt-8">
        {mode === 'emergency' ? (
          <EmergencyTatkalPlanner plan={enrichedPlan} update={update} onBook={() => openBooking()} onBookService={openServiceBooking} onBookBackup={openBackupBooking} toast={toast} />
        ) : mode === 'low-network' ? (
          <LowNetworkPlanner plan={enrichedPlan} update={update} onBook={() => openBooking()} onBookService={openServiceBooking} toast={toast} status={status} />
        ) : (
          <NormalPlanner plan={enrichedPlan} update={update} onBook={() => openBooking()} onBookService={openServiceBooking} onBookBackup={openBackupBooking} toast={toast} />
        )}
      </section>

      <section className="mt-8 glass rounded-3xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-cyan-200">Live API / fallback status</p>
            <h2 className="text-2xl font-black text-white">{enrichedPlan.transportMode} provider check</h2>
            <p className="mt-1 text-sm text-slate-400">Train uses RapidAPI IRCTC. Flight uses Aviationstack. Bus remains verified fallback unless partner API is added.</p>
          </div>
          <button className="btn-primary" onClick={handleLiveSearch} disabled={liveStatus.loading}>
            {liveStatus.loading ? 'Checking API...' : `Check ${enrichedPlan.transportMode} API`}
          </button>
        </div>
        <div className={`mt-4 rounded-2xl border p-3 text-sm font-bold ${liveStatus.mode === 'live' ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-yellow-400/20 bg-yellow-400/10 text-yellow-100'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{liveStatus.mode === 'idle' ? 'Provider not checked yet. Local catalogue is active.' : liveStatus.message}</span>
            <SourceBadge label={liveStatus.sourceBadge || (liveStatus.mode === 'live' ? 'Live API result' : liveStatus.mode === 'idle' ? 'API-ready' : 'Fallback estimate')} />
          </div>
        </div>
        {liveResults.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {liveResults.map((item, index) => (
              <article key={item.id || item.code || index} className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 text-sm text-slate-300">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2"><SourceBadge label={item.sourceBadge || (liveStatus.mode === 'live' ? 'Live API result' : 'Fallback estimate')} /><SourceBadge label="Provider verification required" /></div>
                    <h3 className="font-black text-white">{item.serviceName || item.service || `${enrichedPlan.transportMode} option`}</h3>
                    <p className="mt-1 text-xs text-slate-500">{item.code || 'N/A'} · {item.provider || 'Provider'}</p>
                  </div>
                  <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950">{item.price ? `₹${item.price}` : item.mode === 'live' ? 'Live' : 'API-ready'}</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <p><b className="text-cyan-100">From:</b> {item.from}</p>
                  <p><b className="text-cyan-100">To:</b> {item.to}</p>
                  <p><b className="text-cyan-100">Departure:</b> {item.departure || item.depart || 'Check provider'}</p>
                  <p><b className="text-cyan-100">Arrival:</b> {item.arrival || item.arrive || 'Check provider'}</p>
                </div>
                <p className="mt-3 text-xs text-yellow-100/85">{item.verification || 'Provider verification required before booking.'}</p>
                <button className="btn-soft mt-4" onClick={() => openLiveResultBooking(item)}>Book ticket</button>
              </article>
            ))}
          </div>
        )}
      </section>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} plan={bookingPlan || enrichedPlan} mode={mode} onSaved={() => toast('Plan saved. Open Saved Plans to see plan quality score.')} />
      <AICopilotChat plan={enrichedPlan} update={update} setManualMode={setManualMode} toast={toast} />
    </main>
  )
}
