# Update notes: cabins, voice assistant, route inputs, admin cleanup

## Added / changed

- Added full cabin/class lists for Train, Flight and Bus.
- Planner, Emergency/Tatkal and Low Network modes now switch cabin options based on selected transport.
- Removed hardcoded Hyderabad → Delhi defaults. Users now see empty route inputs with mode-specific placeholders.
- Train mode labels: Boarding station / Destination station.
- Bus mode labels: Boarding hub / Destination hub.
- Flight mode labels: From city / airport / To city / airport.
- Booking modal exact option snapshot now shows all available services for the selected transport mode before selected route legs.
- Voice assistant was upgraded to handle natural commands such as:
  - open planner
  - open safety
  - set train from Rajahmundry to Delhi
  - search bus from Hyderabad to Vijayawada
  - select flight
  - choose cabin AC sleeper
  - emergency mode
  - find tickets
  - call emergency
  - read page
- Admin dashboard now reads local service stats more realistically and avoids implying a live backend.
- Removed the “Offline Catalogue Active” navbar badge.
- Replaced several visible “offline catalogue” labels with “local route dataset / provider verification required.”

## Build test

`npm run build` passed successfully.
