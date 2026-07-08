import { Battery, PlugZap, Signal, WifiOff } from 'lucide-react'

export default function StatusBar({ status }) {
  const batteryText = status.batteryLevel === null ? 'Battery: --%' : `Battery: ${status.batteryLevel}%${status.charging ? ' · charging' : ''}`
  const connectionParts = []
  if (status.effectiveType && status.effectiveType !== 'unknown') connectionParts.push(status.effectiveType)
  if (status.downlink !== null) connectionParts.push(`${status.downlink} Mbps`)
  if (status.rtt !== null) connectionParts.push(`${status.rtt} ms`)
  const networkText = status.online ? `${connectionParts.join(' · ') || 'Online'}${status.saveData ? ' · Save data' : ''}` : 'Offline'
  const low = status.recommendedMode === 'low-network'

  return (
    <div className={`border-b px-4 py-2 text-xs ${low ? 'border-red-500/30 bg-red-950/45 text-red-100' : 'border-cyan-500/20 bg-slate-950/80 text-cyan-100'}`}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        <span className="badge"><Battery size={14} />{batteryText}</span>
        <span className="badge">{status.online ? <Signal size={14} /> : <WifiOff size={14} />}{networkText}</span>
        <span className="badge"><PlugZap size={14} />Mode: {status.online === false ? 'OFFLINE MODE' : status.recommendedMode === 'low-network' ? 'LOW SIGNAL' : 'NORMAL'}</span>
        {!status.supported.battery && <span className="text-slate-400">Battery number appears when the browser shares device battery.</span>}
        {!status.supported.network && <span className="text-slate-400">Signal accuracy depends on browser Network Information API support.</span>}
        {status.online === false && <span className="font-black text-red-100">Internet dead: offline mode only.</span>}
      </div>
    </div>
  )
}
