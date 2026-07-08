import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bus, Plane, RefreshCw, ShoppingCart, Train } from 'lucide-react'
import { getServiceOptions } from '../data/transportData'
import { searchLiveTransport } from '../services/LiveTransportApi'
import SourceBadge from './SourceBadge'

const modeInfo = {
  trains: { title: 'Train options', icon: Train, color: 'text-cyan-200', source: 'Verified static data' },
  flights: { title: 'Flight options', icon: Plane, color: 'text-orange-200', source: 'Verified static data' },
  buses: { title: 'Bus options', icon: Bus, color: 'text-lime-200', source: 'Fallback estimate' }
}

function normalizeLiveCard(item = {}, index = 0) {
  const fare = item.fare || item.price || item.amount || null
  const service = item.service || item.serviceName || item.trainName || item.flightNumber || item.name || 'Provider option'
  return {
    ...item,
    id: item.id || item.code || `${service}-${index}`,
    service,
    code: item.code || item.trainNo || item.trainNumber || item.flightNumber || 'Provider',
    from: item.from || item.source || 'Origin',
    to: item.to || item.destination || 'Destination',
    depart: item.depart || item.departure || item.departureTime || 'Check provider',
    arrive: item.arrive || item.arrival || item.arrivalTime || 'Check provider',
    duration: item.duration || item.travelTime || 'Check provider',
    fare: fare || 'Live',
    reliability: item.reliability || 90,
    classes: item.classes || item.cabins || item.availableClasses || item.available_classes || [],
    status: item.status || item.verification || 'Live provider result. Verify seats/fare before payment.',
    sourceBadge: item.sourceBadge || 'Live API result',
    note: item.note || item.verification || 'Returned by provider API for this route.'
  }
}

