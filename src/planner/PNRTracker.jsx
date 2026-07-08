import { Activity, Search } from 'lucide-react'
import { useState } from 'react'
import { getPNRStatus } from '../services/LiveTransportApi'

export default function PNRTracker() {
  const [pnr, setPnr] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('idle')
  const [message, setMessage] = useState('Enter a 10-digit PNR. The app calls RapidAPI from a secure serverless route when configured.')
  const [result, setResult] = useState(null)
  const valid = /^\d{10}$/.test(pnr.trim())

  async function checkPnr() {
    if (!valid) {
      setMode('invalid')
      setResult(null)
      setMessage('Enter a valid 10-digit PNR number.')
      return
    }
    setLoading(true)
    const data = await getPNRStatus({ pnr })
    setLoading(false)
    setMode(data.mode || 'fallback')
    setMessage(data.message || 'PNR lookup completed.')
    setResult(data.result || null)
  }

  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <Search className="text-cyan-300" />
        <span className={`rounded-full px-3 py-1 text-xs font-black ${mode === 'live' ? 'bg-emerald-300 text-slate-950' : 'border border-yellow-400/30 bg-yellow-400/10 text-yellow-100'}`}>
          {mode === 'live' ? 'Live PNR API' : mode === 'idle' ? 'API-ready' : 'Provider verification'}
        </span>
      </div>
      <h3 className="mt-3 text-xl font-black text-white">PNR Tracker</h3>
      <p className="mt-1 text-sm text-slate-400">Uses the RapidAPI IRCTC PNR endpoint through your backend. No API key is exposed in React.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className="input"
          placeholder="Enter 10-digit PNR"
          value={pnr}
          maxLength={10}
          inputMode="numeric"
          onChange={(e) => setPnr(e.target.value.replace(/\D/g, '').slice(0, 10))}
        />
        <button className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap" onClick={checkPnr} disabled={loading}>
          {loading ? <Activity className="animate-spin" size={17} /> : <Search size={17} />}
          {loading ? 'Checking...' : 'Check PNR'}
        </button>
      </div>
      <p className={`mt-3 rounded-xl border p-3 text-sm ${mode === 'live' ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : valid ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100' : 'border-slate-700 bg-slate-950/60 text-slate-400'}`}>{message}</p>

      {result && (
        <div className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 text-sm text-slate-300">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <b className="text-white">{result.trainName}</b>
              <p className="mt-1 text-xs text-slate-500">PNR {result.pnrNumber} · Train {result.trainNumber}</p>
            </div>
            <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950">{result.sourceBadge || (mode === 'live' ? 'Live API result' : 'Fallback')}</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p><b className="text-cyan-100">From:</b> {result.from}</p>
            <p><b className="text-cyan-100">To:</b> {result.to}</p>
            <p><b className="text-cyan-100">Journey:</b> {result.journeyDate}</p>
            <p><b className="text-cyan-100">Chart:</b> {String(result.chartStatus)}</p>
            <p><b className="text-cyan-100">Booking:</b> {result.bookingStatus || 'Check passenger rows'}</p>
            <p><b className="text-cyan-100">Current:</b> {result.currentStatus || 'Check passenger rows'}</p>
          </div>
          {result.passengers?.length > 0 && (
            <div className="mt-3 space-y-2">
              {result.passengers.map((pax) => (
                <p key={pax.serial} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs">
                  <b>Passenger {pax.serial}:</b> booking {pax.bookingStatus} → current {pax.currentStatus}{pax.coach ? ` · Coach ${pax.coach}` : ''}{pax.berth ? ` · Berth ${pax.berth}` : ''}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
