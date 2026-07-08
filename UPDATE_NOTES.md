# TravelMate AI - Latest Hackathon Updates

## Added in this version

- Expanded offline transport hub dataset with 80+ Indian rail/airport/bus hubs, including Rajahmundry/RJY/RJA and Karunagappalli/KPY.
- Search-result style board for train, flight and bus options similar to ticket search cards.
- Exact service names shown inside multi-transport route combinations.
- Backup plan component showing Plan B if the first train/flight/bus route fails.
- Improved route scoring using route completeness, budget fit, service reliability, emergency fit and readiness.
- Saved Plans now stores score breakdown and exact service snapshot.
- Offline pack now caches emergency flows, phrases, saved routes, transport hubs and service snapshots in browser localStorage.
- Service worker added for app-shell offline reopening after the first successful visit.
- Voice assistant added for accessibility: voice commands and text-to-speech help.
- Admin dashboard now reads local saved plans/offline pack/transport dataset instead of only static mock metrics.
- Removed package-lock.json to avoid registry timeout problems from stale lockfile URLs.

## Important demo honesty

This project still does not provide live IRCTC, airline, airport or bus inventory. It uses curated demo data plus official-portal redirect. Do not claim live booking, live PNR, live seat availability or live running status unless you connect authorized APIs.

## How to run

```bash
cd travelmate-ai
npm config set registry https://registry.npmjs.org/
npm install --no-audit --no-fund
npm run dev
```

Open:

```text
http://localhost:5173
```

## Offline testing

1. Open the app once while internet is available.
2. Go to Saved Plans and click Generate Offline Pack.
3. Open Chrome DevTools > Network > Offline.
4. Refresh the app.
5. Saved routes, emergency data, phrases, transport hub list and service snapshots should remain usable.

## Voice accessibility testing

Use Chrome or Edge.

- Click microphone button bottom-left.
- Say: "open safety" or "open planner" or "read page".
- Keyboard users can press Tab to navigate buttons and use the skip link.
