import { callRapidRail, compactRaw, dataRows } from './_rapidapiRail.js'

function normalize(row, index) {
  return {
    id: row.station_code || row.code || row.stationCode || `station-${index}`,
    name: row.station_name || row.name || row.stationName || row.label || 'Station',
    code: row.station_code || row.code || row.stationCode || 'N/A',
    state: row.state || row.zone || '',
    provider: 'RapidAPI IRCTC / irctc1',
    sourceBadge: 'Live API result',
    raw: compactRaw(row)
  }
}

export default async function handler(req, res) {
  const query = String(req.query.query || req.query.q || '').trim()
  if (!query) {
    return res.status(200).json({ ok: true, mode: 'invalid', provider: 'Local validation', sourceBadge: 'Input required', message: 'query is required.', results: [] })
  }

  try {
    const payload = await callRapidRail('/api/v1/searchStation', { query })
    const results = dataRows(payload).map(normalize)
    return res.status(200).json({ ok: true, mode: results.length ? 'live' : 'fallback', provider: 'RapidAPI IRCTC / irctc1', sourceBadge: results.length ? 'Live API result' : 'Fallback estimate', message: results.length ? `Station search loaded for ${query}.` : `No stations returned for ${query}.`, count: results.length, results, raw: compactRaw(payload) })
  } catch (error) {
    return res.status(200).json({ ok: true, mode: 'fallback', provider: 'RapidAPI IRCTC + local fallback', sourceBadge: 'Fallback estimate', message: `${error.message}.`, results: [], error: error.code || error.status || 'STATION_SEARCH_ERROR' })
  }
}
