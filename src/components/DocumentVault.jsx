import { useEffect, useState } from 'react'
import { AlertTriangle, Eye, FileText, LockKeyhole, Trash2, UploadCloud } from 'lucide-react'
import { clearDocuments, deleteDocument, getDocuments, saveDocument, saveOfflinePack, updateDocument } from '../utils/storage'

const categories = ['Passport', 'Visa', 'Aadhaar / ID', 'Ticket', 'Insurance', 'Hotel Proof', 'Emergency Contact', 'Other']
const VAULT_HASH_KEY = 'travelmate-document-vault-password-hash'

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function hashPassword(password) {
  const text = `travelmate-vault:${password}`
  if (window.crypto?.subtle) {
    const buffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  return btoa(text)
}

export default function DocumentVault({ toast }) {
  const [docs, setDocs] = useState([])
  const [category, setCategory] = useState('Passport')
  const [note, setNote] = useState('')
  const [documentLabel, setDocumentLabel] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [oldLock, setOldLock] = useState('')
  const [newLock, setNewLock] = useState('')
  const [newLockConfirm, setNewLockConfirm] = useState('')
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetLock, setResetLock] = useState('')
  const [resetLockConfirm, setResetLockConfirm] = useState('')

  useEffect(() => {
    setHasPassword(Boolean(localStorage.getItem(VAULT_HASH_KEY)))
  }, [])

  useEffect(() => {
    if (unlocked) setDocs(getDocuments())
  }, [unlocked])

  function clearMessages() {
    setError('')
    setSuccess('')
  }

  async function createPassword() {
    clearMessages()
    if (password.length < 4) {
      setError('Use at least 4 characters for the vault lock.')
      return
    }
    if (password !== confirmPassword) {
      setError('New lock and confirm lock do not match.')
      return
    }
    localStorage.setItem(VAULT_HASH_KEY, await hashPassword(password))
    setHasPassword(true)
    setUnlocked(true)
    setPassword('')
    setConfirmPassword('')
    setResetMode(false)
    setResetConfirm(false)
    setSuccess('Vault lock created on this device.')
    toast?.('Document vault lock created on this device.')
  }

  async function unlockVault() {
    clearMessages()
    const stored = localStorage.getItem(VAULT_HASH_KEY)
    if (!stored || stored !== await hashPassword(password)) {
      setError('Wrong vault lock. Try again or reset the vault if the lock is forgotten.')
      return
    }
    setUnlocked(true)
    setPassword('')
    setSuccess('Document vault unlocked.')
    toast?.('Document vault unlocked.')
  }

  async function changeLock() {
    clearMessages()
    const stored = localStorage.getItem(VAULT_HASH_KEY)
    if (!stored || stored !== await hashPassword(oldLock)) {
      setError('Old lock is incorrect. Lock was not changed.')
      return
    }
    if (newLock.length < 4) {
      setError('New lock must be at least 4 characters.')
      return
    }
    if (oldLock === newLock) {
      setError('New lock must be different from old lock.')
      return
    }
    if (newLock !== newLockConfirm) {
      setError('New lock and confirm new lock do not match.')
      return
    }
    localStorage.setItem(VAULT_HASH_KEY, await hashPassword(newLock))
    setOldLock('')
    setNewLock('')
    setNewLockConfirm('')
    setSuccess('Vault lock updated successfully.')
    toast?.('Document vault lock changed on this device.')
  }

  async function resetForgottenLock() {
    clearMessages()
    if (!resetMode) {
      setResetMode(true)
      setResetConfirm(false)
      setError('Forgot lock reset started. Warning: creating a new lock here will delete all documents saved on this device.')
      return
    }
    if (resetLock.length < 4) {
      setError('New reset lock must be at least 4 characters.')
      return
    }
    if (resetLock !== resetLockConfirm) {
      setError('New reset lock and confirm reset lock do not match.')
      return
    }
    if (!resetConfirm) {
      setResetConfirm(true)
      setError('Final warning: this will delete all local vault documents and create a fresh lock. Click Create new lock after reset again to confirm.')
      return
    }
    clearDocuments()
    saveOfflinePack()
    localStorage.setItem(VAULT_HASH_KEY, await hashPassword(resetLock))
    setDocs([])
    setHasPassword(true)
    setUnlocked(true)
    setPassword('')
    setConfirmPassword('')
    setResetLock('')
    setResetLockConfirm('')
    setResetMode(false)
    setResetConfirm(false)
    setSuccess('Vault reset. Old documents were deleted. A new lock is created on this device.')
    toast?.('Vault reset. Old local documents deleted and new lock created.')
  }

  function extensionFromFile(file) {
    const match = file.name.match(/\.[A-Za-z0-9]+$/)
    return match ? match[0] : file.type?.includes('pdf') ? '.pdf' : file.type?.includes('image') ? '.jpg' : ''
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const maxSize = 4 * 1024 * 1024
    if (file.size > maxSize) {
      toast?.('File too large for demo vault. Keep it below 4 MB.')
      event.target.value = ''
      return
    }

    const dataUrl = await toBase64(file)
    try {
      const safeLabel = (documentLabel.trim() || category).replace(/[\\/:*?"<>|]+/g, '-').trim() || 'Important document'
      const saved = saveDocument({
        name: `${safeLabel}${extensionFromFile(file)}`,
        originalName: file.name,
        type: file.type || 'unknown',
        size: file.size,
        category: safeLabel,
        note,
        dataUrl
      })
      setDocs((old) => [saved, ...old].slice(0, 20))
      saveOfflinePack()
      setNote('')
      setDocumentLabel('')
      event.target.value = ''
      toast?.('Document saved locally and added to the offline pack.')
    } catch {
      toast?.('Storage full. Use a smaller file or delete older documents.')
    }
  }

  function remove(id) {
    const updated = deleteDocument(id)
    setDocs(updated)
    saveOfflinePack()
    toast?.('Document removed from local vault and offline pack.')
  }

  function renameDocument(doc) {
    const next = window.prompt('Enter document display name/category for offline pack:', doc.category || doc.name)
    if (!next || !next.trim()) return
    const safeLabel = next.trim().replace(/[\\/:*?"<>|]+/g, '-')
    const ext = doc.name.match(/\.[A-Za-z0-9]+$/)?.[0] || ''
    const updated = updateDocument(doc.id, { category: safeLabel, name: `${safeLabel}${ext}` })
    setDocs(updated)
    saveOfflinePack()
    toast?.('Document name/category updated and offline pack refreshed.')
  }

  if (!unlocked) {
    return (
      <section className="mt-8 glass rounded-3xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="badge"><LockKeyhole size={14} /> Password protected document vault</span>
            <h2 className="mt-3 text-2xl font-black text-white">Safety Mode Important Documents</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              {hasPassword
                ? 'Enter your vault lock to view documents saved on this device. If the lock is forgotten, the vault can be reset, but all local documents will be deleted.'
                : 'Create a new lock and confirm it before opening the local document vault. Documents saved here are included in the offline pack on this same device.'}
            </p>
          </div>
          <span className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-100">Local-only · offline-ready on this device</span>
        </div>

        <div className="mt-5 grid gap-4 rounded-2xl border border-slate-700/70 bg-slate-950/60 p-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-cyan-100">
            <span className="mb-2 block">{hasPassword ? 'Enter lock' : 'Create new lock'}</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={hasPassword ? 'Enter lock' : 'New lock password'} />
          </label>
          {!hasPassword && (
            <label className="text-sm font-bold text-cyan-100">
              <span className="mb-2 block">Confirm lock</span>
              <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm lock" />
            </label>
          )}
          {error && <p className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm font-bold text-red-100 sm:col-span-2">{error}</p>}
          {success && <p className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm font-bold text-emerald-100 sm:col-span-2">{success}</p>}
          <button className="btn-primary inline-flex items-center justify-center gap-2 sm:col-span-2" onClick={hasPassword ? unlockVault : createPassword}>
            <Eye size={18} /> {hasPassword ? 'Unlock document vault' : 'Create lock and unlock'}
          </button>
          {hasPassword && (
            <div className="sm:col-span-2 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
              <div className="flex items-start gap-2"><AlertTriangle size={18} className="mt-0.5 shrink-0" /><p><b>Forgot lock?</b> Resetting lets you create a new lock, but all documents saved on this device will be deleted for safety.</p></div>
              {resetMode && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="font-bold"><span className="mb-2 block">New lock after reset</span><input className="input" type="password" value={resetLock} onChange={(e) => { setResetConfirm(false); setResetLock(e.target.value) }} placeholder="New lock" /></label>
                  <label className="font-bold"><span className="mb-2 block">Confirm new lock</span><input className="input" type="password" value={resetLockConfirm} onChange={(e) => { setResetConfirm(false); setResetLockConfirm(e.target.value) }} placeholder="Confirm new lock" /></label>
                </div>
              )}
              <button className="btn-danger mt-3" onClick={resetForgottenLock}>{resetMode ? resetConfirm ? 'Create new lock after reset' : 'Confirm reset details' : 'Forgot lock / reset vault'}</button>
              {resetMode && <button className="btn-soft mt-3 ml-2" onClick={() => { setResetMode(false); setResetConfirm(false); setResetLock(''); setResetLockConfirm(''); clearMessages() }}>Cancel reset</button>}
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="mt-8 glass rounded-3xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="badge"><LockKeyhole size={14} /> Password protected local document vault</span>
          <h2 className="mt-3 text-2xl font-black text-white">Safety Mode Important Documents</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Save emergency documents in this browser for demo/offline use: passport, visa, ID, tickets, insurance and hotel proof. Files stay on this device and are included in the offline pack after saving.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-100">Demo limit: 4 MB per file</span>
          <button className="btn-soft" onClick={() => setUnlocked(false)}>Lock vault</button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
        <h3 className="font-black text-white">Change vault lock</h3>
        <p className="mt-1 text-xs text-cyan-100/80">Enter the old lock, then type a different new lock twice. The lock updates only when old lock is correct and both new entries match.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input className="input" type="password" value={oldLock} onChange={(e) => setOldLock(e.target.value)} placeholder="Old lock" />
          <input className="input" type="password" value={newLock} onChange={(e) => setNewLock(e.target.value)} placeholder="New lock" />
          <input className="input" type="password" value={newLockConfirm} onChange={(e) => setNewLockConfirm(e.target.value)} placeholder="Confirm new lock" />
        </div>
        {error && <p className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm font-bold text-red-100">{error}</p>}
        {success && <p className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm font-bold text-emerald-100">{success}</p>}
        <button className="btn-soft mt-3" onClick={changeLock}>Update lock</button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.45fr_0.55fr]">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-950/60 p-4">
          <label className="block text-sm font-bold text-slate-300">
            <span className="mb-2 block">Document category</span>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="mt-4 block text-sm font-bold text-slate-300">
            <span className="mb-2 block">Document display name/category</span>
            <input className="input" placeholder="Example: Aadhaar card front" value={documentLabel} onChange={(e) => setDocumentLabel(e.target.value)} />
            <span className="mt-1 block text-xs text-slate-500">Uploaded file will be saved with this name in the offline pack. Leave blank to use the selected category.</span>
          </label>
          <label className="mt-4 block text-sm font-bold text-slate-300">
            <span className="mb-2 block">Short note</span>
            <input className="input" placeholder="Example: keep this ready at station gate" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <label className="btn-primary mt-4 inline-flex cursor-pointer items-center gap-2">
            <UploadCloud size={18} /> Upload PDF/Image
            <input className="hidden" type="file" accept="image/*,.pdf" onChange={handleUpload} />
          </label>
          <p className="mt-4 text-xs leading-5 text-slate-400">
            Demo security: access is password-gated on this device. Production version should encrypt document bytes with the password before storage.
          </p>
        </div>

        <div className="grid gap-3">
          {docs.length === 0 ? (
            <div className="rounded-2xl border border-slate-700/70 bg-slate-950/60 p-5 text-sm text-slate-400">No documents saved yet.</div>
          ) : docs.map((doc) => (
            <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/60 p-4">
              <div className="flex min-w-0 items-start gap-3">
                <FileText className="mt-1 shrink-0 text-cyan-300" size={20} />
                <div className="min-w-0">
                  <p className="truncate font-black text-white">{doc.name}</p>
                  <p className="text-xs text-slate-400">{doc.category} · {(doc.size / 1024).toFixed(1)} KB · saved for offline pack</p>{doc.originalName && <p className="text-xs text-slate-500">Original file: {doc.originalName}</p>}
                  {doc.note && <p className="mt-1 text-xs text-cyan-100/80">{doc.note}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <a className="btn-soft px-3" href={doc.dataUrl} target="_blank" rel="noreferrer">Open</a>
                <button className="btn-soft px-3" onClick={() => renameDocument(doc)}>Rename</button>
                <button className="btn-soft px-3 text-red-200" onClick={() => remove(doc.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
