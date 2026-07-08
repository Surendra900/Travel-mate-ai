import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Mail, Phone, UserRound } from 'lucide-react'
import { sendOtpRequest, verifyOtpRequest } from '../utils/otp'

const PROFILE_KEY = 'travelmate-user-profile'

export function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null
  } catch {
    return null
  }
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, verifiedAt: new Date().toISOString() }))
}

export default function OnboardingModal({ toast, forceOpen = false, onClose }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState('profile')
  const [profile, setProfile] = useState({ name: '', phone: '', email: '', irctcUsername: '', emergencyContact: '' })
  const [otpInfo, setOtpInfo] = useState(null)
  const [enteredOtp, setEnteredOtp] = useState('')

  useEffect(() => {
    // Clerk now handles real account sign-in. Keep this local profile panel optional
    // so it does not block the mobile UI on first load.
    if (forceOpen) setOpen(true)
  }, [forceOpen])

  const validProfile = useMemo(() => (
    profile.name.trim().length >= 2 &&
    /^[0-9]{10}$/.test(profile.phone.trim()) &&
    /.+@.+\..+/.test(profile.email.trim())
  ), [profile])

  async function startVerification() {
    if (!validProfile) {
      toast?.('Enter name, valid 10-digit phone and valid email first.')
      return
    }
    try {
      const result = await sendOtpRequest({ phone: profile.phone, email: profile.email, purpose: 'first-time-login' })
      setOtpInfo(result)
      setEnteredOtp('')
      if (!result.ok) {
        toast?.(result.message)
        return
      }
      setStep('otp')
      toast?.('Real OTP sent through configured provider.')
    } catch {
      toast?.('OTP provider failed. Check backend/SMS gateway configuration.')
    }
  }

  async function verifyOtp() {
    const result = await verifyOtpRequest({ phone: profile.phone, email: profile.email, purpose: 'first-time-login', sessionId: otpInfo?.sessionId, code: enteredOtp })
    if (!result.ok) {
      toast?.(result.message || 'Incorrect OTP.')
      return
    }
    saveProfile(profile)
    window.dispatchEvent(new Event('travelmate:profile-updated'))
    setStep('done')
    toast?.('Account profile saved on this device.')
    window.setTimeout(() => { setOpen(false); onClose?.() }, 900)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] grid place-items-start bg-slate-950/85 p-3 pt-4 backdrop-blur-md sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Create TravelMate account">
      <div className="glass max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-3xl p-4 pb-8 shadow-glow sm:max-h-[92vh] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="badge border-cyan-300/30 bg-cyan-300/10 text-cyan-100"><UserRound size={14} /> First-time setup</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">Create your TravelMate profile</h2>
            <p className="mt-2 text-sm text-slate-300">This local demo profile prepares emergency alerts, saved plans and train booking details. OTP requires a real backend/SMS/email gateway.</p>
          </div>
          <button className="btn-soft shrink-0 px-3" onClick={() => { setOpen(false); onClose?.() }} aria-label="Skip setup">Skip</button>
        </div>

        {step === 'profile' && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-cyan-100"><span className="mb-2 block">Full name</span><input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" /></label>
            <label className="text-sm font-bold text-cyan-100"><span className="mb-2 block">Phone number</span><input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit mobile" /></label>
            <label className="text-sm font-bold text-cyan-100"><span className="mb-2 block">Email</span><input className="input" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="you@example.com" /></label>
            <label className="text-sm font-bold text-cyan-100"><span className="mb-2 block">IRCTC username <span className="text-slate-400">(for train booking prep)</span></span><input className="input" value={profile.irctcUsername} onChange={(e) => setProfile({ ...profile, irctcUsername: e.target.value })} placeholder="Optional but useful" /></label>
            <label className="text-sm font-bold text-cyan-100 sm:col-span-2"><span className="mb-2 block">Emergency contact phone <span className="text-slate-400">(optional)</span></span><input className="input" value={profile.emergencyContact} onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="Family/friend number" /></label>
            <div className="sm:col-span-2 rounded-2xl border border-yellow-400/25 bg-yellow-400/10 p-4 text-sm text-yellow-100">
              <b>OTP note:</b> real OTP works only after connecting a backend SMS/email provider. Without provider endpoints, the app will not generate a fake OTP.
            </div>
            <button className="btn-primary sm:col-span-2 inline-flex justify-center gap-2" onClick={startVerification}><Phone size={18} /> Send OTP</button>
          </div>
        )}

        {step === 'otp' && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-4 text-cyan-100">
              <p className="font-black">OTP sent to {profile.phone} / {profile.email}</p>
              <p className="mt-1 text-sm">Real OTP provider active. Enter the OTP received on your phone/email.</p>
            </div>
            <label className="text-sm font-bold text-cyan-100"><span className="mb-2 block">Enter OTP</span><input className="input" value={enteredOtp} onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit OTP" /></label>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary inline-flex items-center gap-2" onClick={verifyOtp}><CheckCircle2 size={18} /> Verify & continue</button>
              <button className="btn-soft inline-flex items-center gap-2" onClick={startVerification}><Mail size={18} /> Resend OTP</button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5 text-emerald-100">
            <CheckCircle2 className="mb-3" />
            <h3 className="text-xl font-black text-white">Profile ready</h3>
            <p className="mt-1 text-sm">Your local profile is ready for emergency alerts, saved plans and booking preparation.</p>
          </div>
        )}
      </div>
    </div>
  )
}
