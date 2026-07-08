const stationAliases = {
  HYDERABAD: 'HYB',
  SECUNDERABAD: 'SC',
  DELHI: 'NDLS',
  'NEW DELHI': 'NDLS',
  VIJAYAWADA: 'BZA',
  RAJAHMUNDRY: 'RJY',
  RAJAMAHENDRAVARAM: 'RJY',
  CHENNAI: 'MAS',
  BENGALURU: 'SBC',
  BANGALORE: 'SBC',
  MUMBAI: 'CSMT',
  KOLKATA: 'HWH',
  HOWRAH: 'HWH',
  KOCHI: 'ERS',
  ERNAKULAM: 'ERS',
  PUNE: 'PUNE',
  GOA: 'MAO',
  VISAKHAPATNAM: 'VSKP',
  TIRUPATI: 'TPTY',
  GUNTUR: 'GNT',
  WARANGAL: 'WL',
  KAZIPET: 'KZJ'
}

export function stationCode(value = '') {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const upper = raw.toUpperCase()
  if (/^[A-Z]{2,5}$/.test(upper)) return upper
  return stationAliases[upper] || upper.slice(0, 4)
}

export function getRapidConfig() {
  const host = process.env.RAPIDAPI_TRAIN_HOST || process.env.IRCTC_API_HOST || 'irctc1.p.rapidapi.com'
  const key = process.env.RAPIDAPI_KEY || process.env.TRAIN_RAPIDAPI_KEY || process.env.IRCTC_RAPIDAPI_KEY || process.env.TRAIN_API_KEY || process.env.TRAIN_STATUS_API_KEY
  const base = process.env.IRCTC_API_BASE_URL || `https://${host}`
  return { host, key, base }
}

export function hasRapidRailConfig() {
  const { key } = getRapidConfig()
  return Boolean(key)
}

export async function callRapidRail(path, params = {}) {
  const { host, key, base } = getRapidConfig()
  if (!key) {
    const missing = new Error('RAPIDAPI_KEY is not configured in Vercel Environment Variables.')
    missing.code = 'MISSING_RAPIDAPI_KEY'
    throw missing
  }

  const url = new URL(path.startsWith('http') ? path : `${base}${path}`)
  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(name, String(value).trim())
    }
  })

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': host,
      'x-rapidapi-key': key
    }
  })

  let payload = null
  const text = await response.text()
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = { rawText: text }
  }

  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || `RapidAPI HTTP ${response.status}`)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

function firstArray(value, depth = 0) {
  if (!value || depth > 4) return null
  if (Array.isArray(value)) return value
  if (typeof value !== 'object') return null

  const priorityKeys = [
    'data', 'results', 'result', 'trains', 'train', 'train_list', 'trainList',
    'train_details', 'trainDetails', 'train_between_stations', 'trainBetweenStations',
    'station', 'stations', 'station_list', 'stationList', 'availability', 'avlDayList'
  ]

  for (const key of priorityKeys) {
    const found = firstArray(value[key], depth + 1)
    if (found) return found
  }

  for (const inner of Object.values(value)) {
    const found = firstArray(inner, depth + 1)
    if (found) return found
  }

  return null
}

export function dataRows(payload) {
  if (Array.isArray(payload)) return payload
  const found = firstArray(payload)
  if (found) return found
  if (payload?.data && typeof payload.data === 'object') return [payload.data]
  if (payload && typeof payload === 'object') return [payload]
  return []
}

export function compactRaw(value) {
  try {
    return JSON.parse(JSON.stringify(value, (key, inner) => {
      if (key && /key|token|secret|password/i.test(key)) return '[hidden]'
      return inner
    }))
  } catch {
    return null
  }
}
