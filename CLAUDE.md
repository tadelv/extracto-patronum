# Extracto Patronum

Espresso machine dashboard UI — a "skin" for the DE1 espresso machine backend.
Svelte 5 SPA with hash-based routing (svelte-spa-router), Tailwind CSS v4, Vite 8.

## Commands
- `npm run dev` — dev server
- `npm run build` — production build to dist/
- `npm test` — run tests (vitest, jsdom)
- `npm run test:watch` — watch mode

## Architecture
- Pages in `src/pages/`, shared components in `src/lib/components/`
- Stores (Svelte writable/derived) in `src/lib/stores/`
- API client in `src/lib/api/` — REST via fetch, WebSocket for live data
- Backend at `http://{VITE_API_HOST}:8080`, WS at `ws://{host}:8080/ws/v1`
- Tests colocated as `__tests__/*.test.js` next to source

## Style
- Dark theme with warm amber/orange palette (Material You tokens in app.css @theme)
- Fonts: Manrope (body), Space Grotesk (labels)
- Plain JS (no TypeScript) — keep it that way
- Svelte 5 runes syntax ($state, $derived, etc.)

## Future / Backlog
- **Gauge vs Chart toggle**: Add setting to replace shot gauge + timer with the extraction chart on the main dashboard. Chart + notes move to a slide-over drawer (see PR #X).
