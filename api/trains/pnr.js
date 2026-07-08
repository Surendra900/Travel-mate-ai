import { callRapidRail, compactRaw } from './_rapidapiRail.js'

function normalizePnr(payload, pnrNumber) {
  const data = payload?.data || payload || {}
  const passengers = Array.isArray(data.passengerInfo) ? data.passengerInfo
    : Array.isArray(data.passengers) ? data.passengers
    : Array.isArray(data.psgn) ? data.psgn
    : []

  return {
    pnrNumber: data.pnrNumber || data.pnr || pnrNumber,
    trainNumber: data.trainNumber || data.train_number || data.trainNo || data.train_no || 'Provider did not return train number',
    trainName: data.trainName || data.train_name || 'Provider did not return train name',
    from: data.sourceStation || data.from || data.boardingPoint || data.boarding_station || data.src || 'Source not returned',
    to: data.destinationStation || data.to || data.reservationUpto || data.reservation_upto || data.dest || 'Destination not returned',
    journeyDate: data.dateOfJourney || data.journeyDate || data.doj || data.train_start_date || 'Journey date not returned',
    chartStatus: data.chartStatus || data.chart_prepared || data.chartingStatus || 'Chart status not returned',
    bookingStatus: data.bookingStatus || data.booking_status || data.booking_status_details || '',
    currentStatus: data.currentStatus || data.current_status || data.confirmationStatus || data.status || '',
    passengers: passengers.map((item, index) => ({
      serial: item.serialNo || item.passengerSerialNumber || item.number || index + 1,
      bookingStatus: item.bookingStatus || item.booking_status || item.currentStatus || item.current_status || item.status || 'Status not returned',
      currentStatus: item.currentStatus || item.current_status || item.confirmationStatus || item.status || 'Status not returned',
      coach: item.coach || item.coachPosition || item.coach_number || '',
      berth: item.berth || item.berthNo || item.berth_number || item.seat || ''
    })),
    sourceBadge: 'Live API result',
    raw: compactRaw(payload)
  }
}

export default async function handler(req, res) {
  const pnrNumber = String(req.query.pnr || req.query.pnrNumber || '').replace(/\D/g, '')
  if (pnrNumber.length !== 10) {
    return res.status(200).json({
      ok: true,
      mode: 'invalid',
      provider: 'Local validation',
      sourceBadge: 'Input required',
      message: 'Enter a valid 10-digit PNR number.',
      result: null
    })
  }

  try {
    const payload = await callRapidRail('/api/v3/getPNRStatus', { pnrNumber })
    return res.status(200).json({
      ok: true,
      mode: 'live',
      provider: 'RapidAPI IRCTC / irctc1',
      sourceBadge: 'Live API result',
      message: 'PNR status loaded from RapidAPI.',
      result: normalizePnr(payload, pnrNumber)
    })
  } catch (error) {
    return res.status(200).json({
      ok: true,
      mode: 'fallback',
      provider: 'RapidAPI IRCTC + local validation',
      sourceBadge: 'Provider verification required',
      message: `${error.message}. PNR format is valid, but live lookup was not completed.`,
      result: {
        pnrNumber,
        trainNumber: 'Provider verification required',
        trainName: 'PNR lookup fallback',
        from: 'Not available offline',
        to: 'Not available offline',
        journeyDate: 'Not available offline',
        chartStatus: 'Check provider',
        bookingStatus: 'Live RapidAPI response required',
        currentStatus: 'Live RapidAPI response required',
        passengers: []
      },
      error: error.code || error.status || 'PNR_ERROR'
    })
  }
}
