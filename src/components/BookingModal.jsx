import { useEffect, useMemo, useState } from 'react'
import { X, ExternalLink, Save, ShieldCheck, ClipboardCopy, ShoppingCart, Phone, LockKeyhole, CreditCard, CheckCircle2 } from 'lucide-react'
import { tatkalRules } from '../data/journeyData'
import { buildComboLegs, officialPortals, servicesForMode } from '../data/transportData'
import { savePlan } from '../utils/storage'
import { sendOtpRequest, verifyOtpRequest } from '../utils/otp'
import SourceBadge from './SourceBadge'


function availabilityPreview(service = {}, passengers = 1) {
  const reliability = Number(service.reliability || 60)
  const text = `${service.availability || ''} ${service.status || ''} ${service.code || ''}`.toLowerCase()
  const blocked = text.includes('not recommended') || text.includes('no-direct') || text.includes('unavailable') || text.includes('full')
  const seed = String(service.code || service.service || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  let available = blocked ? 0 : Math.max(0, Math.min(48, Math.round((reliability - 58) * 1.15 + (seed % 9))))
  let waitlist = available > 0 ? 0 : Math.max(1, Math.min(36, Math.round((62 - reliability) * 0.9 + (seed % 6))))
  if (available > 0 && Number(passengers || 1) > available) {
    waitlist = Number(passengers || 1) - available
    available = 0
  }
  const chance = available >= Number(passengers || 1) && reliability >= 78 ? 'High' : available >= Number(passengers || 1) ? 'Medium' : waitlist <= 6 ? 'Low-medium' : 'Low'
  return { available, waitlist, chance, readiness: reliability }
}


function tatkalReleaseStatus(classType = '') {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const isAc = /(ac|cc|ec|1a|2a|3a|3e)/i.test(classType)
  const start = isAc ? 10 * 60 : 11 * 60
  const end = start + 60
  return {
    open: minutes >= start && minutes <= end,
    label: isAc ? 'AC Tatkal' : 'Non-AC Tatkal',
    releaseTime: isAc ? '10:00 AM' : '11:00 AM',
    alarm5: isAc ? '9:55 AM' : '10:55 AM',
    alarm10: isAc ? '9:50 AM' : '10:50 AM'
  }
}

function getProfile() {
  try {
    return JSON.parse(localStorage.getItem('travelmate-user-profile')) || {}
  } catch {
    return {}
  }
}

export default function BookingModal({ open, onClose, plan = {}, mode = 'normal', onSaved }) {
  const [notice, setNotice] = useState('')
  const [flowOpen, setFlowOpen] = useState(false)
  const [bookingStep, setBookingStep] = useState('account')
  const [otpInfo, setOtpInfo] = useState(null)
  const [enteredOtp, setEnteredOtp] = useState('')
  const [account, setAccount] = useState(() => {
    const profile = getProfile()
    return {
      irctcUsername: profile.irctcUsername || '',
      phone: profile.phone || '',
      email: profile.email || '',
      passengerName: profile.name || '',
      paymentMethod: 'UPI'
    }
  })
  const [selectedService, setSelectedService] = useState(plan.selectedService || null)

  useEffect(() => {
    if (!open) return
    const profile = getProfile()
    setAccount((old) => ({
      ...old,
      irctcUsername: old.irctcUsername || profile.irctcUsername || '',
      phone: old.phone || profile.phone || '',
      email: old.email || profile.email || '',
      passengerName: old.passengerName || profile.name || ''
    }))
  }, [open])

  useEffect(() => {
    if (!open) return
    setSelectedService(plan.selectedService || null)
  }, [open, plan.selectedService])

  const transport = plan.transportMode || 'Train'
  const portal = officialPortals[transport] || officialPortals.Train
  const emergency = mode === 'emergency'
  const title = emergency
    ? 'Emergency Ticket Booking Demo'
    : mode === 'low-network'
      ? 'Low-Data Ticket Booking Demo'
      : `Book ${transport} Ticket`
  const legs = useMemo(() => buildComboLegs(plan.routeCombo || `${transport} only`, plan), [plan, transport])
  const routeServices = useMemo(() => servicesForMode(plan, transport), [plan, transport])
  const activeService = selectedService || plan.selectedService || null
  const activeServiceIsLive = /live api/i.test(activeService?.sourceBadge || '')
  const snapshotServices = activeServiceIsLive
    ? [activeService, ...routeServices.filter((item) => item.code !== activeService?.code)]
    : routeServices
  const tatkalStatus = tatkalReleaseStatus(plan.classType || '')
  const message = emergency
    ? 'Tatkal train booking preparation is open. Payment gateway is a demo preview; real ticket issue needs authorized IRCTC/provider integration.'
    : mode === 'low-network'
      ? 'Offline-friendly booking preparation. Complete real booking after official provider/API integration.'
      : 'Ticket options are prepared inside the app. This demo opens the booking form, OTP step and payment method preview. Final ticket issue needs authorized provider/license integration.'

  const providerPacket = useMemo(() => {
    return [
      'TravelMate provider-entry packet',
      `Passenger: ${account.passengerName || 'Not entered'}`,
      `IRCTC username: ${account.irctcUsername || 'Not entered'}`,
      `Phone: ${account.phone || 'Not entered'}`,
      `Email: ${account.email || 'Not entered'}`,
      `From: ${plan.from || 'Origin'}`,
      `To: ${plan.to || 'Destination'}`,
      `Date: ${plan.date || 'Select date'}`,
      `Transport: ${transport}`,
      `Route combo: ${plan.routeCombo || `${transport} only`}`,
      `Ticket type/quota: ${plan.ticketType || plan.quota || 'Normal'}`,
      `Class/cabin: ${plan.classType || 'Sleeper/Economy'}`,
      `Passengers: ${plan.passengers || 1}`,
      activeService ? `Exact selected ${transport}: ${activeService.service} (${activeService.code}) ${activeService.from} → ${activeService.to}, ${activeService.depart} → ${activeService.arrive}, ₹${activeService.fare}` : 'Exact selected service: Not selected',
      'Selected legs:',
      ...legs.map((leg) => `Leg ${leg.leg}: ${leg.mode} ${leg.service} (${leg.code}) ${leg.from} → ${leg.to}, ${leg.depart} → ${leg.arrive}, ₹${leg.fare}`)
    ].join('\n')
  }, [account, activeService, legs, plan, transport])

  if (!open) return null

  function handleSave() {
    const saved = savePlan({ ...plan, mode })
    onSaved?.(saved)
  }

  async function copyProviderPacket() {
    try {
      await navigator.clipboard.writeText(providerPacket)
      setNotice('Provider-entry packet copied. Paste these details into IRCTC/airline/bus portal. Full external-site auto-fill needs licensed provider API or browser extension permission.')
    } catch {
      setNotice('Clipboard permission was blocked. You can still manually copy the details shown in this modal.')
    }
  }

  function openPortal() {
    setNotice('Opening official portal. Direct auto-fill into IRCTC/airline/bus websites is locked until authorized integration; this app prepares and copies the details safely.')
    window.open(portal, '_blank', 'noopener,noreferrer')
  }

  function startInAppFlow(service = activeService) {
    if (service) setSelectedService(service)
    setFlowOpen(true)
    setBookingStep('account')
    const tatkalNote = emergency && transport === 'Train' && !tatkalStatus.open ? ` Tatkal tickets are not released right now. ${tatkalStatus.label} opens at ${tatkalStatus.releaseTime}; set an alarm for ${tatkalStatus.alarm5} or ${tatkalStatus.alarm10}.` : ''
    setNotice(`${service?.service ? service.service + ' selected. ' : ''}Payment gateway demo opened.${tatkalNote} Final payment and ticket issue are locked until license/API approval.`)
  }

  async function sendOtp() {
    if (!account.passengerName.trim() || !/^[0-9]{10}$/.test(account.phone.trim())) {
      setNotice('Enter passenger name and valid 10-digit phone number first.')
      return
    }
    if (transport === 'Train' && !account.irctcUsername.trim()) {
      setNotice('IRCTC username is required for train booking preparation.')
      return
    }
    try {
      const result = await sendOtpRequest({ phone: account.phone, email: account.email, purpose: 'booking-flow' })
      setOtpInfo(result)
      setEnteredOtp('')
      if (!result.ok) {
        setNotice(result.message)
        return
      }
      setBookingStep('otp')
      setNotice('Real OTP sent through configured provider.')
    } catch {
      setNotice('OTP provider failed. Check backend/SMS gateway configuration.')
    }
  }

  async function verifyOtp() {
    const result = await verifyOtpRequest({ phone: account.phone, email: account.email, purpose: 'booking-flow', sessionId: otpInfo?.sessionId, code: enteredOtp })
    if (!result.ok) {
      setNotice(result.message || 'Incorrect OTP.')
      return
    }
    setBookingStep('payment')
    setNotice(`${result.message} Payment methods are visible but final payment is locked until license integration.`)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="glass max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-5 shadow-glow">
        <div className="flex items-start justify-between gap-4 border-b border-slate-700/70 pb-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2"><SourceBadge label={plan.sourceBadge || plan.selectedService?.sourceBadge || 'Provider verification required'} /><span className="badge"><ShieldCheck size={14} /> Demo booking · no real ticket issue</span></div>
            <h2 className="text-2xl font-black text-white">{title}</h2>
            <p className="mt-2 text-sm text-slate-300">{message}</p>
          </div>
          <button className="btn-soft px-3" onClick={onClose} aria-label="Close booking modal"><X size={18} /></button>
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border border-slate-700/60 bg-slate-950/70 p-4 text-sm sm:grid-cols-2">
          <p><span className="text-slate-400">Route:</span> <b>{plan.from || 'Enter boarding'} → {plan.to || 'Enter destination'}</b></p>
          <p><span className="text-slate-400">Transport:</span> <b>{transport}</b></p>
          <p><span className="text-slate-400">Date:</span> <b>{plan.date || 'Select date'}</b></p>
          <p><span className="text-slate-400">Class/Cabin:</span> <b>{plan.classType || 'Sleeper'}</b></p>
          {transport === 'Flight' && <p><span className="text-slate-400">Airline:</span> <b>{plan.airline || 'Indigo'}</b></p>}
          <p><span className="text-slate-400">Passengers:</span> <b>{plan.passengers || 1}</b></p>
          <p><span className="text-slate-400">Source:</span> <b>{plan.sourceBadge || activeService?.sourceBadge || 'Static fallback / provider-required'}</b></p>
          {activeService && (() => { const a = availabilityPreview(activeService, plan.passengers); return <p><span className="text-slate-400">Availability:</span> <b>{a.available > 0 ? `${a.available} available` : `WL ${a.waitlist}`} · {a.chance} chance</b></p> })()}
        </div>

        <div className={`mt-4 rounded-2xl border p-4 text-sm ${activeServiceIsLive ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100' : 'border-yellow-400/25 bg-yellow-400/10 text-yellow-100'}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-black">Selected provider result</h3>
              <p className="mt-1 text-xs">
                {activeServiceIsLive
                  ? 'This ticket preview is based on a Live API result selected from the route board.'
                  : 'No live provider result is selected. The app will not show static train candidates here as live data.'}
              </p>
            </div>
            <SourceBadge label={activeServiceIsLive ? 'Live API result' : 'Provider verification required'} />
          </div>

          {activeServiceIsLive && activeService ? (
            <div className="mt-3 rounded-xl border border-emerald-300/30 bg-slate-950/70 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-white">{activeService.service || activeService.serviceName} <span className="text-cyan-100">({activeService.code || 'Provider'})</span></p>
                  <p className="mt-1 text-xs text-slate-300">{activeService.from || plan.from} → {activeService.to || plan.to}</p>
                </div>
                <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">{activeService.fare || activeService.price ? `₹${activeService.fare || activeService.price}` : 'Live'}</span>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                <p><b className="text-slate-100">Depart:</b> {activeService.depart || activeService.departure || 'Check provider'}</p>
                <p><b className="text-slate-100">Arrive:</b> {activeService.arrive || activeService.arrival || 'Check provider'}</p>
                <p><b className="text-slate-100">Duration:</b> {activeService.duration || 'Check provider'}</p>
                <p><b className="text-slate-100">Provider:</b> {activeService.provider || 'RapidAPI / provider API'}</p>
              </div>
              <p className="mt-2 text-xs text-yellow-100/80">{activeService.verification || activeService.status || 'Live provider row selected. Final seats, fare and ticket issue still require official provider verification.'}</p>
              <button className="mt-3 rounded-xl border border-orange-300/30 bg-orange-400/10 px-3 py-2 text-xs font-black text-orange-100 hover:bg-orange-400/20" onClick={() => startInAppFlow(activeService)}>
                <ShoppingCart className="mr-1 inline" size={14} />Open booking demo for live result
              </button>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-yellow-400/25 bg-slate-950/60 p-3">
              <p className="font-black text-white">Live result required</p>
              <p className="mt-1 text-xs text-yellow-100/90">Close this popup, click <b>Check Train API</b> or use the route board/live station tools, then open booking from a card marked <b>Live API result</b>. Static fallback options are hidden here so they are not mistaken for accurate live data.</p>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
            <h4 className="font-black text-white">Selected route legs</h4>
            <div className="mt-2 space-y-2">
              {legs.map((leg) => (
                <p key={`${leg.mode}-${leg.leg}`} className="rounded-xl bg-slate-950/70 p-3"><b>Leg {leg.leg} · {leg.mode}:</b> {leg.service} ({leg.code}) · {leg.depart} → {leg.arrive} · ₹{leg.fare}</p>
              ))}
            </div>
          </div>
        </div>

        {flowOpen && (
          <div className="mt-4 rounded-2xl border border-orange-400/30 bg-orange-400/10 p-4 text-sm text-orange-100">
            <h3 className="text-xl font-black text-white">Payment gateway demo</h3>
            <p className="mt-1">This opens after Book Ticket. It starts with passenger details, then OTP authorization, then payment-method preview. Final money debit, PNR, and ticket issue are disabled until official provider approval.</p>
            {emergency && transport === 'Train' && (
              <div className={`mt-3 rounded-xl border p-3 font-bold ${tatkalStatus.open ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-yellow-300/30 bg-yellow-400/10 text-yellow-100'}`}>
                {tatkalStatus.open ? `${tatkalStatus.label} booking window is open in this demo.` : `Tatkal tickets are not released right now. ${tatkalStatus.label} opens at ${tatkalStatus.releaseTime}. Suggested alarms: ${tatkalStatus.alarm5} or ${tatkalStatus.alarm10}.`}
              </div>
            )}
            {activeService && (() => { const a = availabilityPreview(activeService, plan.passengers); return <p className="mt-3 rounded-xl border border-yellow-300/20 bg-yellow-400/10 p-3 font-bold text-yellow-100">Local availability estimate: {a.available > 0 ? `${a.available} tickets available` : `waitlist WL ${a.waitlist}`}, booking chance {a.chance}. Verify live seats before payment.</p> })()}

            {bookingStep === 'account' && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="font-bold"><span className="mb-2 block">Passenger name</span><input className="input" value={account.passengerName} onChange={(e) => setAccount({ ...account, passengerName: e.target.value })} /></label>
                <label className="font-bold"><span className="mb-2 block">Phone number</span><input className="input" value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></label>
                <label className="font-bold"><span className="mb-2 block">Email</span><input className="input" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} /></label>
                {transport === 'Train' && <label className="font-bold"><span className="mb-2 block">IRCTC username</span><input className="input" value={account.irctcUsername} onChange={(e) => setAccount({ ...account, irctcUsername: e.target.value })} /></label>}
                <button className="btn-primary sm:col-span-2 inline-flex justify-center gap-2" onClick={sendOtp}><Phone size={18} /> Send OTP</button>
                <div className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                  <p className="font-black text-white">Payment demo options</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">{['UPI', 'Card', 'Net banking'].map((method) => <button key={method} className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 font-black text-cyan-100" onClick={() => setAccount({ ...account, paymentMethod: method })}>{method}</button>)}</div>
                  <p className="mt-2 text-xs text-yellow-100">Preview only: real payment and ticket issue need provider license/API.</p>
                </div>
              </div>
            )}

            {bookingStep === 'otp' && (
              <div className="mt-4 space-y-3">
                <p className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3 font-bold text-emerald-100">Real OTP provider active. Enter the OTP received on your phone/email.</p>
                <input className="input" value={enteredOtp} onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit OTP" />
                <div className="flex flex-wrap gap-3">
                  <button className="btn-primary inline-flex gap-2" onClick={verifyOtp}><LockKeyhole size={18} /> Verify OTP</button>
                  <button className="btn-soft" onClick={sendOtp}>Resend OTP</button>
                </div>
              </div>
            )}

            {bookingStep === 'payment' && (
              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm">
                  <p><b className="text-white">Selected ticket:</b> {activeService ? `${activeService.service} (${activeService.code})` : `${transport} option from local catalogue`}</p>
                  <p className="mt-1"><b className="text-white">Passenger:</b> {account.passengerName || 'Not entered'} · <b className="text-white">Phone:</b> {account.phone || 'Not entered'}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {['UPI', 'Card', 'Net banking'].map((method) => (
                    <button key={method} className={`rounded-2xl border p-4 text-left font-black ${account.paymentMethod === method ? 'border-emerald-300 bg-emerald-400/20 text-emerald-100' : 'border-slate-700 bg-slate-950/60 text-slate-200'}`} onClick={() => setAccount({ ...account, paymentMethod: method })}>
                      <CreditCard className="mb-2" />{method}
                    </button>
                  ))}
                </div>
                <button className="btn-primary inline-flex justify-center gap-2" onClick={sendOtp}><Phone size={18} /> Generate OTP for payment authorization</button>
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 font-bold text-red-100">
                  Demo gateway only: no real payment, no fake PNR, no confirmed ticket. Official provider/API approval is required for real checkout.
                </div>
                <button className="btn-soft inline-flex justify-center gap-2" onClick={copyProviderPacket}><ClipboardCopy size={18} /> Copy verified booking details</button>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100">
          <h3 className="font-black">Booking license note</h3>
          <p className="mt-1">Book Ticket opens a realistic demo flow. Final ticket issuance is disabled until licensed provider/API approval.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {tatkalRules.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
        </div>

        {notice && <p className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-100">{notice}</p>}

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-primary inline-flex items-center gap-2" onClick={handleSave}><Save size={18} />Save Plan</button>
          <button className="btn-danger inline-flex items-center gap-2" onClick={() => startInAppFlow()}><ShoppingCart size={18} />Book ticket</button>
          <button className="btn-soft inline-flex items-center gap-2" onClick={copyProviderPacket}><ClipboardCopy size={18} />Copy provider-entry details</button>
          <button className="btn-soft inline-flex items-center gap-2" onClick={openPortal}><ExternalLink size={18} />Open official portal</button>
          <button className="btn-soft" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
