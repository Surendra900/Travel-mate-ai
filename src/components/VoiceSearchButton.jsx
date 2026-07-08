import { useMemo, useRef, useState } from 'react'
import { Mic, MicOff, Search, X } from 'lucide-react'

const BrowserSpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null

function normalize(text = '') {
  return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function VoiceSearchButton({ onSearch }) {
  const [open, setOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [typedSearch, setTypedSearch] = useState('')
  const [status, setStatus] = useState('Tap the mic and say a route, like train from Hyderabad to Delhi.')
  const recognitionRef = useRef(null)
  const supported = Boolean(BrowserSpeechRecognition)

  const recognition = useMemo(() => {
    if (!supported) return null
    const instance = new BrowserSpeechRecognition()
    instance.lang = 'en-IN'
    instance.continuous = false
    instance.interimResults = true
    instance.maxAlternatives = 1

    instance.onstart = () => {
      setListening(true)
      setStatus('Listening...')
    }

    instance.onresult = (event) => {
      let text = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        text += event.results[index]?.[0]?.transcript || ''
      }
      const finalText = text.trim()
      transcriptRef.current = finalText
      setTranscript(finalText)
    }

    instance.onerror = (event) => {
      setListening(false)
      setStatus(`Voice search error: ${event?.error || 'microphone unavailable'}. Type your search instead.`)
    }

    instance.onend = () => {
      setListening(false)
      const finalText = transcriptRef.current.trim()
      if (finalText) submit(finalText)
      else setStatus('No speech captured. Tap the mic and try again.')
    }

    recognitionRef.current = instance
    return instance
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported])

  const transcriptRef = useRef('')
  transcriptRef.current = transcript

  function startListening() {
    setOpen(true)
    setTranscript('')
    setStatus('Listening...')
    if (!recognition) {
      setStatus('Voice recognition is not supported in this browser. Type your search below.')
      return
    }
    try {
      recognition.start()
    } catch {
      try { recognition.stop() } catch {}
      window.setTimeout(() => {
        try { recognition.start() } catch {
          setListening(false)
          setStatus('Microphone is busy. Try again in a second.')
        }
      }, 200)
    }
  }

  function stopListening() {
    try { recognitionRef.current?.stop?.() } catch {}
    setListening(false)
  }

  function submit(value) {
    const clean = normalize(value)
    if (!clean) {
      setStatus('Enter or say a search first.')
      return
    }
    const result = onSearch?.(value)
    setStatus(result?.message || 'Search applied.')
    setTypedSearch('')
  }

  function handleTypedSearch() {
    submit(typedSearch)
  }

  return (
    <div className="fixed bottom-5 left-5 z-[55] flex flex-col items-start gap-2">
      {open && (
        <section className="w-[min(92vw,24rem)] rounded-3xl border border-cyan-400/30 bg-slate-950/95 p-4 text-sm text-slate-200 shadow-glow" aria-label="Voice search panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-black text-cyan-100"><Search size={17} aria-hidden="true" /> Voice Search</p>
              <p className="mt-1 text-xs text-slate-400">Search routes or open pages by voice.</p>
            </div>
            <button type="button" className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => setOpen(false)} aria-label="Close voice search">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3" aria-live="polite">
            <p className="text-xs font-bold text-cyan-100">{status}</p>
            {transcript && <p className="mt-2 text-xs text-slate-200">Heard: {transcript}</p>}
          </div>

          {!supported && (
            <div className="mt-3 grid gap-2">
              <label className="text-xs font-black text-cyan-100" htmlFor="voice-search-fallback">Type route search</label>
              <input
                id="voice-search-fallback"
                className="input"
                value={typedSearch}
                onChange={(event) => setTypedSearch(event.target.value)}
                placeholder="Example: train from Hyderabad to Delhi"
              />
              <button type="button" className="btn-primary" onClick={handleTypedSearch}>Search</button>
            </div>
          )}

          <div className="mt-3 grid gap-2 text-xs">
            {[
              'train from Hyderabad to Delhi',
              'flight from Vijayawada to Bengaluru',
              'bus from Hyderabad to Vijayawada',
              'open safety',
              'open saved plans'
            ].map((example) => (
              <button key={example} type="button" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-left font-bold text-slate-300 hover:bg-slate-800" onClick={() => submit(example)}>
                {example}
              </button>
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        className={`rounded-full border p-3 shadow-glow ${listening ? 'border-red-400 bg-red-500/20 text-red-100' : 'border-cyan-400/30 bg-slate-950 text-cyan-100'}`}
        onClick={listening ? stopListening : startListening}
        aria-label={listening ? 'Stop voice search listening' : 'Start voice search'}
        title="Voice search"
      >
        {listening ? <MicOff size={22} aria-hidden="true" /> : <Mic size={22} aria-hidden="true" />}
      </button>
    </div>
  )
}
