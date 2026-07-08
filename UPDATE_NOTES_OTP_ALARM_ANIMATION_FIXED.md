# TravelMate AI update: OTP, alarm toggle, animation rollback

Changes made:

1. Animation rollback
   - Removed heavy infinite glow/float animations from cards and buttons.
   - Kept the previous clean dark glass UI with normal hover transitions.

2. Tatkal alarm select/deselect
   - Tatkal Emergency Timer now has Enable alarm and Disable buttons.
   - Alarm can be turned on or off by the user.
   - Browser sound/notification still requires a user click, as required by browser security.

3. OTP fixed for demo mode
   - First-time sign-in OTP now always works in frontend demo mode.
   - Booking platform OTP now always works in frontend demo mode.
   - Demo OTP is fixed to 123456 and shown on screen.
   - Added Use Demo OTP buttons so judges can fill it instantly.
   - Real OTP still requires backend SMS/email provider endpoints.

Important demo line:
The app uses fixed demo OTP 123456 for hackathon testing. Real OTP sending requires connecting SMS/email provider endpoints such as Firebase, Twilio, MSG91, or Fast2SMS.