function ServiceCard({ item, compact = false, onBookService, modeLabel = 'option', source = 'Verified static data' }) {
  const [showComingSoon, setShowComingSoon] = useState(false)
  const warningText = `${item.availability || ''} ${item.status || ''} ${item.code || ''}`.toLowerCase()
  const notPractical = warningText.includes('no-direct') || warningText.includes('not recommended') || warningText.includes('unavailable') || Number(item.reliability || 100) < 55
  const needsProvider = modeLabel === 'bus' || /check|refresh|provider|portal|fallback|snapshot/i.test(`${item.availability || ''} ${item.status || ''}`)
  const badge = item.sourceBadge || item.source || source
  const isLive = /live api/i.test(badge)

  return (
    <article className={`rounded-2xl border p-4 ${isLive ? 'border-emerald-300/40 bg-emerald-400/10' : 'border-slate-700/70 bg-slate-950/70'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <SourceBadge label={badge} />
            {needsProvider && <SourceBadge label="Provider verification required" />}
          </div>
          <h4 className="text-base font-black text-white">{item.service}</h4>
          <p className="mt-1 text-xs text-slate-500">Service no/code: {item.code} · {item.status}</p>
        </div>
        <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950">{typeof item.fare === 'number' || /^\d+$/.test(String(item.fare)) ? `₹${item.fare}` : item.fare}</span>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
        <p><b className="text-slate-100">From:</b> {item.from}</p>
        <p><b className="text-slate-100">To:</b> {item.to}</p>
        <p><b className="text-slate-100">Depart:</b> {item.depart}</p>
        <p><b className="text-slate-100">Arrive:</b> {item.arrive}</p>
        <p><b className="text-slate-100">Duration:</b> {item.duration}</p>
        <p><b className="text-slate-100">Reliability:</b> {item.reliability}/100</p>
      </div>
      {notPractical && (
        <p className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-xs font-black text-red-100">This {modeLabel} may not be possible/practical for this route because availability or reliability is weak. Use the backup suggestion below.</p>
      )}
      {!compact && (
        <>
          <p className="mt-2 text-sm text-slate-400">Available cabins/classes: {(item.classes || []).join(', ') || 'Check provider'}</p>
          <p className="mt-2 text-sm text-cyan-100/80">{item.note}</p>
        </>
      )}
      <p className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-xs font-bold text-yellow-100">
        Source note: {badge}. Final fare, platform/gate, live seat status and ticket issue require official provider verification.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/20" onClick={() => onBookService ? onBookService(item) : setShowComingSoon(true)}>
          <ShoppingCart className="mr-1 inline" size={14} />{isLive ? 'Book live result' : 'Open fallback demo'}
        </button>
        <span className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs font-black text-yellow-100">{isLive ? 'Live provider row selected · verify before payment' : 'Fallback only · not live data'}</span>
      </div>
      {showComingSoon && (
        <p className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-xs font-bold text-yellow-100">
          Book Ticket opens a demo booking interface with OTP/payment preview. Final ticket issue still needs provider approval. No fake PNR or fake confirmed ticket is shown.
        </p>
      )}
    </article>
  )
}

function useLiveRouteResults(plan, focusMode) {
  const [state, setState] = useState({ loading: false, checked: false, mode: 'idle', message: '', results: [] })
  const routeKey = `${focusMode}|${plan.transportMode}|${plan.from}|${plan.to}|${plan.date}|${plan.passengers}`

  useEffect(() => {
    const shouldCheckTrain = focusMode === 'trains' && plan.transportMode === 'Train'
    const shouldCheckFlight = focusMode === 'flights' && plan.transportMode === 'Flight'
    if (!shouldCheckTrain && !shouldCheckFlight) {
      setState({ loading: false, checked: false, mode: 'idle', message: '', results: [] })
      return
    }
    if (!String(plan.from || '').trim() || !String(plan.to || '').trim()) {
      setState({ loading: false, checked: false, mode: 'idle', message: 'Enter From and To to check live provider data.', results: [] })
      return
    }

    let cancelled = false
    setState((old) => ({ ...old, loading: true, checked: true, message: 'Checking live provider API...', results: [] }))
    searchLiveTransport({
      transport: plan.transportMode,
      from: plan.from,
      to: plan.to,
      date: plan.date,
      adults: plan.passengers || 1
    }).then((data) => {
      if (cancelled) return
      const results = Array.isArray(data.results) ? data.results.map(normalizeLiveCard) : []
      setState({
        loading: false,
        checked: true,
        mode: data.mode || (results.length ? 'live' : 'fallback'),
        message: data.message || (results.length ? 'Live provider rows loaded.' : 'No live rows returned.'),
        sourceBadge: data.sourceBadge || (results.length ? 'Live API result' : 'Fallback estimate'),
        results
      })
    }).catch((error) => {
      if (cancelled) return
      setState({ loading: false, checked: true, mode: 'fallback', sourceBadge: 'Fallback estimate', message: error.message || 'Provider API failed.', results: [] })
    })

    return () => { cancelled = true }
  }, [routeKey])

  return state
}

export default function ServiceOptionsBoard({ plan, compact = false, focusMode = 'all', onBookService }) {
  const options = getServiceOptions(plan)
  const [showFallback, setShowFallback] = useState(false)
  const visibleModeInfo = focusMode === 'all' ? null : modeInfo[focusMode]
  const liveState = useLiveRouteResults(plan, focusMode)
  const liveModeActive = focusMode === 'trains' || focusMode === 'flights'
  const boardTitle = visibleModeInfo ? `${visibleModeInfo.title} for this route` : 'Train, flight and bus options for this route'
  const boardNote = liveModeActive
    ? `This board checks the ${plan.transportMode} provider API first. Local demo options stay hidden unless no live rows are returned.`
    : visibleModeInfo
      ? `Only ${focusMode.replace('s', '')} results are shown because ${plan.transportMode || 'this transport'} is selected.`
      : 'Shows services currently present in the local route dataset. Live seats, fares, platforms, gates, PNR, and booking need official provider APIs.'

  const groups = useMemo(() => {
    const baseGroups = [
      ['trains', options.trains],
      ['flights', options.flights],
      ['buses', options.buses]
    ].filter(([key]) => focusMode === 'all' || key === focusMode)

    if (!liveModeActive) return baseGroups
    return baseGroups.map(([key, services]) => {
      if ((key === 'trains' || key === 'flights') && liveState.results.length > 0) {
        return [key, liveState.results]
      }
      if ((key === 'trains' || key === 'flights') && !showFallback) {
        return [key, []]
      }
      return [key, services]
    })
  }, [focusMode, liveModeActive, liveState.results, options, showFallback])

  return (
    <section className={`glass rounded-3xl p-5 ${compact ? 'text-sm' : ''}`} aria-labelledby="service-options-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-cyan-200">Source-labeled route board</p>
          <h3 id="service-options-title" className="text-2xl font-black text-white">{boardTitle}</h3>
          <p className="mt-1 text-sm text-slate-400">{boardNote}</p>
        </div>
        <span className="badge"><RefreshCw size={14} /> Verify official source before booking</span>
      </div>

      {liveModeActive ? (
        <div className={`mt-4 rounded-2xl border p-3 text-xs font-bold ${liveState.results.length ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-yellow-400/20 bg-yellow-400/10 text-yellow-100'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{liveState.loading ? 'Checking live provider API...' : liveState.message || 'Live provider check ready.'}</span>
            <SourceBadge label={liveState.results.length ? 'Live API result' : liveState.sourceBadge || 'Fallback estimate'} />
          </div>
          {!liveState.loading && liveState.results.length === 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2"><AlertTriangle size={14} /> No live provider rows are being shown for this route. The old demo candidates are hidden so they are not mistaken for accurate data.</span>
              <button type="button" className="rounded-xl border border-yellow-300/30 bg-yellow-300/10 px-3 py-2 font-black text-yellow-100" onClick={() => setShowFallback((value) => !value)}>
                {showFallback ? 'Hide static demo options' : 'Show static demo fallback'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-xs font-bold text-yellow-100">{options.notice}</p>
      )}

      <div className="mt-5 grid gap-5">
        {groups.map(([key, services]) => {
          const Info = modeInfo[key]
          const Icon = Info.icon
          const countLabel = liveModeActive && (key === 'trains' || key === 'flights') && liveState.results.length ? `${services.length} live` : services.length
          return (
            <div key={key}>
              <h4 className={`mb-3 flex items-center gap-2 text-lg font-black ${Info.color}`}><Icon size={20} />{Info.title} · {countLabel}</h4>
              <div className="grid gap-3 lg:grid-cols-2">
                {services.length === 0 ? (
                  <p className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm font-bold text-red-100">
                    {liveModeActive
                      ? `No live ${key} returned for this route yet. Check your API key, station/city codes, provider quota, and endpoint limits. Use the dedicated live station/PNR/status tools for direct checks.`
                      : `No ${key} found in the verified/local dataset for this route. Use the backup suggestion and verify official provider availability.`}
                  </p>
                ) : services.map((item, index) => <ServiceCard key={`${key}-${item.id || item.code || index}`} item={item} compact={compact} source={item.sourceBadge || Info.source} modeLabel={key === 'trains' ? 'train' : key === 'flights' ? 'flight' : 'bus'} onBookService={(service) => onBookService?.(service, key)} />)}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
