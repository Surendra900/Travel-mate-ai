# Automatic Offline Mode Update

This version automatically shifts to Low Network / Offline Mode when internet or mobile data dies.

What changed:
- Added OfflineModeBanner component.
- Planner now forces Low Network mode when `navigator.onLine === false`.
- Offline pack is generated automatically once the app opens online.
- App shell and runtime assets are cached for production/preview builds.
- Development mode unregisters stale service workers to prevent old blank-screen cache problems.

Important limitations:
- Offline works only after the app has been opened at least once online.
- Live maps, live ticket availability, PNR, train status, bus status and flight inventory cannot update without internet.
- Offline data comes from localStorage and previously cached app assets.

Testing:
1. npm install --no-audit --no-fund
2. npm run build
3. npm run preview
4. Open http://localhost:4173 while online.
5. Click Prepare Offline Mode.
6. Save at least one plan and generate Offline Pack.
7. DevTools > Network > Offline.
8. Refresh. The app should show Offline Mode Active and Planner should force Low Network mode.
