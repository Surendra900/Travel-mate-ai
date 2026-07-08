import { callRapidRail, compactRaw, stationCode } from './_rapidapiRail.js'

function normalizeSeat(payload, query) {
  const data = payload?.data || payload || {}
  const availability = Array.isArray(data.availability) ? data.availability
    : Array.isArray(data.avlDayList) ? data.avlDayList
    : Array.isArray(data.availability_details) ? data.availability_details
    : Array.isArray(data) ? data
    : []

  return {
    trainNo: data.trainNo || data.train_number || query.trainNo,
    classType: query.classType,
    quota: query.quota,
    fromStationCode: query.fromStationCode,
    toStationCode: query.toStationCode,
    date: query.date || data.date || data.journeyDate || '',
    availability: availability.map((item, index) => ({
      date: item.date || item.availabilityDate || item.journeyDate || `Option ${index + 1}`,
      status: item.status || item.availabilityStatus || item.current_status || item.availablityStatus || JSON.stringify(item)
    })),
    sourceBadge: 'Live API result',
    raw: compactRaw(payload)
  }
}

export default async function handler(req, res) {
  const query = {
    trainNo: String(req.query.trainNo || req.query.trainNumber || req.query.train || '').replace(/\D/g, ''),
    fromStationCode: stationCode(req.query.fromStationCode || req.query.from || ''),
    toStationCode: stationCode(req.query.toStationCode || req.query.to || ''),
    classType: req.query.classType || req.query.class || 'SL',
    quota: req.query.quota || 'GN',
    date: req.query.date || req.query.dateOfJourney || ''
  }

  if (!query.trainNo || !query.fromStationCode || !query.toStationCode) {
    return res.status(200).json({ ok: true, mode: 'invalid', provider: 'Local validation', sourceBadge: 'Input required', message: 'trainNo, fromStationCode, and toStationCode are required.', result: null })
  }

  try {
    const { date, ...providerQuery } = query
    const payload = await callRapidRail('/api/v2/checkSeatAvailability', providerQuery)
    return res.status(200).json({ ok: true, mode: 'live', provider: 'RapidAPI IRCTC / irctc1', sourceBadge: 'Live API result', message: 'Seat availability loaded from RapidAPI.', result: normalizeSeat(payload, query) })
  } catch (error) {
    return res.status(200).json({ ok: true, mode: 'fallback', provider: 'RapidAPI IRCTC + local fallback', sourceBadge: 'Provider verification required', message: `${error.message}. Seat availability needs provider verification.`, result: { ...query, availability: [] }, error: error.code || error.status || 'SEAT_AVAILABILITY_ERROR' })
  }
}
