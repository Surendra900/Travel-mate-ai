# TravelMate offline/auth refinement

Changes in this package:

- Renamed visible product branding to TravelMate.
- Added offline-only runtime screen: when browser is offline, normal navigation is hidden and only saved route snapshot, offline documents, emergency call and one practical backup are shown.
- Offline pack now keeps local document data for offline access on the same device.
- Document vault now asks for new lock + confirm lock before opening.
- Backup plan panel now shows all backup options in normal/emergency mode and includes a Suggest best action; low-network mode shows only one best backup.
- Removed checklist tracking badge/numbered checklist UI from emergency detail pages.
- Kept robbery/theft as fast-action-only without checklist panel.
- Added provider-ready email/mobile sign-in panel and removed fake OTP generation from OTP utility. Real OTP requires VITE_OTP_SEND_ENDPOINT and VITE_OTP_VERIFY_ENDPOINT.
- Improved battery/signal status display using Battery API and Network Information API when supported by browser.
- Improved date input styling.
- Improved analysis scoring formula using route fields, budget, availability risk, date confidence and backup strength.

Important security/browser limits:

- Browser apps cannot silently send GPS to contacts or ambulance without user permission/action.
- Real OTP cannot work without an SMS/email provider backend.
- Signal/battery accuracy depends on browser support.
