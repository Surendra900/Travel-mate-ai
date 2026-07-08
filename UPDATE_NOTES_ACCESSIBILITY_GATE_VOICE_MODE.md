# Accessibility Gate + Voice Mode Update

## Added
- `src/components/AccessibilityGate.jsx`
- `src/components/VoiceModeApp.jsx`

## Updated
- `src/App.jsx`
- `src/hooks/useVoiceConversation.js`
- `src/components/VoiceConversationAssistant.jsx`
- `.env.local.example`

## Behavior
- First page load shows a full-screen accessibility gate.
- The gate auto-focuses and speaks: "Welcome to TravelMate. Are you blind or visually impaired? Say yes for voice mode, or say no, or press any key, for the standard site."
- User can choose by voice, keyboard, or high-contrast buttons.
- Choice is stored in `localStorage` as `travelmate-accessibility-mode`.
- Voice mode wraps the existing app and opens a push-to-talk assistant.
- Standard mode mounts the existing app shell without forcing voice mode.
- Voice assistant uses Web Speech API and falls back to typed input when SpeechRecognition is unsupported.
- `/api/voice/claude.js` uses Claude tool-use with exactly these tools:
  - `search_route`
  - `open_emergency_mode`
  - `navigate_page`
- If `ANTHROPIC_API_KEY` is missing, the endpoint uses local fallback rules so the demo still works.

## Vercel environment variables
```
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-sonnet-4-6
```

## Browser limitation
Browsers may still require a user permission prompt before microphone access. SpeechSynthesis is attempted automatically, but some mobile browsers may delay it until the first user gesture.
