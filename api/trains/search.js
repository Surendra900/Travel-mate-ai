import { callRapidRail, compactRaw, dataRows, stationCode } from './_rapidapiRail.js'

const fallbackNote = 'Live train search API is not configured or returned no results. Local route catalogue remains active.'

function normalizeTrainRow(row, index, from, to, date) {
  const trainNo = row.train_number || row.trainNo || row.train_no || row.number || row.code || row.train_num || 'N/A'
  const trainName = row.train_name || row.trainName || row.name || row.train || 'Train option'
  const depart = row.from_std || row.departure_time || row.departure || row.dep_time || row.start_time || row.std || 'Check provider'
  const arrive = row.to_sta || row.arrival_time || row.arrival || row.arr_time || row.end_time || row.sta || 'Check provider'
  const fromLabel = row.from_station_name || row.from || row.source || row.src_name || row.from_stn_name || from || 'Origin'
  const toLabel = row.to_station_name || row.to || row.destination || row.dstn_name || row.to_stn_name || to || 'Destination'

  return {
    id: `${trainNo}-${index}`,
    type: 'train',
    serviceName: `${trainName} ${trainNo !== 'N/A' ? `(${trainNo})` : ''}`,
    service: `${trainName} ${trainNo !== 'N/A' ? `(${trainNo})` : ''}`,
    code: String(trainNo),
    from: fromLabel,
    to: toLabel,
    departure: depart,
    depart,
    arrival: arrive,
    arrive,
    duration: row.duration || row.travel_time || row.travelTime || 'Check provider',
    runningDays: row.run_days || row.running_days || row.days || row.train_runs_on || '',
    price: row.fare || row.price || null,
    currency: 'INR',
    cabins: row.class_type || row.classes || row.available_classes || ['SL', '3A', '2A'],
    provider: 'RapidAPI IRCTC / irctc1',
    sourceBadge: 'Live API result',
    verification: `Live train search response${date ? ` for ${date}` : ''}. Seats/fare/final booking need provider verification.`,
    raw: compactRaw(row)
  }
}

export default async function handler(req, res) {
  const { from = '', to = '', date = '', query = '', trainNumber = '' } = req.query
  const fromStationCode = stationCode(req.query.fromStationCode || from)
  const toStationCode = stationCode(req.query.toStationCode || to)
  const searchText = query || trainNumber || req.query.train || ''

  try {
    let payload
    let message
    if (fromStationCode && toStationCode) {
      payload = await callRapidRail('/api/v3/trainBetweenStations', { fromStationCode, toStationCode, dateOfJourney: date })
      message = `Live trains between ${fromStationCode} and ${toStationCode} loaded.`
    } else if (searchText) {
      payload = await callRapidRail('/api/v1/searchTrain', { query: searchText })
      message = `Live train search loaded for ${searchText}.`
    } else {
      return res.status(200).json({ ok: true, mode: 'fallback', provider: 'Local route dataset', sourceBadge: 'Input required', message: 'Enter From/To stations or a train search query.', results: [] })
    }

    const rows = dataRows(payload)
    const results = rows.map((row, index) => normalizeTrainRow(row, index, from || fromStationCode, to || toStationCode, date))
    return res.status(200).json({
      ok: true,
      mode: results.length ? 'live' : 'fallback',
      provider: results.length ? 'RapidAPI IRCTC / irctc1' : 'RapidAPI IRCTC + local route dataset',
      sourceBadge: results.length ? 'Live API result' : 'Fallback estimate',
      message: results.length ? message : `${message} No rows returned. ${fallbackNote}`,
      count: results.length,
      results,
      raw: compactRaw(payload)
    })
  } catch (error) {
  console.error("RapidAPI Error:", error);

  return res.status(500).json({
    ok: false,
    mode: "error",
    message: error.message,
    error: error.stack
  });
}
