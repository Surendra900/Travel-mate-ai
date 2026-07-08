# Emergency accessibility + Tatkal refinement

- Added Lost Passport back before Medical Emergency.
- Battery badges now show a numeric style (`Battery: --%` when browser blocks Battery API, percentage when available) instead of the old unavailable text.
- Document vault reset now asks for a new lock and confirm lock; forgotten-lock reset warns that local documents will be deleted.
- Flight and bus route inputs now use simple From/To labels.
- Booking estimate no longer shows available seats and WL together; it shows either available seats or waitlist with chance.
- Booking is blocked until From and To are entered.
- Backup analysis now requires clicking Analyze & suggest best; Mark as suggested was removed.
- Suggested train/flight/bus legs now have separate Book ticket buttons.
- Tatkal timer now shows 10 AM AC and 11 AM Non-AC windows and supports 5/10 minute alarm reminders.
- Emergency Tatkal mode asks which train the user wants and suggests the best-chance train.
- Added blind-user voice mode prompt and voice-controlled assistant panel.

Browser limitation: normal websites cannot silently send SMS/WhatsApp/GPS or call emergency services without user/browser confirmation. The app prepares and opens those actions.
