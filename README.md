<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f582e2ac-76c3-42d6-9781-9ca38f293bd4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Scripts
- `npm run dev` - start the app (use `npm install --legacy-peer-deps` the first time)
- `npm test` - unit tests (encryption, HD accounts, recipient safety, currency)
- `npm run build` - production build (screens are code-split)

## Features
Light / dark / system theme, multiple accounts (HD index), address book, ENS names, send safety checks,
fee-speed presets, 9 display currencies, auto-lock, hide/show tokens, pull-to-refresh, offline/retry banner,
market sparklines, installable PWA (manifest + icons). See `docs/SECURITY_NOTES.md` for limitations.
