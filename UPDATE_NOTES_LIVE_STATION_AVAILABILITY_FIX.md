# Live Station + Seat Availability Fix

This update improves the train live-data tools after API testing.

## Fixed
- Station tools now explain that RapidAPI station endpoints require one station code at a time.
- Live Station results display up to 30 provider rows instead of only 6.
- Trains By Station displays up to 50 provider rows instead of only 8.
- Station Search displays up to 12 station matches.
- Backend result normalization now reads nested provider arrays such as `data.trains`, `data.train_list`, `station_list`, and similar shapes.
- Seat Availability now sends only the exact provider params shown in RapidAPI: `trainNo`, `fromStationCode`, `toStationCode`, `classType`, and `quota`.
- Added a one-click seat availability test example: `19038 ST → BVI 2A GN`.

## Important limitation
This does not fetch every Indian station at once. The free/limited RapidAPI endpoints require a station code or route query per request. Querying every station live would consume API quota quickly and is not realistic for a hackathon demo.
