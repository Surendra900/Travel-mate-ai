import { useMemo, useState } from 'react'
import { Copy, MapPin, MessageCircle, Phone, Send, ShieldAlert, UserPlus, WifiOff } from 'lucide-react'
import { saveOfflinePack, getOfflinePack } from '../utils/storage'
import { warmOfflineCache } from '../utils/offlineMode'

const CONTACT_KEY = 'travelmate-emergency-contacts'

function getContacts() {
  try {
    return JSON.parse(localStorage.getItem(CONTACT_KEY)) || []
  } catch {
    return []
  }
}

function saveContacts(contacts) {
  localStorage.setItem(CONTACT_KEY, JSON.stringify(contacts.slice(0, 8)))
}

function normalizeIndianPhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  return digits
}

function getProfileEmergencyContact() {
  try {
    const profile = JSON.parse(localStorage.getItem('travelmate-user-profile'))
    if (profile?.emergencyContact) {
      return [{ id: 'profile-emergency', name: 'Profile emergency contact', phone: profile.emergencyContact, relation: 'Saved profile' }]
    }
  } catch {}
  return []
}

export default function EmergencyToolkit({ toast, compact = false }) {
  const [contacts, setContacts] = useState(() => {
    const saved = getContacts()
    const profileContact = getProfileEmergencyContact()
    const merged = [...profileContact, ...saved]
    return merged.filter((item, index, list) => list.findIndex((x) => x.phone === item.phone) === index)
  })
  const [contact, setContact] = useState({ name: '', phone: '', relation: 'Family' })
  const [locationText, setLocationText] = useState('Location not captured yet')
  const [emergencyType, setEmergencyType] = useState('General emergency')
  const [offlinePack, setOfflinePack] = useState(() => getOfflinePack())

  const effectiveLocation = locationText
  const alertMessage = useMemo(() => (
    `EMERGENCY ALERT\nType: ${emergencyType}\nLocation: ${effectiveLocation}\nEmergency number India: 112\nSaved contacts: ${contacts.map((item) => `${item.name} (${item.phone})`).join(', ') || 'None saved'}\nPlease call me and help me reach official emergency support.`
  ), [emergencyType, effectiveLocation, contacts])

  async function copy(text, label = 'Copied') {
    try {
      await navigator.clipboard.writeText(text)
      toast?.(label)
    } catch {
      toast?.('Copy failed. Long press and copy manually.')
    }
  }

  function captureLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const message = 'GPS unsupported. Ask nearby official/help desk for landmark and share by call.'
        setLocationText(message)
        toast?.('GPS unsupported. Location text prepared.')
        resolve(message)
        return
      }
      navigator.geolocation.getCurrentPosition((pos) => {
        const link = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
        setLocationText(link)
        resolve(link)
      }, () => {
        const fallback = 'Location permission denied. Share nearest landmark by call/SMS manually.'
        setLocationText(fallback)
        toast?.('Location permission denied. Alert still copied.')
        resolve(fallback)
      }, { enableHighAccuracy: true, timeout: 9000 })
    })
  }

  async function getLocation() {
    const loc = await captureLocation()
    copy(loc, 'Location captured and copied.')
  }

  async function shareWhatsAppContacts() {
    const loc = await captureLocation()
    const message = `EMERGENCY ALERT
Type: ${emergencyType}
Location: ${loc}
Please call me and help me reach official emergency support.`
    const targets = contacts.filter((item) => normalizeIndianPhone(item.phone))
    if (targets.length === 0) {
      toast?.('Save at least one emergency contact first.')
      return
    }
    try { await navigator.clipboard.writeText(message) } catch {}
    targets.slice(0, 5).forEach((item, index) => {
      const url = `https://wa.me/${normalizeIndianPhone(item.phone)}?text=${encodeURIComponent(message)}`
      window.setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), index * 250)
    })
    toast?.('Opening WhatsApp alerts for saved contacts. Browser may ask/limit multiple tabs; alert is copied for manual send.')
  }

  async function handleCall112() {
    const loc = await captureLocation()
    const message = `EMERGENCY ALERT\nType: ${emergencyType}\nLocation: ${loc}\nEmergency number India: 112\nPlease help me reach official emergency support.`
    try {
      await navigator.clipboard.writeText(message)
    } catch {}

    if (navigator.share) {
      try {
        await navigator.share({ title: 'TravelMate emergency alert', text: message })
        toast?.('Emergency alert shared. Opening 112 dialer now.')
      } catch {
        toast?.('Opening 112 dialer. Alert copied for manual sharing.')
      }
    } else {
      toast?.('Opening 112 dialer. Alert copied for manual sharing.')
    }

    window.location.href = 'tel:112'
  }

  async function prepareOffline() {
    const pack = saveOfflinePack()
    setOfflinePack(pack)
    const result = await warmOfflineCache()
    if (result.ok) toast?.(`Offline emergency pack ready: ${result.saved} files cached.`)
    else toast?.('Emergency offline pack saved. Browser cache support may be limited.')
  }

  function addContact() {
    if (!contact.name.trim() || !contact.phone.trim()) {
      toast?.('Enter contact name and phone number.')
      return
    }
    const savedOnly = contacts.filter((item) => item.id !== 'profile-emergency')
    const nextSaved = [{ ...contact, id: Date.now() }, ...savedOnly].slice(0, 8)
    saveContacts(nextSaved)
    const profileContact = getProfileEmergencyContact()
    const next = [...profileContact, ...nextSaved]
    setContacts(next)
    setContact({ name: '', phone: '', relation: 'Family' })
    toast?.('Emergency contact saved on this device.')
  }

  function removeContact(id) {
    if (id === 'profile-emergency') {
      toast?.('Edit profile setup to change this contact.')
      return
    }
    const nextSaved = contacts.filter((item) => item.id !== id && item.id !== 'profile-emergency')
    saveContacts(nextSaved)
    const next = [...getProfileEmergencyContact(), ...nextSaved]
    setContacts(next)
  }

  return (
    <section className={`${compact ? '' : 'mt-10'} danger-glass rounded-3xl p-5 shadow-danger`} aria-label="SOS Emergency Alert">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="badge border-red-400/30 bg-red-500/20 text-red-100"><ShieldAlert size={14} /> SOS Emergency Alert</p>
          <h2 className="mt-3 text-3xl font-black text-white">One tap crisis panel</h2>
          <p className="mt-2 max-w-3xl text-sm text-red-100/85">Call 112, capture location, copy/share an emergency message, contact saved people and prepare the offline pack from one place.</p>
          <p className="mt-2 max-w-3xl text-xs text-yellow-100/90">Browser safety rule: websites cannot silently send your GPS to 112 or phone contacts. This button captures/copies/shares the alert with your permission, then opens the emergency dialer.</p>
        </div>
        <button className="btn-danger inline-flex items-center gap-2 text-lg" onClick={handleCall112}><Phone size={20} /> Call 112 now</button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-4">
          <div className="rounded-2xl border border-red-300/30 bg-red-950/50 p-4">
            <label className="text-sm font-black text-red-100">Emergency type</label>
            <select className="input mt-2" value={emergencyType} onChange={(e) => setEmergencyType(e.target.value)}>
              {['General emergency', 'Lost passport', 'Medical emergency', 'Robbery or theft', 'Unsafe location', 'Urgent travel escape'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <p className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-xs font-bold text-yellow-100">Location is captured only through browser GPS permission. If GPS is blocked, call/SMS will still open with an instruction to share the nearest landmark manually.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <button className="btn-primary inline-flex items-center justify-center gap-2" onClick={getLocation}><MapPin size={16} /> Get location</button>
              <button className="btn-soft inline-flex items-center justify-center gap-2" onClick={() => copy(alertMessage, 'Emergency message copied.')}><Copy size={16} /> Copy alert</button>
              <a className="btn-soft inline-flex items-center justify-center gap-2" href={`https://wa.me/?text=${encodeURIComponent(alertMessage)}`} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>
              <button className="btn-soft inline-flex items-center justify-center gap-2" onClick={shareWhatsAppContacts}><Send size={16} /> WhatsApp saved</button>
            </div>
            <p className="mt-3 rounded-xl border border-red-200/20 bg-slate-950/50 p-3 text-xs text-red-50 break-all"><b>Captured GPS/message:</b> {effectiveLocation}</p>
          </div>

          <div className="rounded-2xl border border-lime-300/30 bg-lime-400/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-200">Offline emergency pack</p>
            <h3 className="mt-1 text-2xl font-black text-white">{offlinePack ? 'Prepared on this device' : 'Not prepared yet'}</h3>
            <p className="mt-2 text-sm text-lime-100/85">Stores important emergency points, saved route snapshots, transport details and offline document access for dead-network situations.</p>
            <button className="btn-low mt-4 inline-flex items-center gap-2" onClick={prepareOffline}><WifiOff size={18} /> Prepare offline</button>
            {offlinePack?.generatedAt && <p className="mt-3 text-xs font-bold text-lime-100">Last prepared: {new Date(offlinePack.generatedAt).toLocaleString()}</p>}
            {offlinePack?.savedDocuments?.length > 0 && (
              <div className="mt-4 rounded-2xl border border-lime-300/20 bg-slate-950/60 p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-200">Important documents available offline</p>
                <div className="mt-2 grid gap-2">
                  {offlinePack.savedDocuments.slice(0, 5).map((doc) => (
                    <p key={doc.id || doc.name} className="rounded-xl bg-slate-900/80 p-2 text-xs text-lime-50">{doc.category || 'Document'} · {doc.name}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-400/25 bg-slate-950/60 p-4">
          <h3 className="text-2xl font-black text-white">Emergency contact vault</h3>
          <p className="mt-1 text-xs text-cyan-100">Local-only. Saves key contacts for fast call/copy/share during crisis.</p>
          <div className="mt-4 grid gap-3">
            <input className="input" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Contact name" />
            <input className="input" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="Phone number" />
            <select className="input" value={contact.relation} onChange={(e) => setContact({ ...contact, relation: e.target.value })}>
              {['Family', 'Friend', 'Doctor', 'Insurance', 'University/Company', 'Travel coordinator'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <button className="btn-primary inline-flex items-center justify-center gap-2" onClick={addContact}><UserPlus size={18} /> Save contact</button>
          </div>
          <div className="mt-4 space-y-3">
            {contacts.length === 0 && <p className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300">No emergency contacts saved yet.</p>}
            {contacts.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.relation} · {item.phone}</p>
                  </div>
                  <button className="text-xs text-red-200" onClick={() => removeContact(item.id)}>Remove</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a className="rounded-lg bg-red-500 px-3 py-1 text-xs font-black text-white" href={`tel:${item.phone}`}>Call</a>
                  <button className="rounded-lg border border-cyan-400/30 px-3 py-1 text-xs font-bold text-cyan-100" onClick={() => copy(`${item.name}: ${item.phone}`, 'Contact copied')}>Copy</button>
                  <a className="rounded-lg border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-100" href={`sms:${item.phone}?body=${encodeURIComponent(alertMessage)}`}><Send size={12} className="mr-1 inline" />SMS alert</a>
                  <a className="rounded-lg border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-100" target="_blank" rel="noreferrer" href={`https://wa.me/${normalizeIndianPhone(item.phone)}?text=${encodeURIComponent(alertMessage)}`}>WhatsApp</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
