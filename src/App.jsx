import { Route, Routes, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar'
import StatusBar from './components/StatusBar'
import OfflineModeBanner from './components/OfflineModeBanner'
import VoiceSearchButton from './components/VoiceSearchButton'
import GlobalTranslationLayer from './components/GlobalTranslationLayer'
import OnboardingModal from './components/OnboardingModal'
import FloatingSOS from './components/FloatingSOS'
import OfflineOnlyMode from './components/OfflineOnlyMode'
import Home from './pages/Home'
import SafetyMode from './pages/SafetyMode'
import EmergencyDetail from './pages/EmergencyDetail'
import Planner from './pages/Planner'
import SavedPlans from './pages/SavedPlans'
import AnalyzeJourney from './pages/AnalyzeJourney'
import { languages } from './data/languageData'
import { useDeviceStatus } from './utils/deviceStatus'
import { warmOfflineCache } from './utils/offlineMode'
import { saveOfflinePack } from './utils/storage'

export default function App() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState('en')
  const [toastMessage, setToastMessage] = useState('')
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const status = useDeviceStatus()
  const labels = useMemo(() => languages[language].labels, [language])

  useEffect(() => {
    // Prepare emergency/offline data once the user has opened the app online.
    // This allows automatic low-network mode to keep useful data available when mobile data dies later.
    saveOfflinePack()
    warmOfflineCache()
  }, [])

  const toast = useCallback((message) => {
    setToastMessage(message)
    window.clearTimeout(window.__travelmateToast)
    window.__travelmateToast = window.setTimeout(() => setToastMessage(''), 2800)
  }, [])

  function normalizeVoiceText(value = '') {
    return String(value).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  }

  function titleCase(value = '') {
    return String(value)
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  function extractBetween(command, startWords, endWords = []) {
    const clean = ` ${command} `
    let startIndex = -1
    for (const startWord of startWords) {
      const index = clean.indexOf(` ${startWord} `)
      if (index >= 0 && (startIndex === -1 || index < startIndex)) {
        startIndex = index + startWord.length + 2
      }
    }
    if (startIndex === -1) return ''

    let endIndex = clean.length
    for (const endWord of endWords) {
      const index = clean.indexOf(` ${endWord} `, startIndex)
      if (index >= 0 && index < endIndex) endIndex = index
    }
    return clean.slice(startIndex, endIndex).trim()
  }

  const handleVoiceSearch = useCallback((rawCommand = '') => {
    const command = normalizeVoiceText(rawCommand)
    if (!command) return { ok: false, message: 'No voice search captured.' }

    if (command.includes('safety') || command.includes('emergency') || command.includes('sos')) {
      navigate('/safety')
      toast('Opened Safety Mode from voice search.')
      return { ok: true, message: 'Opened Safety Mode.' }
    }

    if (command.includes('saved')) {
      navigate('/saved')
      toast('Opened Saved Plans from voice search.')
      return { ok: true, message: 'Opened Saved Plans.' }
    }

    if (command.includes('analyze') || command.includes('analysis')) {
      navigate('/analyze')
      toast('Opened Analyze Journey from voice search.')
      return { ok: true, message: 'Opened Analyze Journey.' }
    }

    if (command.includes('planner') || command.includes('ticket') || command.includes('route') || command.includes('train') || command.includes('flight') || command.includes('bus')) {
      const plan = {}
      if (command.includes('flight')) {
        plan.transportMode = 'Flight'
        plan.routeCombo = 'Flight only'
      } else if (command.includes('bus')) {
        plan.transportMode = 'Bus'
        plan.routeCombo = 'Bus only'
      } else {
        plan.transportMode = 'Train'
        plan.routeCombo = 'Train only'
      }

      const from = extractBetween(command, ['from', 'boarding from'], ['to', 'destination', 'going to'])
      const to = extractBetween(command, ['to', 'destination', 'going to'], ['under', 'budget', 'with', 'for', 'on'])
      const budgetMatch = command.match(/(?:under|budget|below)\s*(?:rs|rupees)?\s*(\d+)/)
      const passengerMatch = command.match(/(\d+)\s*(?:passenger|passengers|people|person)/)

      if (from) plan.from = titleCase(from)
      if (to) plan.to = titleCase(to)
      if (budgetMatch) plan.budget = Number(budgetMatch[1])
      if (passengerMatch) plan.passengers = Math.min(6, Math.max(1, Number(passengerMatch[1])))

      const mode = command.includes('tatkal') || command.includes('urgent') ? 'emergency' : command.includes('low signal') || command.includes('offline') ? 'low-network' : 'normal'
      const detail = { plan, mode, openBooking: command.includes('book') || command.includes('ticket') }

      localStorage.setItem('travelmate-pending-voice-command', JSON.stringify(detail))
      navigate('/planner')
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('travelmate:voice-planner', { detail }))
      }, 250)

      const routeText = plan.from && plan.to ? `${plan.from} to ${plan.to}` : 'planner search'
      toast(`Voice search applied: ${routeText}.`)
      return { ok: true, message: `Applied ${routeText}.` }
    }

    navigate('/')
    toast('Voice search did not find a route. Opened Home.')
    return { ok: false, message: 'Try saying train from Hyderabad to Delhi.' }
  }, [navigate, toast])

  const appShell = (
    <div className="min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-xl focus:bg-cyan-300 focus:px-4 focus:py-2 focus:font-black focus:text-slate-950">Skip to main content</a>
      {status.online !== false && <Navbar language={language} onLanguageChange={setLanguage} labels={labels} onOpenProfile={() => setProfileModalOpen(true)} />}
      <StatusBar status={status} />
      {status.online === false ? (
        <div id="main-content"><OfflineOnlyMode status={status} toast={toast} /></div>
      ) : (
        <>
          <OfflineModeBanner status={status} toast={toast} />
          <div id="main-content">
            <Routes>
              <Route path="/" element={<Home labels={labels} toast={toast} />} />
              <Route path="/safety" element={<SafetyMode toast={toast} labels={labels} />} />
              <Route path="/safety/:id" element={<EmergencyDetail toast={toast} />} />
              <Route path="/planner" element={<Planner status={status} toast={toast} labels={labels} />} />
              <Route path="/saved" element={<SavedPlans toast={toast} />} />
              <Route path="/analyze" element={<AnalyzeJourney toast={toast} />} />
            </Routes>
          </div>
        </>
      )}
      <FloatingSOS status={status} />
      <VoiceSearchButton onSearch={handleVoiceSearch} />
      <GlobalTranslationLayer language={language} />
      {status.online !== false && <OnboardingModal toast={toast} forceOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-cyan-400/30 bg-slate-950 px-5 py-3 text-sm font-bold text-cyan-100 shadow-glow" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
    </div>
  )

  return appShell
}
