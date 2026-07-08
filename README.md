# TravelMate — Flowzint Hackathon MVP

Emergency-first travel copilot for safety, crisis response, low-network travel and booking preparation.

## What this project is
TravelMate helps users during lost passport, medical emergency, robbery/theft, lost wallet, lost phone, weak network, low battery and urgent Tatkal/travel preparation.

## What this project is not
This is **not** a live ticket-booking website. Booking buttons are a **licensed-integration showcase**. They validate/prep details, save the plan, and open the official portal. Do not show fake PNRs, fake payments or fake confirmed tickets.

## Install required software

### 1. Download Node.js
Install the LTS version from the official Node.js website.

After installing, check:

```bash
node -v
npm -v
```

### 2. Download VS Code
Install Visual Studio Code.

Recommended VS Code extensions:
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prettier - Code formatter

### 3. Download Git
Install Git so both teammates can work remotely.

Check:

```bash
git --version
```

## How to run this project

Open terminal in the project folder:

```bash
cd travelmate-ai
npm install
npm run dev
```

Then open the local URL shown in terminal, usually:

```text
http://localhost:5173
```

## Build for final submission

```bash
npm run build
```

Preview final build:

```bash
npm run preview
```

## Deployment option

Use Vercel or Netlify.

Vercel steps:
1. Push project to GitHub.
2. Open Vercel.
3. Import GitHub repo.
4. Framework: Vite.
5. Build command: `npm run build`.
6. Output directory: `dist`.
7. Deploy.

## Project structure

```text
src/
├── App.jsx
├── main.jsx
├── index.css
├── components/
│   ├── Navbar.jsx
│   ├── StatusBar.jsx
│   ├── LanguageSelector.jsx
│   ├── BookingModal.jsx
│   ├── EmergencyCard.jsx
│   └── ProgressChecklist.jsx
├── pages/
│   ├── Home.jsx
│   ├── SafetyMode.jsx
│   ├── EmergencyDetail.jsx
│   ├── Planner.jsx
│   ├── SavedPlans.jsx
│   ├── AnalyzeJourney.jsx
│   └── AdminDashboard.jsx
├── planner/
│   ├── NormalPlanner.jsx
│   ├── EmergencyTatkalPlanner.jsx
│   ├── LowNetworkPlanner.jsx
│   ├── PNRTracker.jsx
│   ├── PricePredictor.jsx
│   ├── CarbonCalculator.jsx
│   └── LiveStationDashboard.jsx
├── data/
│   ├── emergencyData.js
│   ├── journeyData.js
│   ├── languageData.js
│   └── analyticsData.js
└── utils/
    ├── deviceStatus.js
    ├── storage.js
    └── scoring.js
```

## Two-person work split

### Person 1 — Safety + content owner
Owns:
- Home page emergency-first message
- Safety Mode page
- Emergency detail pages
- SOS panel
- Call/copy buttons
- Translation phrases
- Emergency data accuracy notes
- Final demo script

Files:
- `src/pages/Home.jsx`
- `src/pages/SafetyMode.jsx`
- `src/pages/EmergencyDetail.jsx`
- `src/components/EmergencyCard.jsx`
- `src/components/ProgressChecklist.jsx`
- `src/data/emergencyData.js`
- `src/data/languageData.js`

### Person 2 — Planner + persistence owner
Owns:
- Planner modes
- Device status detection
- Booking showcase modal
- Saved Plans
- Offline Pack
- Analyze Journey
- Admin Dashboard
- Deployment

Files:
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

## Daily plan until July 4

### Day 1
Both teammates install Node, VS Code, Git. Run the starter project locally.

### Day 2
Person 1 completes Home and Safety Mode. Person 2 completes Planner shell and mode switch.

### Day 3
Person 1 completes all emergency pages and translation phrases. Person 2 completes Normal, Emergency/Tatkal and Low Network planners.

### Day 4
Person 1 checks all call/copy/checklist actions. Person 2 completes BookingModal, SavedPlans and OfflinePack.

### Day 5
Complete Analyze Journey and Admin Dashboard. Fix responsive layout.

### Day 6
Dead-click testing: every button must do something visible. Do not leave placeholder buttons.

### Day 7
Accuracy pass: no fake live booking, no fake PNR, no fake confirmed ticket, no fake live analytics.

### Day 8
Deploy to Vercel/Netlify and test on mobile.

### July 4
Record final demo video, prepare pitch, freeze changes.

## Judge demo script

TravelMate is an emergency-first travel copilot. Normal travel apps focus on booking, but this project focuses on what happens when travel breaks down: lost passport, theft, medical emergency, low battery, weak network and urgent Tatkal preparation.

Safety Mode gives crisis-specific actions with call, copy, location share and progress checklists. Planner has three clear modes: Normal has full tools, Emergency/Tatkal hides heavy dashboards and focuses on readiness, Low Network uses compact offline data. Saved Plans and Offline Pack work through localStorage. Booking is intentionally shown as a licensed-integration showcase: it prepares details and opens the official portal; live ticket issuance requires authorized integration.

## Final MVP checklist

- Home page looks polished and emergency-first.
- Navbar routes work.
- Safety Mode cards open real detail pages.
- SOS modal has call, copy and location actions.
- Emergency checklists update progress.
- Planner modes look different.
- Device status bar works with fallback.
- Booking modal says demo/licensed integration.
- Saved plans can save, open, delete, use offline and book.
- Analyze/Admin labels say Demo Dataset or Local Simulation.
- Language selector changes key UI labels.
- No dead buttons.
