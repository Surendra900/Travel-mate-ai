import { useMemo, useState } from 'react'
import { Activity, Search, TrainFront } from 'lucide-react'
import { getServiceOptions } from '../data/transportData'
import { getTrainRunningStatus } from '../services/LiveTransportApi'

const fallbackRows = {
  '20805': { trainNumber: '20805', trainName: 'AP EXPRESS', currentStation: 'Warangal section', status: 'Running on local demo timeline', delay: '0 min', platform: 'Check NTES', updated: 'Local fallback' },
  '12723': { trainNumber: '12723', trainName: 'TELANGANA EXPRESS', currentStation: 'Nagpur section', status: 'On time in local demo', delay: '0 min', platform: 'PF check required', updated: 'Local fallback' },
  '12721': { trainNumber: '12721', trainName: 'DAKSHIN EXPRESS', currentStation: 'Kazipet section', status: '18 min late in local demo', delay: '18 min', platform: 'PF check required', updated: 'Local fallback' },
  '19038': { trainNumber: '19038', trainName: 'AVADH EXPRESS', currentStation: 'Provider sample train', status: 'Use live API for current location', delay: 'Check API', platform: 'Check provider', updated: 'Local fallback' }
}

function extractTrainNumber(service = '') {
  const match = String(service).match(/\b\d{5}\b/)
  return match?.[0] || ''
}

function localFallback(trainNumber) {
  const clean = String(trainNumber || '').replace(/\D/g, '')
  return fallbackRows[clean] || {
    trainNumber: clean,
    trainName: 'Train status fallback',
    currentStation: 'Local fallback board',
    status: clean.length >= 5 ? 'Format accepted. Add RAPIDAPI_KEY in Vercel for live status.' : 'Enter a 5-digit train number.',
    delay: 'Unknown',
    platform: 'Check official NTES / station board',
    updated: 'Local fallback'
  }
}

export default function TrainRunningStatus({ plan, toast }) {
  const firstTrain = useMemo(() => getServiceOptions(plan).trains?.[0], [plan])
  const defaultNumber = extractTrainNumber(firstTrain?.service || firstTrain?.code)
  const [trainNumber, setTrainNumber] = useState(defaultNumber)
  const [startDay, setStartDay] = useState('0')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(() => localFallback(defaultNumber))
  const [mode, setMode] = useState('local-fallback')
  const [message, setMessage] = useState('RapidAPI IRCTC live-status route is ready. Add RAPIDAPI_KEY in Vercel, then check a train number.')

  async function checkStatus() {
    const clean = String(trainNumber || '').replace(/\D/g, '')
    if (clean.length < 5) {
      setStatus(localFallback(clean))
      setMode('invalid')
      setMessage('Enter a valid 5-digit train number.')
      toast?.('Enter a valid train number first.')
      return
    }

    setLoading(true)
    const data = await getTrainRunningStatus({ trainNumber: clean, startDay })
    setLoading(false)

    if (data?.result) {
      setStatus(data.result)
      setMode(data.mode || 'fallback')
      setMessage(data.message || 'Train status loaded.')
    } else {
      setStatus(localFallback(clean))
      setMode('local-fallback')
      setMessage('Showing local fallback. Live running status needs RapidAPI configuration in Vercel.')
    }
  }

  return (
    <div className="glass rounded-3xl p-5 md:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-cyan-200">Train running status</p>
          <h3 className="text-xl font-black text-white">Live location / delay checker</h3>
        </div>
        <TrainFront className="text-cyan-300" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_0.7fr_auto]">
        <input
          className="input"
          value={trainNumber}
          placeholder="Enter train no. e.g. 19038"
          onChange={(e) => setTrainNumber(e.target.value.replace(/\D/g, '').slice(0, 5))}
        />
        <select className="input" value={startDay} onChange={(e) => setStartDay(e.target.value)} title="Use 0 if the train started today; 1 if it started yesterday; 2 if it started two days ago.">
          <option value="0">Started today</option>
          <option value="1">Started yesterday</option>
          <option value="2">Started 2 days ago</option>
          <option value="3">Started 3 days ago</option>
        </select>
        <button className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap" onClick={checkStatus} disabled={loading}>
          {loading ? <Activity className="animate-spin" size={17} /> : <Search size={17} />}
          {loading ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <b className="text-white">{status.trainName || status.trainNumber || 'Train'} {status.trainNumber ? `(${status.trainNumber})` : ''}</b>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${mode === 'live' ? 'bg-emerald-300 text-slate-950' : 'bg-yellow-300/15 text-yellow-100'}`}>{mode === 'live' ? 'Live API result' : 'Working fallback'}</span>
        </div>
        <p className="mt-2 text-slate-300"><b className="text-cyan-100">Current/live location:</b> {status.currentStation || status.current_location || 'Check official provider'}</p>
        <p className="mt-1 text-slate-300"><b className="text-cyan-100">Status:</b> {status.status || status.running_status || 'Unavailable'}</p>
        <p className="mt-1 text-slate-300"><b className="text-cyan-100">Delay:</b> {status.delay || status.late_by || 'Unknown'} · <b className="text-cyan-100">Platform:</b> {status.platform || 'Check station board'}</p>
        <p className="mt-1 text-slate-300"><b className="text-cyan-100">Updated:</b> {status.updated || 'Provider timestamp not returned'}</p>
        <p className="mt-2 text-xs text-slate-500">{message}</p>
      </div>
    </div>
  )
}
