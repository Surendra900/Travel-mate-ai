# Voice Conversation AI Accessibility Update

Added a demo-safe voice accessibility layer without restructuring the existing app.

## Added files
- `src/hooks/useVoiceConversation.js`
- `src/components/VoiceConversationAssistant.jsx`
- `api/voice/claude.js`

## App wiring
- `App.jsx` now imports `useNavigate` and `VoiceConversationAssistant`.
- `App.jsx` defines the three real action handlers expected by the voice assistant:
  - `search_route(from, to, sort)`
  - `open_emergency_mode()`
  - `navigate_page(page)`
- The old command-style voice component is not rendered; the new push-to-talk voice assistant is rendered globally.

## Environment variables
Add in Vercel Environment Variables:

```
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-sonnet-4-6
```

If the Anthropic key is not configured, the endpoint falls back to a local rule-based demo mode so the hackathon demo does not break.

## Demo behavior
- Hold/tap mic to talk.
- AI responds with short spoken replies.
- After speaking, it asks the user to tap again instead of auto-listening.
- Unsupported browsers get a text fallback input.
- Voice can search a route, open Emergency Mode, and navigate app pages.
