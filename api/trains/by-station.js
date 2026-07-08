import { callRapidRail, compactRaw, dataRows, stationCode } from './_rapidapiRail.js'

function normalize(row, index, station) {
  return {
    id: row.train_number || row.trainNo || row.train_no || row.number || `by-station-${index}`,
    type: 'train',
    serviceName: `${row.train_name || row.trainName || row.name || 'Train'} ${row.train_number || row.trainNo || row.train_no || ''}`.trim(),
    code: row.train_number || row.trainNo || row.train_no || 'N/A',
    from: row.source || row.from || row.from_station_name || row.src_name || station,
    to: row.destination || row.to || row.to_station_name || row.dstn_name || 'Route destination',
    departure: row.departure_time || row.sch_dep_time || row.std || row.departure || 'Check provider',
    arrival: row.arrival_time || row.sch_arr_time || row.sta || row.arrival || 'Check provider',
    duration: row.duration || row.travel_time || 'Check provider',
    runningDays: row.run_days || row.running_days || row.days || '',
    provider: 'RapidAPI IRCTC / irctc1',
    sourceBadge: 'Live API result',
    verification: 'Train-by-station provider response. Final platform, fare and booking require official verification.',
    raw: compactRaw(row)
  }
}

export default async function handler(req, res) {
  const station = stationCode(req.query.stationCode || req.query.station || req.query.fromStationCode || '')
  if (!station) {
    return res.status(200).json({ ok: true, mode: 'invalid', provider: 'Local validation', sourceBadge: 'Input required', message: 'stationCode is required.', results: [] })
  }

  try {
    const payload = await callRapidRail('/api/v3/getTrainsByStation', { stationCode: station })
    const rows = dataRows(payload).map((row, index) => normalize(row, index, station))
    return res.status(200).json({ ok: true, mode: rows.length ? 'live' : 'fallback', provider: 'RapidAPI IRCTC / irctc1', sourceBadge: rows.length ? 'Live API result' : 'Fallback estimate', message: rows.length ? `Trains by station loaded for ${station}.` : `No trains returned for ${station}.`, count: rows.length, results: rows, raw: compactRaw(payload) })
  } catch (error) {
    return res.status(200).json({ ok: true, mode: 'fallback', provider: 'RapidAPI IRCTC + local fallback', sourceBadge: 'Fallback estimate', message: `${error.message}. Showing no station rows.`, results: [], error: error.code || error.status || 'TRAINS_BY_STATION_ERROR' })
  }
}
