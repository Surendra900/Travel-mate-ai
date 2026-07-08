# Service snapshot and mobile responsiveness update

## Changes

- The service options board now opens the booking modal for an exact train/flight/bus option.
- The booking modal exact selection snapshot now lists every available service for the selected transport mode.
- Each service row has:
  - select this train/flight/bus
  - book this train/flight/bus · coming soon
  - code/number, timing, fare, reliability, classes/cabins, verification note
- Planner route fields stay empty by default; no forced Hyderabad/Delhi route.
- Mobile layout improved:
  - compact navbar icons on phones
  - better modal sizing
  - full-width buttons on small screens
  - no horizontal overflow
  - larger input touch targets

## Important positioning

The app shows route and service preparation from the local dataset. Live seat availability, final fares, official platform/gate/bay and confirmed booking still require authorized provider APIs.
