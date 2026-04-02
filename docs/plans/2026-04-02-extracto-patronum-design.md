# Extracto Patronum — Design Document

## Overview

Extracto Patronum is a single-page PWA "skin" for the Streamline Bridge API, served directly by the Bridge on port 3000. It controls DE1/LEVA espresso machines, providing an onboarding flow, real-time brewing dashboard with steam controls, profile editing, shot history, and machine maintenance.

**Stitch project**: `projects/14108384715186398907` — 9 designed screens covering onboarding, dashboard, extraction lab, history, and maintenance.

## Tech Stack

- **Vite + Svelte** — client-side SPA, no SSR
- **Tailwind CSS** — utility-first, configured with Stitch design tokens
- **svelte-spa-router** — hash-based routing (`#/dashboard`, etc.)
- **No backend** — all data from Streamline Bridge REST + WebSocket APIs

## API Connection

The Bridge API runs on port 8080 of the same host that serves the skin (port 3000).

```
const API_HOST = import.meta.env.VITE_API_HOST || window.location.hostname
const API_BASE = `http://${API_HOST}:8080/api/v1`
const WS_BASE = `ws://${API_HOST}:8080/ws/v1`
```

`VITE_API_HOST` is the dev-time override for developing against a remote Bridge.

## Project Structure

```
src/
  lib/
    api/          # REST client + WebSocket managers
    stores/       # Svelte stores (machine, scale, devices, workflow, shots)
    components/   # Shared UI components (Gauge, Chart, Card, etc.)
  pages/
    Onboarding/   # Multi-step onboarding flow
    Dashboard.svelte
    ExtractionLab.svelte
    History.svelte
    Maintenance.svelte
    Settings.svelte
  App.svelte      # Router shell + top bar nav
```

## API Layer

### REST Client

Thin wrappers: `api.get(path)`, `api.put(path, body)`, `api.post(path, body)`, `api.del(path)`.

### WebSocket Manager

`createSocket(path)` returns a Svelte readable store. Auto-reconnects on disconnect. The store holds the latest parsed JSON message.

### WebSocket Streams

- `machineSnapshot` — `/ws/v1/machine/snapshot` (~10Hz). Pressure, flow, temperatures, state.
- `scaleSnapshot` — `/ws/v1/scale/snapshot` (~5-10Hz). Weight, battery, timer.
- `devices` — `/ws/v1/devices` (on change, bidirectional). Device list, connection states. Accepts commands: scan, connect, disconnect.

### Stores

- **`machineState`** — derived from `machineSnapshot`. Exposes `state`, `substate`, `isIdle`, `isBrewing`, `isSteaming`, etc.
- **`workflow`** — fetched via `GET /api/v1/workflow` on load. Updated via `PUT /api/v1/workflow`. Also persisted to skin store (`/api/v1/store/extracto-patronum/workflow`) so other skins changing the Bridge workflow don't affect us.
- **`onboardingState`** — persisted to `/api/v1/store/extracto-patronum/onboarding`. Tracks completion flag and step progress.
- **`shots`** — paginated list from `GET /api/v1/shots`. Refreshed after each brew.
- **`devices`** — fed by the `/devices` WebSocket. Used for connection status display and scan/connect actions.

## Routing

| Route | Component | Guard |
|-------|-----------|-------|
| `#/` | Redirect | → `#/onboarding` if not completed, else `#/dashboard` |
| `#/onboarding` | Onboarding | — |
| `#/dashboard` | Dashboard | Requires onboarding complete |
| `#/lab` | ExtractionLab | Requires onboarding complete |
| `#/history` | History | Requires onboarding complete |
| `#/maintenance` | Maintenance | Requires onboarding complete |
| `#/settings` | Settings | — |

## App Shell

Top bar layout (maximizes horizontal space for landscape tablet):
- **Left**: Device connection status — machine + scale indicators. Clicking a disconnected indicator triggers scan via devices WebSocket.
- **Right**: Nav links (Dashboard, Lab, History, Maintenance) + settings gear icon.

