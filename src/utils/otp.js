const OTP_SESSION_PREFIX = 'saferoute-otp-session:'

function sessionKey(purpose = 'login', phone = '') {
  const normalizedPhone = normalizePhone(phone)
  return `${OTP_SESSION_PREFIX}${purpose}:${normalizedPhone || 'default'}`
}

function normalizePhone(phone = '') {
  return String(phone || '').replace(/\D/g, '').slice(-10)
}

function normalizeEmail(email = '') {
  return String(email || '').trim().toLowerCase()
}

function getEndpoint(name) {
  return import.meta.env?.[name] || ''
}

export async function sendOtpRequest({ phone, email, purpose = 'login' }) {
  const normalizedPhone = normalizePhone(phone)
  const normalizedEmail = normalizeEmail(email)
  const sendEndpoint = getEndpoint('VITE_OTP_SEND_ENDPOINT')

  if (!/^[0-9]{10}$/.test(normalizedPhone)) {
    throw new Error('Enter a valid 10-digit phone number before sending OTP.')
  }

  if (!sendEndpoint) {
    return {
      ok: false,
      mode: 'provider-required',
      message: 'Real OTP provider is not configured. Add VITE_OTP_SEND_ENDPOINT and VITE_OTP_VERIFY_ENDPOINT. No fake OTP was generated.'
    }
  }

  const response = await fetch(sendEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: normalizedPhone, email: normalizedEmail, purpose })
  })

  if (!response.ok) throw new Error('OTP provider failed')
  const data = await response.json().catch(() => ({}))
  const session = {
    phone: normalizedPhone,
    email: normalizedEmail,
    purpose,
    sessionId: data.sessionId || `${purpose}-${normalizedPhone}`,
    expiresAt: Date.now() + 10 * 60 * 1000
  }
  localStorage.setItem(sessionKey(purpose, normalizedPhone), JSON.stringify(session))
  return {
    ok: true,
    mode: 'real',
    sessionId: session.sessionId,
    message: data.message || 'Real OTP requested through configured backend/SMS/email provider.'
  }
}

export async function verifyOtpRequest({ phone, email, purpose = 'login', sessionId, code }) {
  const normalizedPhone = normalizePhone(phone)
  const normalizedEmail = normalizeEmail(email)
  const normalizedCode = String(code || '').trim()
  const verifyEndpoint = getEndpoint('VITE_OTP_VERIFY_ENDPOINT')

  if (!verifyEndpoint) {
    return { ok: false, message: 'Real OTP verification provider is not configured. No fake OTP verification is available.' }
  }

  const response = await fetch(verifyEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: normalizedPhone, email: normalizedEmail, purpose, sessionId, code: normalizedCode })
  })

  if (!response.ok) return { ok: false, message: 'OTP verification failed.' }
  const data = await response.json().catch(() => ({}))
  return { ok: data.ok !== false, message: data.message || 'OTP verified by backend provider.' }
}
