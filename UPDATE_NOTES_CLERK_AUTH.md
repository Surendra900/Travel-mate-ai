# Clerk authentication added

This package connects the TravelMate React + Vite app to Clerk.

## Added / changed

- Added `@clerk/clerk-react` dependency.
- Wrapped the app in `ClerkProvider` in `src/main.jsx`.
- Replaced the local demo `AccountMenu` with real Clerk `SignInButton` and `UserButton`.
- Added `VITE_CLERK_PUBLISHABLE_KEY` to `.env.local` and `.env.local.example`.
- Stopped the old local profile modal from automatically blocking first page load.

## Vercel variable

Add this in Vercel Project Settings → Environment Variables:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_d2VsY29tZS1za3lsYXJrLTE0LmNsZXJrLmFjY291bnRzLmRldiQ
```

Select Production, Preview and Development, then redeploy.

## Commands

```cmd
npm install
npm run build
vercel --prod
```