## Pages

### Onboarding (4 steps)

Persisted to Bridge key-value store. Can be re-triggered from Settings.

1. **Roast Selection** ("What's on Bar today?") — Roast spectrum selector (Light→Dark), bean metadata (name, origin, processing method). Creates/selects a bean entity via `/api/v1/beans`. Populates workflow context.
2. **Shot Profile** ("Select Your Extraction Intent") — Choose from profiles fetched via `/api/v1/profiles`. Three highlighted presets (Classic 9-Bar, Turbo Shot, Flow-Profiled) plus browse all.
3. **Extraction Targets** — Set dose and yield, auto-calculated ratio. Updates workflow context.
4. **Review & Confirm** — Summary of selections. "Bake Profile" writes the complete workflow via `PUT /api/v1/workflow` and saves to skin store.

### Dashboard

The primary drink-making screen. Reacts to machine state.

- **Bean identity** — current coffee name, roast, origin (from workflow context)
- **Dual gauges** — pressure (bar) + flow (ml/s) as hero metrics
- **Temperature readouts** — water mix temp + group head temp (from machineSnapshot)
- **Reservoir level** — water level percentage
- **Shot timer** — activates when machine enters `espresso` state
- **Target yield + active profile** — from workflow
- **Status indicators** — system stability, maintenance due, connection state
- **Extraction curve** — real-time line chart during brew (pressure + flow vs time), shows last shot when idle
- **Extraction intelligence** — recommendations panel, tasting notes
- **Steam milk panel** — target steam temp with +/- adjustment, duration, flow rate. "Start Steam" gradient CTA triggers `PUT /api/v1/machine/state/steam`. Live steam temp from `machineSnapshot.steamTemperature`. Copper glow effect when active. "Steam Rinse" button for cleanup.

### Extraction Lab

Profile editor for tweaking brewing parameters.

- **Parameter cards** — dose, target pressure, target flow, grind size (editable, updates workflow)
- **Temperature control** — prominent display with adjustment
- **Profile steps visualization** — shows step sequence (preinfusion → ramp → hold, etc.)
- **Save/Reset** — saves modified profile via Workflow API + skin store, or resets to last saved

### History

- **Extraction archive** — paginated table from `/api/v1/shots` with filtering by bean, grinder, profile
- **Pressure consistency chart** — visualizes variance across recent shots
- **Shot detail** — click a row to see full measurements, extraction curve, annotations
- **Stats footer** — thermal profile average, yield precision (+/- g), taste trend

### Maintenance

- **Machine health alerts** — descaling countdown, cleaning reminders (tracked via skin store counters + shot count)
- **Backflush routine** — step-by-step checklist, triggers flush commands via `PUT /api/v1/machine/state/flush`
- **Water quality** — manual entry fields persisted to skin store
- **Cycle stats** — total shots, time since last maintenance

### Settings

- **API connection** — host override (dev use)
- **Interface mode** — Operator vs Tinkerer (controls detail level across pages)
- **Re-run onboarding** — resets onboarding flag
- **Device preferences** — preferred machine/scale IDs for auto-connect
- **Display brightness** — slider controlling `/api/v1/display/brightness`
- **Presence/sleep schedules** — manage wake schedules via `/api/v1/presence/schedules`

## Design System (from Stitch)

"The Analog Precision" — a dark, premium aesthetic inspired by high-end horology and lab equipment.

- **Palette**: background `#161311`, surfaces layered tonally (no borders), primary amber `#ffb77d`, container `#d97707`
- **Typography**: Manrope (artisan/headers), Space Grotesk (technical data, all-caps tracked labels)
- **Borders**: forbidden for sectioning — use tonal surface shifts instead
- **CTAs**: gradient from `primary` to `primary_container` at 45°
- **Elevation**: ambient copper glow (8% opacity, 48px blur) instead of drop shadows
- **Input fields**: bottom-only ghost border, no background fill
- **List items**: no dividers — alternating tints with spacing
