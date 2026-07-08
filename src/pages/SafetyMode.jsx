import { useState } from 'react'
import { Copy, MapPin, Phone, Share2, Siren } from 'lucide-react'
import EmergencyCard from '../components/EmergencyCard'
import DocumentVault from '../components/DocumentVault'
import EmergencyToolkit from '../components/EmergencyToolkit'
import { emergencyCards, emergencyNumber } from '../data/emergencyData'

export default function SafetyMode({ toast }) {
  const [sosOpen, setSosOpen] = useState(false)

  async function copy(text) {
    await navigator.clipboard.writeText(text)
    toast(`Copied: ${text}`)
  }

  async function shareLocation() {
    if (!navigator.geolocation) {
      toast('Location API unsupported. Copy your nearest landmark manually.')
      return
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const text = `Emergency location: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
      await navigator.clipboard.writeText(text)
      toast('Location link copied.')
    }, () => toast('Location permission denied. Share nearest landmark instead.'))
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="text-center">
        <span className="badge border-red-400/30 bg-red-400/10 text-red-100"><Siren size={14} /> Current Location: India · Emergency Number: 112</span>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-6xl">Safety Mode</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">Fast crisis actions. No long articles. Open a situation, read important points, call/copy emergency numbers and keep proof.</p>
        <button className="btn-danger mt-7 inline-flex items-center gap-2 shadow-danger" onClick={() => setSosOpen(true)}><Siren size={20} /> SOS - Send Emergency Alert</button>
      </section>

      <EmergencyToolkit toast={toast} />

      <section className="card-grid mt-10">
        {emergencyCards.map((item) => <EmergencyCard key={item.id} item={item} />)}
      </section>

      <DocumentVault toast={toast} />

      {sosOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="danger-glass w-full max-w-xl rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="badge border-red-400/30 bg-red-400/10 text-red-100"><Siren size={14} /> SOS panel</p>
                <h2 className="mt-3 text-2xl font-black text-white">Emergency Alert</h2>
                <p className="mt-2 text-sm text-red-100/85">Use only for urgent risk. Call first if life or safety is in danger.</p>
              </div>
              <button className="btn-soft" onClick={() => setSosOpen(false)}>Close</button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a className="btn-danger inline-flex items-center justify-center gap-2" href={`tel:${emergencyNumber.primary}`}><Phone size={18} />Call 112</a>
              <button className="btn-soft inline-flex items-center justify-center gap-2" onClick={() => copy(emergencyNumber.primary)}><Copy size={18} />Copy Number</button>
              <button className="btn-primary inline-flex items-center justify-center gap-2" onClick={shareLocation}><MapPin size={18} />Share Location</button>
              <button className="btn-soft inline-flex items-center justify-center gap-2" onClick={() => copy('I am in an emergency. Please call me and track my location.')}><Share2 size={18} />Copy Alert Text</button>
            </div>
            <div className="mt-5 rounded-2xl border border-red-200/20 bg-slate-950/60 p-4">
              <h3 className="font-black text-white">Important SOS points</h3>
              <div className="mt-3 grid gap-2 text-sm text-red-50">
                {['Call emergency number or nearby official help.', 'Move to a safer public place if possible.', 'Share location with trusted emergency contact.', 'Keep phone battery/network for calls only.', 'Save evidence: photos, report number, bills or screenshots.'].map((step) => <p key={step} className="rounded-xl bg-slate-900/80 p-3">{step}</p>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
