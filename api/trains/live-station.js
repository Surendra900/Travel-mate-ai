import { callRapidRail, compactRaw, dataRows, stationCode } from './_rapidapiRail.js'

function normalizeStationRows(payload, fromStationCode, toStationCode) {
  return dataRows(payload).flatMap((row, index) => {
    const nested = Array.isArray(row?.trains) ? row.trains : Array.isArray(row?.train) ? row.train : null
    if (nested) return nested.map((item, innerIndex) => normalizeStationRow(item, `${index}-${innerIndex}`, fromStationCode, toStationCode))
    return [normalizeStationRow(row, index, fromStationCode, toStationCode)]
  })
}

function normalizeStationRow(row, index, fromStationCode, toStationCode) {
  return {
    id: row.train_number || row.trainNo || row.train_no || row.number || `station-${index}`,
    type: 'train',
    serviceName: `${row.train_name || row.trainName || row.name || 'Train'} ${row.train_number || row.trainNo || row.train_no || ''}`.trim(),
    code: row.train_number || row.trainNo || row.train_no || 'N/A',
    from: row.source || row.from || row.from_station_name || fromStationCode,
    to: row.destination || row.to || row.to_station_name || toStationCode || 'Route destination',
    departure: row.sch_dep_time || row.departure || row.departure_time || row.std || row.actual_departure || 'Check provider',
    arrival: row.sch_arr_time || row.arrival || row.arrival_time || row.sta || row.actual_arrival || 'Check provider',
    duration: row.duration || row.travel_time || 'Check provider',
    provider: 'RapidAPI IRCTC / irctc1',
    sourceBadge: 'Live API result',
    verification: 'Live station result. Final booking/availability must be verified through official provider.',
    raw: compactRaw(row)
  }
}

export default async function handler(req, res) {
  const fromStationCode = stationCode(req.query.fromStationCode || req.query.from || '')
  const toStationCode = stationCode(req.query.toStationCode || req.query.to || '')
  const hours = req.query.hours || '4'

  if (!fromStationCode) {
    return res.status(200).json({ ok: true, mode: 'invalid', provider: 'Local validation', message: 'fromStationCode is required.', results: [] })
  }

  try {
    const payload = await callRapidRail('/api/v3/getLiveStation', { fromStationCode, toStationCode, hours })
    const results = normalizeStationRows(payload, fromStationCode, toStationCode)
    return res.status(200).json({ ok: true, mode: 'live', provider: 'RapidAPI IRCTC / irctc1', sourceBadge: 'Live API result', message: `Live station data loaded for ${fromStationCode}.`, count: results.length, results, raw: compactRaw(payload) })
  } catch (error) {
    return res.status(200).json({ ok: true, mode: 'fallback', provider: 'RapidAPI IRCTC + local fallback', sourceBadge: 'Fallback estimate', message: `${error.message}. Showing no live station rows.`, results: [], error: error.code || error.status || 'LIVE_STATION_ERROR' })
  }
}
