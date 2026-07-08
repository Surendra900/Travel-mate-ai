# TravelMate Tatkal Payment + Sign-In Refinement

Updated for hackathon demo:

- Emergency mode is now Tatkal train-only.
- Removed emergency readiness score block.
- Emergency mode no longer exposes flight/bus transport selection.
- If no Tatkal train is selected, available Tatkal trains are shown with select/book actions.
- If a train is selected, Book Tatkal opens the payment gateway demo.
- Booking modal opens a payment gateway preview after Book Ticket.
- Non-Tatkal timing warning now shows AC Tatkal 10:00 AM and Non-AC Tatkal 11:00 AM plus 5/10 minute alarm suggestions.
- Added a Clerk-style local account menu showing user profile, manage account, sign out, and development-mode note.
- No fake payment, no fake PNR, and no fake confirmed ticket are generated.

Limitations:

- Real payment, OTP delivery, IRCTC ticket issue, and confirmed PNR require authorized provider/API integration.
