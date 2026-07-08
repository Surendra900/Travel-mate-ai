# RapidAPI Train Live + PNR Update

Added secure serverless integration for the RapidAPI IRCTC / irctc1 endpoints shown in the user's screenshots.

## Added / updated endpoints

- `/api/trains/status` → calls `/api/v1/liveTrainStatus?trainNo=...&startDay=...`
- `/api/trains/pnr` → calls `/api/v3/getPNRStatus?pnrNumber=...`
- `/api/trains/search` → calls `/api/v3/trainBetweenStations?fromStationCode=...&toStationCode=...&dateOfJourney=...` or `/api/v1/searchTrain?query=...`
- `/api/trains/live-station` → calls `/api/v3/getLiveStation?fromStationCode=...&toStationCode=...&hours=...`
- `/api/trains/seat-availability` → calls `/api/v2/checkSeatAvailability?...`

## Frontend updates

- PNR Tracker now performs a real API-ready lookup through `/api/trains/pnr`.
- Train Running Status now supports train number + start day offset.
- Live Station Dashboard added to Train mode.
- Provider badges now show Live API / Fallback / Provider verification states.

## Required Vercel variables

```
RAPIDAPI_KEY=your_regenerated_rapidapi_key_here
RAPIDAPI_TRAIN_HOST=irctc1.p.rapidapi.com
IRCTC_API_BASE_URL=https://irctc1.p.rapidapi.com
TRAIN_API_PROVIDER=rapidapi-irctc1
```

Important: The API key shown in screenshots was exposed. Regenerate it in RapidAPI before production/demo deployment.
