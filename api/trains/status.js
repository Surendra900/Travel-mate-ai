import { callRapidRail, compactRaw } from './_rapidapiRail.js'

const localStatuses = [
  { trainNumber: '20805', trainName: 'AP EXPRESS', from: 'RAJAHMUNDRY (RJY)', to: 'NEW DELHI (NDLS)', currentStation: 'Warangal', status: 'Running on local demo timeline', delay: '0 min', platform: 'Check NTES', updated: 'Local fallback' },
  { trainNumber: '12723', trainName: 'TELANGANA EXPRESS', from: 'HYDERABAD/SECUNDERABAD', to: 'NEW DELHI (NDLS)', currentStation: 'Nagpur section', status: 'On time in local demo', delay: '0 min', platform: 'PF check required', updated: 'Local fallback' },
  { trainNumber: '12721', trainName: 'DAKSHIN EXPRESS', from: 'SECUNDERABAD (SC)', to: 'HAZRAT NIZAMUDDIN (NZM)', currentStation: 'Kazipet section', status: '18 min late in local demo', delay: '18 min', platform: 'PF check required', updated: 'Local fallback' },
  { trainNumber: '19038', trainName: 'AVADH EXPRESS', from: 'BARAUNI / GORAKHPUR SIDE', to: 'BANDRA TERMINUS', currentStation: 'Provider sample train', status: 'Use live API for current location', delay: 'Check API', platform: 'Check provider', updated: 'Local fallback' }
]

function fallback(trainNumber = '') {
  const clean = String(trainNumber || '').replace(/\D/g, '')
  return localStatuses.find((item) => item.trainNumber === clean) || {
    trainNumber: clean || 'Not entered',
    trainName: 'Demo train status',
    from: 'Selected route',
    to: 'Selected destination',
    currentStation: 'Local fallback board',
    status: clean.length >= 5 ? 'Format accepted. Live status needs RapidAPI key in Vercel.' : 'Enter a valid train number.',
    delay: 'Unknown',
    platform: 'Check official NTES / station board',
    updated: 'Local fallback'
  }
}

function normalizeLive(payload, trainNumber, startDay) {
  const data = payload?.data || payload || {}
  const current = data.current_station_name || data.current_station || data.current_location || data.cur_stn_name || data.last_location || data.status_as_of || data.train_position || data.status
  const delay = data.delay || data.late_by || data.late_by_min || data.delay_in_arrival || data.delay_in_departure || data.avg_delay || data.run_delay
  const route = Array.isArray(data?.route) ? data.route : Array.isArray(data?.station_list) ? data.station_list : Array.isArray(data?.previous_stations) ? data.previous_stations : []
  const next = route.find((item) => item?.is_current_station || item?.station_name === current) || route.find((item) => item?.eta || item?.estimated_arrival || item?.arrival_delay)

  return {
    trainNumber: String(data.train_number || data.trainNo || data.train_no || trainNumber || '').replace(/\D/g, ''),
    trainName: data.train_name || data.trainName || data.name || 'Train live status',
    from: data.source || data.from || data.src_name || data.source_stn_name || data.from_station_name || 'Source not returned',
    to: data.destination || data.to || data.dstn_name || data.destination_stn_name || data.to_station_name || 'Destination not returned',
    currentStation: current || next?.station_name || next?.stationCode || 'Live provider returned data; current station not normalized',
    status: data.status || data.running_status || data.position || data.train_status || (data.is_run_day === false ? 'Train is not running today' : 'Live provider response loaded'),
    delay: delay !== undefined && delay !== null ? String(delay).replace('undefined', 'Unknown') : 'Check provider response',
    platform: data.platform_number || data.platform || next?.platform_number || 'Check station board',
    updated: data.updated_time || data.status_as_of || data.notification_date || new Date().toLocaleString('en-IN'),
    startDay,
    gpsEnabled: data.gps_unable === false ? false : data.gps_enable || data.gps_enabled || data.gps_unable || null,
    sourceBadge: 'Live API result',
    raw: compactRaw(payload)
  }
}

export default async function handler(req, res) {
  const trainNumber = String(req.query.trainNumber || req.query.train || req.query.trainNo || '').replace(/\D/g, '')
  const startDay = req.query.startDay || req.query.dayOffset || req.query.day || '0'

  if (trainNumber.length < 5) {
    return res.status(200).json({
      ok: true,
      mode: 'fallback',
      provider: 'Local validation',
      message: 'Enter a valid 5-digit train number.',
      result: fallback(trainNumber)
    })
  }

  try {
    const payload = await callRapidRail('/api/v1/liveTrainStatus', { trainNo: trainNumber, startDay })
    const result = normalizeLive(payload, trainNumber, startDay)
    return res.status(200).json({
      ok: true,
      mode: 'live',
      provider: 'RapidAPI IRCTC / irctc1',
      sourceBadge: 'Live API result',
      message: 'Live train running status loaded from RapidAPI.',
      result
    })
  } catch (error) {
    return res.status(200).json({
      ok: true,
      mode: 'fallback',
      provider: 'RapidAPI IRCTC + local fallback',
      sourceBadge: 'Fallback estimate',
      message: `${error.message}. Showing local fallback.`,
      result: fallback(trainNumber),
      error: error.code || error.status || 'TRAIN_STATUS_ERROR'
    })
  }
}
