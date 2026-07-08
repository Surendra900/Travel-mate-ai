# TravelMate final refinement update

Updated based on latest requested feature list:

- Battery badge remains visible in status bar/SOS area; browser-supported Battery API shows percentage and charging state.
- Document vault now supports create lock, enter lock, change lock, and forgotten-lock reset with a clear warning that local documents are deleted.
- Update lock flow now shows errors/success messages and requires old lock + different new lock + confirm new lock.
- Date input styling improved with modern dark UI treatment.
- Carbon calculator removed from planner UI.
- Passenger selection changed to a stable 1–6 dropdown to avoid reversed number-spinner behavior.
- Service cards now use `Book ticket` and open the demo booking/payment interface through the planner.
- Backup recommendations include a booking button for the suggested backup.
- Booking modal wording updated from demo/coming-soon labels to `Book ticket` while still warning that final ticket issue requires provider verification.
- Offline document saves now refresh the offline pack so documents are accessible in low/no internet mode from the same device.
- Added responsive CSS refinements for mobile/tablet/laptop/desktop.
