# Final API + SOS + Planner Cleanup Update

Updated items:

1. Global SOS button
   - Visible on every page/mode.
   - One tap opens `tel:112` emergency dialer.
   - Shows battery percentage when browser supports Battery API.

2. Flight API endpoint
   - Added `/api/flights/search.js` using Aviationstack environment variable `AVIATIONSTACK_API_KEY`.
   - Falls back safely when the key is missing or provider returns no data.
   - Does not hard-code secrets in frontend code.

3. Train running status
   - Added `/api/trains/status.js`.
   - Added `TrainRunningStatus` UI card.
   - Works with local fallback immediately and can proxy a future authorized railway provider.

4. Planner filtering cleanup
   - If Train is selected, train cards only.
   - If Flight is selected, flight cards only.
   - If Bus is selected, bus cards only.
   - Mixed route cards appear only when the selected route combination is intentionally mixed.

5. Battery percentage
   - StatusBar already shows battery when supported.
   - Floating SOS also shows battery percentage on desktop.

6. Saved Plans offline pack condition
   - Full route offline pack can only be generated after at least one saved route exists.
   - Button disables when no route exists or when pack is already current.

Deployment:

```bash
npm run build
vercel --prod
```

Vercel Environment Variables:

```env
AVIATIONSTACK_API_KEY=your_key_here
AVIATIONSTACK_BASE_URL=https://api.aviationstack.com/v1
```
