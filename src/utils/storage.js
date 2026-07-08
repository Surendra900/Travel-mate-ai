import { emergencyCards, emergencyNumber } from '../data/emergencyData'
import { calculatePlanQualityScore, scoreBreakdown } from './scoring'
import { coverageNotice, getServiceOptions, transportPlaces } from '../data/transportData'

const PLAN_KEY = 'travelmate-plans'
const OFFLINE_KEY = 'travelmate-offline-pack'
const LOADED_PLAN_KEY = 'travelmate-loaded-plan'
const DOCUMENT_KEY = 'travelmate-document-vault'

function safeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getSavedPlans() {
  try {
    return JSON.parse(localStorage.getItem(PLAN_KEY)) || []
  } catch {
    return []
  }
}

export function savePlan(plan) {
  const current = getSavedPlans()
  const normalized = {
    id: plan.id || safeId(),
    from: plan.from || '',
    to: plan.to || '',
    transportMode: plan.transportMode || plan.transport || 'Train',
    routeCombo: plan.routeCombo || `${plan.transportMode || 'Train'} only`,
    airline: plan.airline || 'Indigo',
    date: plan.date || '',
    ticketType: plan.ticketType || plan.quota || 'Normal',
    quota: plan.quota || plan.ticketType || 'Normal',
    classType: plan.classType || 'Sleeper',
    passengers: Number(plan.passengers || 1),
    budget: Number(plan.budget || 0),
    readinessScore: Number(plan.readinessScore || 0),
    travelScore: Number(plan.travelScore || 0),
    planQualityScore: calculatePlanQualityScore(plan),
    scoreBreakdown: scoreBreakdown(plan),
    serviceOptions: getServiceOptions(plan),
    mode: plan.mode || 'normal',
    timestamp: new Date().toISOString()
  }
  localStorage.setItem(PLAN_KEY, JSON.stringify([normalized, ...current.filter((item) => item.id !== normalized.id)].slice(0, 20)))
  return normalized
}

export function deletePlan(id) {
  const updated = getSavedPlans().filter((plan) => plan.id !== id)
  localStorage.setItem(PLAN_KEY, JSON.stringify(updated))
  return updated
}

export function setLoadedPlan(plan) {
  localStorage.setItem(LOADED_PLAN_KEY, JSON.stringify(plan))
}

export function consumeLoadedPlan() {
  try {
    const plan = JSON.parse(localStorage.getItem(LOADED_PLAN_KEY))
    localStorage.removeItem(LOADED_PLAN_KEY)
    return plan
  } catch {
    return null
  }
}

export function getDocuments() {
  try {
    return JSON.parse(localStorage.getItem(DOCUMENT_KEY)) || []
  } catch {
    return []
  }
}

export function saveDocument(document) {
  const current = getDocuments()
  const normalized = {
    id: safeId(),
    name: document.name,
    originalName: document.originalName || document.name,
    type: document.type,
    size: document.size,
    category: document.category,
    note: document.note || '',
    dataUrl: document.dataUrl,
    timestamp: new Date().toISOString()
  }
  localStorage.setItem(DOCUMENT_KEY, JSON.stringify([normalized, ...current].slice(0, 20)))
  return normalized
}

export function deleteDocument(id) {
  const updated = getDocuments().filter((doc) => doc.id !== id)
  localStorage.setItem(DOCUMENT_KEY, JSON.stringify(updated))
  return updated
}

export function updateDocument(id, fields = {}) {
  const updated = getDocuments().map((doc) => doc.id === id ? { ...doc, ...fields } : doc)
  localStorage.setItem(DOCUMENT_KEY, JSON.stringify(updated))
  return updated
}

export function clearDocuments() {
  localStorage.removeItem(DOCUMENT_KEY)
  return []
}

export function saveOfflinePack() {
  const payload = {
    emergencyNumber,
    emergencyCards: emergencyCards.map(({ id, title, summary, number, importantPoints }) => ({
      id,
      title,
      summary,
      number,
      importantPoints
    })),
    savedRoutes: getSavedPlans(),
    serviceCoverageNotice: coverageNotice,
    transportPlaces: transportPlaces.map(({ city, train, airport, bus, aliases }) => ({ city, train, airport, bus, aliases })),
    currentRouteServices: getSavedPlans().slice(0, 6).map((plan) => ({ route: `${plan.from} → ${plan.to}`, options: getServiceOptions(plan) })),
    savedDocuments: getDocuments().map((doc) => ({
      id: doc.id,
      name: doc.name,
      originalName: doc.originalName,
      type: doc.type,
      size: doc.size,
      category: doc.category,
      note: doc.note,
      dataUrl: doc.dataUrl,
      timestamp: doc.timestamp
    })),
    generatedAt: new Date().toISOString(),
    notice: 'Offline pack is localStorage data. Documents are stored locally on this device for offline access and are not uploaded.',
    savedAt: new Date().toISOString()
  }
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(payload))
  return payload
}

export function getOfflinePack() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_KEY))
  } catch {
    return null
  }
}
