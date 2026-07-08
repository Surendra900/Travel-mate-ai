export async function searchLiveTransport({ transport, from, to, date, adults = 1, trainNumber = '' }) {
  const normalized = String(transport || '').toLowerCase()
  const endpointMap = {
    train: '/api/trains/search',
    trains: '/api/trains/search',
    flight: '/api/flights/search',
    flights: '/api/flights/search',
    bus: '/api/buses/search',
    buses: '/api/buses/search'
  }
  const endpoint = endpointMap[normalized] || endpointMap.train

  const params = new URLSearchParams({
    from: from || '',
    to: to || '',
    date: date || '',
    adults: String(adults || 1)
  })
  if (trainNumber) params.set('trainNumber', trainNumber)

  try {
    const res = await fetch(`${endpoint}?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (error) {
    return {
      ok: false,
      mode: 'frontend-fallback',
      provider: 'Local fallback',
      sourceBadge: 'Fallback estimate',
      message: `Live ${transport || 'transport'} API could not be reached. Showing local route data instead.`,
      error: error.message,
      results: []
    }
  }
}

export async function getTrainRunningStatus({ trainNumber, startDay = '0' }) {
  const params = new URLSearchParams({ trainNumber: trainNumber || '', startDay: String(startDay ?? '0') })
  try {
    const res = await fetch(`/api/trains/status?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (error) {
    return {
      ok: true,
      mode: 'local-fallback',
      provider: 'Local running-status fallback',
      sourceBadge: 'Fallback estimate',
      message: 'Serverless train-status API not reachable in local npm dev. Showing local fallback.',
      result: null,
      error: error.message
    }
  }
}

export async function getPNRStatus({ pnr }) {
  const params = new URLSearchParams({ pnr: pnr || '' })
  try {
    const res = await fetch(`/api/trains/pnr?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (error) {
    return {
      ok: true,
      mode: 'local-fallback',
      provider: 'Local validation',
      sourceBadge: 'Fallback estimate',
      message: 'PNR serverless API not reachable in local npm dev. Format validation only.',
      result: null,
      error: error.message
    }
  }
}

export async function getLiveStation({ fromStationCode, toStationCode = '', hours = '4' }) {
  const params = new URLSearchParams({ fromStationCode: fromStationCode || '', toStationCode: toStationCode || '', hours: String(hours || '4') })
  try {
    const res = await fetch(`/api/trains/live-station?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (error) {
    return {
      ok: true,
      mode: 'local-fallback',
      provider: 'Local station fallback',
      sourceBadge: 'Fallback estimate',
      message: 'Live station API not reachable in local npm dev.',
      results: [],
      error: error.message
    }
  }
}

export async function getTrainsByStation({ stationCode }) {
  const params = new URLSearchParams({ stationCode: stationCode || '' })
  try {
    const res = await fetch(`/api/trains/by-station?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (error) {
    return {
      ok: true,
      mode: 'local-fallback',
      provider: 'Local station fallback',
      sourceBadge: 'Fallback estimate',
      message: 'Trains-by-station API not reachable in local npm dev.',
      results: [],
      error: error.message
    }
  }
}

export async function searchStations({ query }) {
  const params = new URLSearchParams({ query: query || '' })
  try {
    const res = await fetch(`/api/trains/station-search?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (error) {
    return {
      ok: true,
      mode: 'local-fallback',
      provider: 'Local station fallback',
      sourceBadge: 'Fallback estimate',
      message: 'Station search API not reachable in local npm dev.',
      results: [],
      error: error.message
    }
  }
}

export async function getSeatAvailability({ trainNo, fromStationCode, toStationCode, classType = 'SL', quota = 'GN', date = '' }) {
  const params = new URLSearchParams({ trainNo: trainNo || '', fromStationCode: fromStationCode || '', toStationCode: toStationCode || '', classType, quota, date })
  try {
    const res = await fetch(`/api/trains/seat-availability?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (error) {
    return {
      ok: true,
      mode: 'local-fallback',
      provider: 'Local validation',
      sourceBadge: 'Fallback estimate',
      message: 'Seat availability API not reachable in local npm dev.',
      result: null,
      error: error.message
    }
  }
}
