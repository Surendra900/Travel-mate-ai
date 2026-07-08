# TravelMate voice and Tatkal scoring refinement

Updates in this package:

- Blind-person voice mode now starts from a full-screen accessibility prompt.
- The prompt speaks automatically, supports Enter/B keyboard activation, and tries to listen for “yes I am blind” when browser permissions allow it.
- Voice assistant can open SOS, medical emergency, planner, Tatkal, low-signal planner, saved plans, analyzer, safety mode, and read the current page.
- Medical emergency voice flow prepares location alert and opens SMS/ambulance actions with browser permission/confirmation.
- Tatkal readiness score now uses route, date, selected target train, passenger count, and six readiness items.
- Tatkal score shows a scoring breakdown so the user understands why the score changed.
- Target train dropdown now shows clearer demo train names, departure time, and reliability.
- Fallback catalogue train names changed from generic “candidate” labels to clearer demo train names.

Browser limitation: normal websites cannot silently start microphone, send SMS/WhatsApp/GPS, or call emergency services without user permission/confirmation.
