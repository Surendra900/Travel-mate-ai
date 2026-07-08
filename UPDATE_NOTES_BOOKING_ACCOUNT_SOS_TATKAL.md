# Booking, Account, SOS and Tatkal Alarm Update

## Added
- First-time local account setup with name, phone, email, emergency contact and optional IRCTC username.
- Demo OTP verification flow for first-time setup.
- In-app booking interface after clicking "Book inside app · Coming soon".
- Booking interface asks passenger name, phone, email and IRCTC username for train booking preparation.
- Demo OTP verification before payment-method screen.
- Payment method screen for UPI/Card/Net banking, clearly locked until licensed provider/API approval.
- SOS timer removed from the crisis panel.
- SOS Call 112 button now attempts to capture location, copies/shares emergency alert, then opens emergency dialer.
- Emergency contact vault now includes SMS/WhatsApp alert actions for saved contacts.
- Tatkal Emergency Mode now shows current time.
- Tatkal alarm can be enabled with one click and alerts user when Tatkal window is close.

## Honest limitations
- Real OTP sending requires backend SMS/email gateway.
- Websites cannot silently send GPS to 112 or phone contacts; the user must approve sharing/calling.
- Real payment/ticket issuance requires licensed provider/API approval.
