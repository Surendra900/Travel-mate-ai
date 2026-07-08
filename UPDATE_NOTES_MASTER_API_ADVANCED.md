# TravelMate Master API + Advanced UX Update

This build upgrades TravelMate from a basic demo into a clearer, judge-ready emergency-first travel assistant.

## Added / improved

- Source labels across the UI:
  - Live API result
  - Verified static data
  - Fallback estimate
  - Provider verification required
- Cleaner homepage with four major pillars:
  - Emergency SOS
  - Tatkal Assistant
  - Offline Pack
  - Live API Checks
- Trust layer panel explaining data sources and fallback behavior.
- RapidAPI IRCTC backend routes:
  - `/api/trains/status`
  - `/api/trains/pnr`
  - `/api/trains/search`
  - `/api/trains/live-station`
  - `/api/trains/by-station`
  - `/api/trains/station-search`
  - `/api/trains/seat-availability`
- Aviationstack flight backend route:
  - `/api/flights/search`
- Bus provider remains fallback/provider-required until SeatSeller/redBus partner access is approved.
- Train UI additions:
  - Live train location / delay checker
  - PNR tracker
  - Seat/WL availability checker
  - Live station board
  - Trains by station
  - Station search
- Booking modal now starts with passenger details, then OTP, then payment-method preview.
- Booking flow clearly states: no real payment, no fake PNR, no confirmed ticket without licensed provider integration.
- Tatkal mode remains train-only with timing and alarm guidance.
- Offline/no-signal mode remains focused on saved plans, documents, SOS and offline pack.
- Voice is kept as simple voice search, not fragile always-on voice AI.

## Required Vercel Environment Variables

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

AVIATIONSTACK_API_KEY=your_aviationstack_key
AVIATIONSTACK_BASE_URL=https://api.aviationstack.com/v1

RAPIDAPI_KEY=your_regenerated_rapidapi_key
RAPIDAPI_TRAIN_HOST=irctc1.p.rapidapi.com
IRCTC_API_BASE_URL=https://irctc1.p.rapidapi.com
TRAIN_API_PROVIDER=rapidapi-irctc1

BUS_API_PROVIDER=fallback
```

## Important security note

The RapidAPI key was visible in screenshots. Regenerate it before the final demo and put the new value only in Vercel Environment Variables. Do not hard-code API keys inside React/Vite frontend code.
