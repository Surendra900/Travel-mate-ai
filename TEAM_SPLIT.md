# Team Split — Two Remote Beginners

Do not both work on the same file at the same time. You will create merge conflicts and waste time.

## Person 1 branch

```bash
git checkout -b safety-module
```

Work on:
- `src/pages/Home.jsx`
- `src/pages/SafetyMode.jsx`
- `src/pages/EmergencyDetail.jsx`
- `src/components/EmergencyCard.jsx`
- `src/components/ProgressChecklist.jsx`
- `src/data/emergencyData.js`
- `src/data/languageData.js`

Testing responsibility:
- Every Safety Mode card opens.
- Every checklist progress updates.
- Call links use `tel:`.
- Copy buttons show copied confirmation.
- Emergency phrases are visible.

## Person 2 branch

```bash
git checkout -b planner-module
```

Work on:
- `src/pages/Planner.jsx`
- `src/pages/SavedPlans.jsx`
- `src/pages/AnalyzeJourney.jsx`
- `src/pages/AdminDashboard.jsx`
- `src/planner/*`
- `src/components/BookingModal.jsx`
- `src/components/StatusBar.jsx`
- `src/utils/*`
- `src/data/journeyData.js`
- `src/data/analyticsData.js`

Testing responsibility:
- Normal/Emergency/Low Network modes look different.
- Saved plans save to browser and reopen.
- Offline pack is generated.
- Booking modal is honest and opens official portal.
- Admin and Analyze pages say Demo Dataset / Local Simulation.

## Merge routine

At the end of each day:

```bash
git add .
git commit -m "complete my module changes"
git push origin your-branch-name
```

One person creates a Pull Request. The other reviews. Merge only after `npm run build` works.

## Strict rules

1. Do not add backend before frontend MVP is complete.
2. Do not claim live ticket booking.
3. Do not add fake PNR, fake payment, or fake confirmed ticket.
4. Do not add random emergency numbers.
5. Do not leave any dead buttons.
6. Do not keep three planner modes visually identical.
