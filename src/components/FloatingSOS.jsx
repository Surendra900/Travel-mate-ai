import { Battery, PhoneCall, Siren, WifiOff } from 'lucide-react'

export default function FloatingSOS({ status }) {
  const batteryText = status?.batteryLevel === null || status?.batteryLevel === undefined
    ? 'Battery: --%'
    : `Battery: ${status.batteryLevel}%${status.charging ? ' charging' : ''}`

  return (
    <div className="fixed bottom-3 right-3 z-[70] flex max-w-[calc(100vw-1rem)] flex-col items-end gap-2 sm:bottom-5 sm:right-5">
      <div className="rounded-2xl border border-cyan-300/20 bg-slate-950/90 px-3 py-2 text-xs font-bold text-cyan-100 shadow-glow backdrop-blur">
        <div className="flex items-center gap-2"><Battery size={14} /> {batteryText}</div>
        {status?.online === false && <div className="mt-1 flex items-center gap-2 text-red-100"><WifiOff size={14} /> Offline / low-network active</div>}
      </div>
      <a
        href="tel:112"
        aria-label="Call emergency number 112 now"
        className="group inline-flex min-h-[58px] items-center gap-3 rounded-full border border-red-200/40 bg-red-600 px-5 py-4 font-black text-white shadow-danger transition hover:scale-[1.03] hover:bg-red-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300/60"
        onClick={() => {
          try {
            localStorage.setItem('travelmate-last-sos-click', new Date().toISOString())
          } catch {}
        }}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"><Siren size={22} /></span>
        <span className="leading-tight">
          <span className="block text-base">SOS</span>
          <span className="flex items-center gap-1 text-xs text-red-50/90"><PhoneCall size={13} /> Call 112</span>
        </span>
      </a>
    </div>
  )
}
