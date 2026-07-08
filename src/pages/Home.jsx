import { Link } from 'react-router-dom'
import { AlertTriangle, DatabaseZap, MapPinned, Mic, ShieldCheck, Ticket, TrainFront, WifiOff } from 'lucide-react'
import EmergencyToolkit from '../components/EmergencyToolkit'
import MasterTrustPanel from '../components/MasterTrustPanel'

const heroCards = [
  { title: 'Emergency SOS', text: 'Copy/share GPS alert, call 112, and open WhatsApp/SMS with user confirmation.', icon: ShieldCheck, to: '/safety', tone: 'border-red-400/25 bg-red-500/10 text-red-100' },
  { title: 'Tatkal Assistant', text: 'Train-only emergency mode with AC 10:00 AM and Non-AC 11:00 AM reminders.', icon: TrainFront, to: '/planner', tone: 'border-orange-400/25 bg-orange-500/10 text-orange-100' },
  { title: 'Offline Pack', text: 'Saved route, documents, emergency numbers and backup path stay available during no signal.', icon: WifiOff, to: '/saved', tone: 'border-lime-400/25 bg-lime-500/10 text-lime-100' },
  { title: 'Live API Checks', text: 'RapidAPI IRCTC for trains, Aviationstack for flights, bus fallback with provider labels.', icon: DatabaseZap, to: '/planner', tone: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-100' }
]

export default function Home({ labels, toast }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="badge border-red-400/30 bg-red-400/10 text-red-100"><AlertTriangle size={14} /> Emergency-first Indian travel copilot</span>
          <h1 className="section-title mt-6 text-white">
            TravelMate helps when <span className="bg-gradient-to-r from-red-400 to-orange-300 bg-clip-text text-transparent">travel fails</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A focused safety and journey assistant for Indian travelers: Tatkal preparation, live train/PNR checks, flight status lookup, offline route packs, document vault, and SOS actions with clear provider-verification labels.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/safety" className="btn-danger inline-flex items-center gap-2"><ShieldCheck size={18} />{labels.enterSafety}</Link>
            <Link to="/planner" className="btn-primary inline-flex items-center gap-2"><Ticket size={18} />Open Journey Planner</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="badge"><DatabaseZap size={14} /> Live/train API-ready</span>
            <span className="badge"><WifiOff size={14} /> Offline pack ready</span>
            <span className="badge"><Mic size={14} /> Voice search only</span>
          </div>
        </div>

        <div className="glass rounded-[2rem] p-5 shadow-glow">
          <div className="rounded-[1.5rem] border border-slate-700/70 bg-slate-950/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-cyan-200">Live project focus</p>
                <h2 className="text-2xl font-black text-white">Safety before booking</h2>
              </div>
              <span className="rounded-full bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950">GTmetrix A-ready</span>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                ['Train APIs', 'Live running status, PNR, station search, trains by station, seat availability.'],
                ['Flight API', 'Aviationstack status/schedule endpoint through backend environment variable.'],
                ['Bus data', 'Fallback/provider-required mode until SeatSeller/redBus partner access.'],
                ['Booking safety', 'Demo gateway only: no fake payment, no fake PNR, no fake confirmed ticket.']
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                  <h3 className="font-black text-white">{title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {heroCards.map(({ title, text, icon: Icon, to, tone }) => (
          <Link key={title} to={to} className={`rounded-3xl border p-5 transition hover:-translate-y-1 hover:shadow-glow ${tone}`}>
            <Icon size={24} />
            <h2 className="mt-4 text-xl font-black text-white">{title}</h2>
            <p className="mt-2 text-sm opacity-90">{text}</p>
          </Link>
        ))}
      </section>

      <section className="mt-10">
        <MasterTrustPanel />
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass rounded-3xl p-6">
          <h2 className="flex items-center gap-2 text-2xl font-black text-white"><MapPinned className="text-cyan-300" /> Demo story judges understand</h2>
          <p className="mt-3 text-slate-300">User saves a journey while online. During emergency or weak signal, TravelMate shows the saved route, Tatkal timing, emergency contact actions, documents, and provider-labeled transport choices instead of pretending every result is live.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="btn-primary" to="/planner">Try planner</Link>
            <Link className="btn-soft" to="/analyze">Analyze journey</Link>
          </div>
        </div>
        <EmergencyToolkit compact toast={toast} />
      </section>
    </main>
  )
}
