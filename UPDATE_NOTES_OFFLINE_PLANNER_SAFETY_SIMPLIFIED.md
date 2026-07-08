# Offline Planner + Safety Simplification Update

This update implements the requested hackathon cleanup:

- Offline / Low Signal mode now focuses on saved train plans, offline route snapshots, important document metadata and one backup suggestion.
- User should save a plan while online, then generate the offline pack. When offline, the saved route, destination, journey mode, train name, path and timing are visible.
- Offline Emergency Pack card now lists important documents from the local document vault when a pack exists.
- Safety Mode now keeps only Lost Passport, Medical Emergency and Robbery / Theft.
- Removed Need Police, Embassy, Lost Wallet and Lost Phone cards from the Safety Mode flow.
- Removed emergency phrases section from emergency detail pages.
- Replaced interactive checklists with simple important points.
- Robbery / Theft detail no longer shows a checklist; it shows fast action only.
- Medical mode now has one-tap location alert actions for SMS/WhatsApp contact and ambulance dialer. Browser/user confirmation is still required.
- Planner no longer shows route combination and urgency input fields.
- Planner now shows only selected transport options.
- Backup UI now shows one suggested backup option rather than Backup 1 / Backup 2.
- Transport comparison is simplified into graph-style bars for Train vs Flight vs Bus.
- Admin route/navigation removed.
- Analyze Journey now has station/city suggestions and improved score breakdown.
- Package lock removed to avoid internal registry URL install errors on user machines; run `npm install` to generate a fresh lock file.

Browser safety note: no website can silently send GPS, WhatsApp, SMS, or call ambulance/emergency numbers without user permission/confirmation. The UI now states and follows this rule.
