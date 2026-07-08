import { useState } from 'react'
import { Mail, Phone, ShieldCheck } from 'lucide-react'

export default function SignInPanel({ toast }) {
  const [method, setMethod] = useState('email')
  const [identifier, setIdentifier] = useState('')
  const [notice, setNotice] = useState('')

  function requestOtp() {
    if (!identifier.trim()) {
      setNotice('Enter email or mobile number first.')
      return
    }
    setNotice('Real OTP is provider-ready but not faked. Connect Firebase Auth, Twilio, or an email OTP provider to send a real code.')
    toast?.('No fake OTP generated. Connect a real OTP provider before production.')
  }

  return (
    <section className="mt-12 glass rounded-3xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-cyan-200">Account access</p>
          <h2 className="text-2xl font-black text-white">Sign in with email or mobile</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">This panel is prepared for real OTP login. It does not create fake OTPs. Add Firebase/Twilio/email OTP keys to enable real delivery.</p>
        </div>
        <span className="badge"><ShieldCheck size={14} /> No fake OTP</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-[0.35fr_1fr_auto]">
        <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="email">Email</option>
          <option value="mobile">Mobile</option>
        </select>
        <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={method === 'email' ? 'yourname@example.com' : '+91 mobile number'} />
        <button className="btn-primary inline-flex items-center justify-center gap-2" onClick={requestOtp}>{method === 'email' ? <Mail size={16} /> : <Phone size={16} />} Send real OTP</button>
      </div>
      {notice && <p className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-sm font-bold text-yellow-100">{notice}</p>}
    </section>
  )
}
