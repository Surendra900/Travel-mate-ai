import { Activity, Search, TicketCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getServiceOptions } from '../data/transportData'
import { getSeatAvailability } from '../services/LiveTransportApi'
import SourceBadge from '../components/SourceBadge'

const classMap = {
  'Sleeper (SL)': 'SL',
  'AC Chair Car (CC)': 'CC',
  'Executive Chair Car (EC)': 'EC',
  'AC 3 Tier (3A)': '3A',
  'AC 3 Economy (3E)': '3E',
  'AC 2 Tier (2A)': '2A',
  'First Class AC (1A)': '1A',
  'Second Sitting (2S)': '2S'
}

function extractTrainNo(value = '') {
  const match = String(value).match(/\b\d{5}\b/)
  return match?.[0] || ''
}

function station(value = '') {
  const match = String(value).match(/\(([A-Z]{2,5})\)/)
  if (match) return match[1]
  const clean = String(value).trim().toUpperCase()
  if (/^[A-Z]{2,5}$/.test(clean)) return clean
  return clean.slice(0, 5)
}

export default function SeatAvailabilityChecker({ plan, toast }) {
  const firstTrain = useMemo(() => getServiceOptions(plan).trains?.[0], [plan])
  const [trainNo, setTrainNo] = useState(extractTrainNo(firstTrain?.service || firstTrain?.code))
  const [fromStationCode, setFromStationCode] = useState(station(firstTrain?.from || plan.from || 'SC'))
  const [toStationCode, setToStationCode] = useState(station(firstTrain?.to || plan.to || 'NDLS'))
  const [classType, setClassType] = useState(classMap[plan.classType] || 'SL')
  const [quota, setQuota] = useState(plan.quota?.toLowerCase?.().includes('tatkal') ? 'TQ' : 'GN')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('idle')
  const [message, setMessage] = useState('Checks RapidAPI IRCTC seat availability through your backend route when configured.')
  const [result, setResult] = useState(null)

  function fillKnownWorkingExample() {
    setTrainNo('19038')
    setFromStationCode('ST')
    setToStationCode('BVI')
    setClassType('2A')
    setQuota('GN')
    setMessage('Example filled from your RapidAPI test: 19038 ST → BVI 2A GN. Click Check.')
  }

  async function checkSeats() {
    const cleanTrain = String(trainNo || '').replace(/\D/g, '')
    if (cleanTrain.length < 5 || !fromStationCode || !toStationCode) {
      setMode('invalid')
      setMessage('Enter train number, from station code and to station code.')
      toast?.('Train number and station codes are required for seat availability.')
      return
    }

    setLoading(true)
    const data = await getSeatAvailability({
      trainNo: cleanTrain,
      fromStationCode,
      toStationCode,
      classType,
      quota,
      date: ''
    })
    setLoading(false)
    setMode(data.mode || 'fallback')
    setMessage(data.message || 'Seat availability lookup completed.')
    setResult(data.result || null)
  }

  return (
    <div className="glass rounded-3xl p-5 md:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-cyan-200">Train seat availability</p>
          <h3 className="text-xl font-black text-white">Seat/WL checker</h3>
          <p className="mt-1 text-sm text-slate-400">Uses CheckSeatAvailability V2 via the backend. You must enter a valid train + exact source/destination station codes + class + quota.</p>
        </div>
        <SourceBadge label={mode === 'live' ? 'Live API result' : mode === 'idle' ? 'API-ready' : 'Provider verification required'} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_0.8fr_0.7fr_0.7fr_auto_auto]">
        <input className="input" value={trainNo} placeholder="Train no. e.g. 12723" onChange={(e) => setTrainNo(e.target.value.replace(/\D/g, '').slice(0, 5))} />
        <input className="input" value={fromStationCode} placeholder="From code e.g. SC" onChange={(e) => setFromStationCode(e.target.value.toUpperCase().slice(0, 5))} />
        <input className="input" value={toStationCode} placeholder="To code e.g. NDLS" onChange={(e) => setToStationCode(e.target.value.toUpperCase().slice(0, 5))} />
        <select className="input" value={classType} onChange={(e) => setClassType(e.target.value)}>
          {['SL', '3A', '2A', '1A', 'CC', 'EC', '2S', '3E'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="input" value={quota} onChange={(e) => setQuota(e.target.value)}>
          <option value="GN">GN</option>
          <option value="TQ">TQ</option>
          <option value="PT">PT</option>
          <option value="LD">LD</option>
        </select>
        <button className="btn-soft inline-flex items-center justify-center gap-2 whitespace-nowrap" type="button" onClick={fillKnownWorkingExample}>Fill test</button>
        <button className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap" onClick={checkSeats} disabled={loading}>
          {loading ? <Activity className="animate-spin" size={17} /> : <Search size={17} />}
          {loading ? 'Checking...' : 'Check'}
        </button>
      </div>

      <p className={`mt-3 rounded-xl border p-3 text-sm ${mode === 'live' ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-yellow-400/20 bg-yellow-400/10 text-yellow-100'}`}>{message}</p>

      {result && (
        <div className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 text-sm text-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-black text-white"><TicketCheck className="mr-2 inline text-cyan-300" size={18} />{result.trainNo || trainNo} · {result.fromStationCode} → {result.toStationCode}</p>
            <SourceBadge label={result.sourceBadge || (mode === 'live' ? 'Live API result' : 'Provider verification required')} />
          </div>
          <p className="mt-2"><b className="text-cyan-100">Class/quota/date:</b> {result.classType || classType} · {result.quota || quota} · {result.date || plan.date || 'Selected date'}</p>
          {Array.isArray(result.availability) && result.availability.length > 0 ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {result.availability.slice(0, 6).map((row, index) => (
                <p key={`${row.date}-${index}`} className="rounded-xl border border-slate-700 bg-slate-950/60 p-3"><b className="text-white">{row.date}</b><br />{row.status}</p>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 font-bold text-yellow-100">No seat rows returned. Verify on IRCTC/provider before payment.</p>
          )}
        </div>
      )}
    </div>
  )
}
