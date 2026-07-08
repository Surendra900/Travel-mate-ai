const airportAliases = {
  Hyderabad: 'HYD',
  Secunderabad: 'HYD',
  Delhi: 'DEL',
  'New Delhi': 'DEL',
  Rajahmundry: 'RJA',
  Rajamahendravaram: 'RJA',
  Mumbai: 'BOM',
  Bengaluru: 'BLR',
  Bangalore: 'BLR',
  Chennai: 'MAA',
  Kochi: 'COK',
  Ernakulam: 'COK',
  Vijayawada: 'VGA',
  Pune: 'PNQ',
  Kolkata: 'CCU',
  Goa: 'GOI'
}

function code(value = '') {
  const trimmed = String(value).trim()
  if (!trimmed) return ''
  if (/^[A-Z]{3}$/.test(trimmed.toUpperCase())) return trimmed.toUpperCase()
  return airportAliases[trimmed] || trimmed.slice(0, 3).toUpperCase()
}

function fallbackFlight(from, to, date) {
  return [
    {
      id: 'flight-local-demo-1',
      type: 'flight',
      serviceName: `${code(from)} → ${code(to)} demo flight`,
      code: `${code(from)}-${code(to)}-DEMO`,
      from: code(from),
      to: code(to),
      departure: `${date || 'selected date'} 08:10`,
      arrival: `${date || 'selected date'} 10:30`,
      duration: 'Approx. 2h 20m',
      stops: 'Direct / local fallback',
      price: null,
      currency: 'INR',
      cabins: ['Economy'],
      provider: 'Local fallback',
      sourceBadge: 'Fallback estimate',
      verification: 'Fallback result. Add AVIATIONSTACK_API_KEY in Vercel for live flight status/schedule data.'
    }
  ]
}

export default async function handler(req, res) {
  const from = req.query.from || req.query.origin || ''
  const to = req.query.to || req.query.destination || ''
  const date = req.query.date || ''
  const apiKey = process.env.AVIATIONSTACK_API_KEY
  const baseUrl = process.env.AVIATIONSTACK_BASE_URL || 'https://api.aviationstack.com/v1'
  const dep = code(from)
  const arr = code(to)

  if (!apiKey) {
    return res.status(200).json({
      ok: true,
      mode: 'fallback',
      provider: 'Local fallback',
      sourceBadge: 'Fallback estimate',
      message: 'AVIATIONSTACK_API_KEY is not configured. Flight endpoint is ready; showing fallback result.',
      results: fallbackFlight(from, to, date)
    })
  }

  try {
    const params = new URLSearchParams({ access_key: apiKey, limit: '8' })
    if (dep) params.set('dep_iata', dep)
    if (arr) params.set('arr_iata', arr)
    if (date) params.set('flight_date', date)

    const response = await fetch(`${baseUrl}/flights?${params.toString()}`)
    const payload = await response.json()

    if (!response.ok || payload.error) {
      return res.status(200).json({
        ok: true,
        mode: 'fallback',
        provider: 'Aviationstack + Local fallback',
        sourceBadge: 'Fallback estimate',
        message: payload?.error?.message || `Aviationstack returned HTTP ${response.status}. Showing fallback result.`,
        rawError: payload?.error || null,
        results: fallbackFlight(from, to, date)
      })
    }

    const rows = Array.isArray(payload.data) ? payload.data : []
    const results = rows.map((item, index) => ({
      id: item.flight?.iata || item.flight?.number || `aviationstack-${index}`,
      type: 'flight',
      serviceName: `${item.airline?.name || 'Airline'} ${item.flight?.iata || item.flight?.number || ''}`.trim(),
      code: item.flight?.iata || item.flight?.icao || item.flight?.number || 'N/A',
      from: `${item.departure?.airport || dep} (${item.departure?.iata || dep})`,
      to: `${item.arrival?.airport || arr} (${item.arrival?.iata || arr})`,
      departure: item.departure?.scheduled || item.departure?.estimated || 'Check provider',
      arrival: item.arrival?.scheduled || item.arrival?.estimated || 'Check provider',
      duration: 'Check provider schedule',
      stops: item.flight_status || 'status unavailable',
      price: null,
      currency: 'INR',
      cabins: ['Economy'],
      provider: 'Aviationstack',
      sourceBadge: 'Live API result',
      verification: 'Live provider response for flight status/schedule. Fare/booking still requires airline/OTA provider license.'
    }))

    return res.status(200).json({
      ok: true,
      mode: results.length ? 'live' : 'fallback',
      provider: results.length ? 'Aviationstack' : 'Aviationstack + Local fallback',
      sourceBadge: results.length ? 'Live API result' : 'Fallback estimate',
      message: results.length ? 'Live flight data loaded.' : 'No Aviationstack rows for this route/date. Showing fallback result.',
      count: results.length || 1,
      results: results.length ? results : fallbackFlight(from, to, date)
    })
  } catch (error) {
    return res.status(200).json({
      ok: true,
      mode: 'fallback',
      provider: 'Aviationstack + Local fallback',
      sourceBadge: 'Fallback estimate',
      message: `Flight API error: ${error.message}. Showing fallback result.`,
      results: fallbackFlight(from, to, date)
    })
  }
}
