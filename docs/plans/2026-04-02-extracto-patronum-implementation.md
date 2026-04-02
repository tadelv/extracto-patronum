# Extracto Patronum Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-page PWA skin for the Streamline Bridge API that controls DE1/LEVA espresso machines with onboarding, real-time dashboard, profile editing, shot history, and maintenance.

**Architecture:** Vite + Svelte SPA with Tailwind CSS, hash-based routing, Svelte stores fed by WebSocket streams and REST calls. Deployed as a static folder served by the Bridge on port 3000, API on port 8080.

**Tech Stack:** Svelte 5, Vite, Tailwind CSS v4, svelte-spa-router, vitest + @testing-library/svelte

**Design reference:** Stitch project `14108384715186398907`, design doc at `docs/plans/2026-04-02-extracto-patronum-design.md`

**API reference:** Streamline Bridge REST API at `~/development/repos/reaprime/assets/api/rest_v1.yml`, WebSocket at `~/development/repos/reaprime/assets/api/websocket_v1.yml`, Skins guide at `~/development/repos/reaprime/doc/Skins.md`

---

## Phase 1: Project Scaffolding

### Task 1: Initialize Vite + Svelte project

**Files:**
- Create: `package.json`, `vite.config.js`, `svelte.config.js`, `index.html`, `src/main.js`, `src/App.svelte`

**Step 1: Scaffold Vite + Svelte**

```bash
cd /Users/vid/development/work/extracto-patronum
npm create vite@latest . -- --template svelte
```

Accept overwrite prompts. This creates the base Vite + Svelte project.

**Step 2: Install dependencies**

```bash
npm install
npm install svelte-spa-router
npm install -D vitest @testing-library/svelte jsdom
```

**Step 3: Verify dev server starts**

```bash
npm run dev -- --port 3000
```

Expected: Dev server running on http://localhost:3000 with default Svelte template.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + Svelte project"
```

---

### Task 2: Configure Tailwind CSS with Stitch design tokens

**Files:**
- Create: `src/app.css`
- Modify: `vite.config.js`, `src/main.js`, `index.html`

**Step 1: Install Tailwind**

```bash
npm install -D @tailwindcss/vite tailwindcss
```

**Step 2: Configure Vite plugin**

In `vite.config.js`:

```js
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
})
```

**Step 3: Create `src/app.css` with Tailwind + Stitch design tokens**

```css
@import "tailwindcss";

@theme {
  /* Colors - Stitch "Analog Precision" palette */
  --color-background: #161311;
  --color-surface: #161311;
  --color-surface-dim: #161311;
  --color-surface-bright: #3c3836;
  --color-surface-container-lowest: #100e0c;
  --color-surface-container-low: #1e1b19;
  --color-surface-container: #221f1d;
  --color-surface-container-high: #2d2927;
  --color-surface-container-highest: #383432;
  --color-surface-variant: #383432;

  --color-primary: #ffb77d;
  --color-primary-container: #d97707;
  --color-primary-fixed: #ffdcc3;
  --color-primary-fixed-dim: #ffb77d;
  --color-on-primary: #4d2600;
  --color-on-primary-container: #432100;
  --color-on-primary-fixed: #2f1500;
  --color-on-primary-fixed-variant: #6e3900;

  --color-secondary: #ffb68e;
  --color-secondary-container: #ab4c00;
  --color-secondary-fixed: #ffdbca;
  --color-secondary-fixed-dim: #ffb68e;
  --color-on-secondary: #532200;
  --color-on-secondary-container: #ffe2d5;

  --color-tertiary: #ccc5c1;
  --color-tertiary-container: #95908c;
  --color-on-tertiary: #33302d;

  --color-error: #ffb4ab;
  --color-error-container: #93000a;
  --color-on-error: #690005;
  --color-on-error-container: #ffdad6;

  --color-on-background: #e9e1dd;
  --color-on-surface: #e9e1dd;
  --color-on-surface-variant: #dbc2b0;
  --color-outline: #a38c7c;
  --color-outline-variant: #554336;

  --color-inverse-surface: #e9e1dd;
  --color-inverse-on-surface: #33302d;
  --color-inverse-primary: #904d00;

  --color-surface-tint: #ffb77d;

  /* Typography */
  --font-headline: 'Manrope', sans-serif;
  --font-body: 'Manrope', sans-serif;
  --font-label: 'Space Grotesk', monospace;

  /* Border radius - machined precision scale */
  --radius-xs: 0.125rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;
}

/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Space+Grotesk:wght@300;500;700&display=swap');

/* Base styles */
body {
  background-color: var(--color-background);
  color: var(--color-on-surface);
  font-family: var(--font-body);
  margin: 0;
  overflow: hidden;
  height: 100vh;
}

/* Stitch custom utilities */
@utility ambient-glow {
  box-shadow: 0 0 40px -10px oklch(from var(--color-primary-container) l c h / 0.15);
}

@utility ambient-glow-active {
  box-shadow: 0 0 60px -5px oklch(from var(--color-primary) l c h / 0.2);
}

@utility copper-glow {
  box-shadow: 0 0 48px oklch(from var(--color-primary) l c h / 0.08);
}

@utility glass-panel {
  background: oklch(from var(--color-surface-container-highest) l c h / 0.6);
  backdrop-filter: blur(20px);
}

@utility ghost-border {
  border: 1px solid oklch(from var(--color-outline-variant) l c h / 0.15);
}

@utility click-sink {
  &:active {
    transform: scale(0.98);
  }
}

@utility tactile-sink {
  &:active {
    transform: scale(0.95);
  }
}

@utility gradient-cta {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
}
```

**Step 4: Import CSS in `src/main.js`**

```js
import './app.css'
import App from './App.svelte'
import { mount } from 'svelte'

const app = mount(App, { target: document.getElementById('app') })

export default app
```

**Step 5: Add font links to `index.html`**

Add to `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Space+Grotesk:wght@300;500;700&display=swap" rel="stylesheet">
```

**Step 6: Update `App.svelte` with a test card**

```svelte
<div class="h-screen bg-background flex items-center justify-center">
  <div class="p-8 bg-surface-container rounded-xl ambient-glow">
    <h1 class="font-headline text-4xl font-extrabold text-primary tracking-tighter">
      Extracto Patronum
    </h1>
    <p class="font-label text-sm tracking-widest uppercase text-on-surface-variant mt-2">
      The Master Roaster's Console
    </p>
  </div>
</div>
```

**Step 7: Verify visually**

Run `npm run dev -- --port 3000`. Confirm: dark background, amber text, Manrope headline, Space Grotesk label, ambient glow on card.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: configure Tailwind CSS with Stitch design tokens"
```

---

### Task 3: Configure vitest

**Files:**
- Create: `vitest.config.js`, `src/lib/__tests__/smoke.test.js`

**Step 1: Create vitest config**

```js
import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,ts}'],
  },
})
```

**Step 2: Write a smoke test**

`src/lib/__tests__/smoke.test.js`:

```js
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('vitest is working', () => {
    expect(1 + 1).toBe(2)
  })
})
```

**Step 3: Add test script to `package.json`**

Add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Run tests**

```bash
npm test
```

Expected: 1 test passing.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure vitest with jsdom environment"
```

---

## Phase 2: API Layer

### Task 4: REST client

**Files:**
- Create: `src/lib/api/client.js`, `src/lib/api/__tests__/client.test.js`

**Step 1: Write failing tests**

`src/lib/api/__tests__/client.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '../client.js'

describe('REST client', () => {
  let client
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    client = createClient('http://localhost:8080')
  })

  it('GET request to correct URL', async () => {
    await client.get('/workflow')
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/workflow',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('PUT request with JSON body', async () => {
    const body = { targetDoseWeight: 18 }
    await client.put('/workflow', body)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/workflow',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    )
  })

  it('POST request with JSON body', async () => {
    await client.post('/beans', { roaster: 'Test', name: 'Test' })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/beans',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('DELETE request', async () => {
    await client.del('/shots/123')
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/shots/123',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('throws on non-OK response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
    await expect(client.get('/nope')).rejects.toThrow('404')
  })

  it('returns parsed JSON', async () => {
    const result = await client.get('/workflow')
    expect(result).toEqual({ data: 'test' })
  })
})
```

**Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — `createClient` not found.

**Step 3: Implement REST client**

`src/lib/api/client.js`:

```js
export function createClient(baseUrl) {
  const base = `${baseUrl}/api/v1`

  async function request(method, path, body) {
    const options = { method }
    if (body !== undefined) {
      options.headers = { 'Content-Type': 'application/json' }
      options.body = JSON.stringify(body)
    }
    const res = await fetch(`${base}${path}`, options)
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`)
    }
    return res.json()
  }

  return {
    get: (path) => request('GET', path),
    put: (path, body) => request('PUT', path, body),
    post: (path, body) => request('POST', path, body),
    del: (path) => request('DELETE', path),
  }
}
```

**Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: All 6 tests passing.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add REST API client with tests"
```

---

### Task 5: API singleton with host resolution

**Files:**
- Create: `src/lib/api/index.js`

**Step 1: Create the singleton**

`src/lib/api/index.js`:

```js
import { createClient } from './client.js'

const host = import.meta.env.VITE_API_HOST || window.location.hostname
const baseUrl = `http://${host}:8080`

export const api = createClient(baseUrl)
export const API_HOST = host
export const API_BASE = baseUrl
export const WS_BASE = `ws://${host}:8080/ws/v1`
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add API singleton with host resolution"
```

---

### Task 6: WebSocket manager

**Files:**
- Create: `src/lib/api/websocket.js`, `src/lib/api/__tests__/websocket.test.js`

**Step 1: Write failing tests**

`src/lib/api/__tests__/websocket.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSocket } from '../websocket.js'
import { get } from 'svelte/store'

class MockWebSocket {
  static instances = []
  constructor(url) {
    this.url = url
    this.readyState = 0 // CONNECTING
    MockWebSocket.instances.push(this)
  }
  close() { this.readyState = 3 }
  send(data) { this._lastSent = data }
  // Simulate server message
  _receive(data) {
    this.onmessage?.({ data: JSON.stringify(data) })
  }
  _open() {
    this.readyState = 1
    this.onopen?.()
  }
  _close() {
    this.readyState = 3
    this.onclose?.({ code: 1000 })
  }
  _error() {
    this.onerror?.(new Event('error'))
  }
}

describe('WebSocket manager', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('connects to the correct URL', () => {
    const { store, cleanup } = createSocket('ws://localhost:8080/ws/v1', '/machine/snapshot')
    expect(MockWebSocket.instances[0].url).toBe('ws://localhost:8080/ws/v1/machine/snapshot')
    cleanup()
  })

  it('store updates on message', () => {
    const { store, cleanup } = createSocket('ws://localhost:8080/ws/v1', '/machine/snapshot')
    const ws = MockWebSocket.instances[0]
    ws._open()
    ws._receive({ pressure: 9.1, flow: 2.5 })
    expect(get(store)).toEqual({ pressure: 9.1, flow: 2.5 })
    cleanup()
  })

  it('store holds latest message only', () => {
    const { store, cleanup } = createSocket('ws://localhost:8080/ws/v1', '/machine/snapshot')
    const ws = MockWebSocket.instances[0]
    ws._open()
    ws._receive({ pressure: 9.0 })
    ws._receive({ pressure: 9.1 })
    expect(get(store)).toEqual({ pressure: 9.1 })
    cleanup()
  })

  it('cleanup closes the socket', () => {
    const { cleanup } = createSocket('ws://localhost:8080/ws/v1', '/machine/snapshot')
    const ws = MockWebSocket.instances[0]
    cleanup()
    expect(ws.readyState).toBe(3)
  })
})
```

**Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — `createSocket` not found.

**Step 3: Implement WebSocket manager**

`src/lib/api/websocket.js`:

```js
import { writable } from 'svelte/store'

export function createSocket(wsBase, path) {
  const store = writable(null)
  let ws = null
  let reconnectTimer = null
  let stopped = false

  function connect() {
    if (stopped) return
    ws = new WebSocket(`${wsBase}${path}`)

    ws.onmessage = (event) => {
      try {
        store.set(JSON.parse(event.data))
      } catch {
        // ignore non-JSON messages
      }
    }

    ws.onclose = () => {
      if (!stopped) {
        reconnectTimer = setTimeout(connect, 2000)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }

  function send(data) {
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify(data))
    }
  }

  function cleanup() {
    stopped = true
    clearTimeout(reconnectTimer)
    ws?.close()
  }

  connect()

  return { store, send, cleanup }
}
```

**Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: All 4 tests passing.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add WebSocket manager with auto-reconnect and Svelte store"
```

---

## Phase 3: Stores

### Task 7: Machine snapshot store

**Files:**
- Create: `src/lib/stores/machine.js`, `src/lib/stores/__tests__/machine.test.js`

**Step 1: Write failing tests**

`src/lib/stores/__tests__/machine.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get } from 'svelte/store'

// Mock the websocket module before importing machine store
vi.mock('../../api/websocket.js', () => {
  const { writable } = require('svelte/store')
  const mockStore = writable(null)
  return {
    createSocket: vi.fn(() => ({
      store: mockStore,
      send: vi.fn(),
      cleanup: vi.fn(),
    })),
    _mockStore: mockStore,
  }
})

describe('machine store', () => {
  it('derives isIdle correctly', async () => {
    const { _mockStore } = await import('../../api/websocket.js')
    const { machineState } = await import('../machine.js')

    _mockStore.set({
      state: { state: 'idle', substate: 'idle' },
      pressure: 0,
      flow: 0,
      mixTemperature: 80,
      groupTemperature: 80,
      steamTemperature: 100,
    })

    expect(get(machineState).isIdle).toBe(true)
    expect(get(machineState).isBrewing).toBe(false)
  })
})
```

**Step 2: Implement machine store**

`src/lib/stores/machine.js`:

```js
import { derived } from 'svelte/store'
import { createSocket } from '../api/websocket.js'
import { WS_BASE } from '../api/index.js'

const { store: machineSnapshot, cleanup: cleanupMachine } = createSocket(WS_BASE, '/machine/snapshot')

export { machineSnapshot, cleanupMachine }

export const machineState = derived(machineSnapshot, ($snap) => {
  if (!$snap) {
    return {
      state: 'disconnected',
      substate: 'idle',
      isIdle: false,
      isBrewing: false,
      isSteaming: false,
      isSteamRinsing: false,
      isHeating: false,
      isFlushing: false,
      isSleeping: false,
      pressure: 0,
      flow: 0,
      mixTemperature: 0,
      groupTemperature: 0,
      steamTemperature: 0,
      targetPressure: 0,
      targetFlow: 0,
      targetMixTemperature: 0,
      targetGroupTemperature: 0,
      profileFrame: 0,
    }
  }

  const state = $snap.state?.state ?? 'idle'
  const substate = $snap.state?.substate ?? 'idle'

  return {
    state,
    substate,
    isIdle: state === 'idle',
    isBrewing: state === 'espresso',
    isSteaming: state === 'steam',
    isSteamRinsing: state === 'steamRinse',
    isHeating: state === 'heating' || state === 'preheating',
    isFlushing: state === 'flush',
    isSleeping: state === 'sleeping',
    pressure: $snap.pressure ?? 0,
    flow: $snap.flow ?? 0,
    mixTemperature: $snap.mixTemperature ?? 0,
    groupTemperature: $snap.groupTemperature ?? 0,
    steamTemperature: $snap.steamTemperature ?? 0,
    targetPressure: $snap.targetPressure ?? 0,
    targetFlow: $snap.targetFlow ?? 0,
    targetMixTemperature: $snap.targetMixTemperature ?? 0,
    targetGroupTemperature: $snap.targetGroupTemperature ?? 0,
    profileFrame: $snap.profileFrame ?? 0,
  }
})
```

**Step 3: Run tests, verify passing, commit**

```bash
npm test
git add -A
git commit -m "feat: add machine snapshot store with derived state"
```

---

### Task 8: Scale snapshot store

**Files:**
- Create: `src/lib/stores/scale.js`

**Step 1: Implement scale store**

`src/lib/stores/scale.js`:

```js
import { derived } from 'svelte/store'
import { createSocket } from '../api/websocket.js'
import { WS_BASE } from '../api/index.js'

const { store: scaleSnapshot, cleanup: cleanupScale } = createSocket(WS_BASE, '/scale/snapshot')

export { scaleSnapshot, cleanupScale }

export const scaleState = derived(scaleSnapshot, ($snap) => {
  if (!$snap) {
    return { weight: 0, batteryLevel: null, timerValue: null, connected: false }
  }
  return {
    weight: $snap.weight ?? 0,
    batteryLevel: $snap.batteryLevel ?? null,
    timerValue: $snap.timerValue ?? null,
    connected: true,
  }
})
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add scale snapshot store"
```

---

### Task 9: Devices store (bidirectional WebSocket)

**Files:**
- Create: `src/lib/stores/devices.js`

**Step 1: Implement devices store**

`src/lib/stores/devices.js`:

```js
import { derived } from 'svelte/store'
import { createSocket } from '../api/websocket.js'
import { WS_BASE } from '../api/index.js'

const { store: devicesRaw, send: sendDeviceCommand, cleanup: cleanupDevices } = createSocket(WS_BASE, '/devices')

export { devicesRaw, cleanupDevices }

export const devices = derived(devicesRaw, ($raw) => {
  if (!$raw) return { machines: [], scales: [], scanning: false }

  const list = Array.isArray($raw) ? $raw : ($raw.devices ?? [])
  return {
    machines: list.filter((d) => d.type === 'machine' || d.type === 'de1'),
    scales: list.filter((d) => d.type === 'scale'),
    scanning: $raw.scanning ?? false,
    all: list,
  }
})

export function scanDevices() {
  sendDeviceCommand({ command: 'scan' })
}

export function connectDevice(deviceId) {
  sendDeviceCommand({ command: 'connect', deviceId })
}

export function disconnectDevice(deviceId) {
  sendDeviceCommand({ command: 'disconnect', deviceId })
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add devices store with scan/connect/disconnect commands"
```

---

### Task 10: Workflow store with skin-store persistence

**Files:**
- Create: `src/lib/stores/workflow.js`

**Step 1: Implement workflow store**

`src/lib/stores/workflow.js`:

```js
import { writable, get } from 'svelte/store'
import { api } from '../api/index.js'

const SKIN_NS = 'extracto-patronum'

export const workflow = writable(null)
export const workflowLoading = writable(true)

export async function loadWorkflow() {
  workflowLoading.set(true)
  try {
    // Try skin store first (our persisted version)
    const skinWorkflow = await api.get(`/store/${SKIN_NS}/workflow`).catch(() => null)
    if (skinWorkflow?.value) {
      const parsed = typeof skinWorkflow.value === 'string'
        ? JSON.parse(skinWorkflow.value)
        : skinWorkflow.value
      workflow.set(parsed)
      // Push our workflow to the Bridge
      await api.put('/workflow', parsed).catch(() => {})
    } else {
      // Fall back to Bridge workflow
      const bridgeWorkflow = await api.get('/workflow')
      workflow.set(bridgeWorkflow)
      // Persist to skin store
      await persistToSkinStore(bridgeWorkflow)
    }
  } catch (e) {
    console.error('Failed to load workflow:', e)
    workflow.set(null)
  } finally {
    workflowLoading.set(false)
  }
}

async function persistToSkinStore(data) {
  try {
    await api.post(`/store/${SKIN_NS}/workflow`, { value: JSON.stringify(data) })
  } catch (e) {
    console.error('Failed to persist workflow to skin store:', e)
  }
}

export async function updateWorkflow(updates) {
  const current = get(workflow)
  const updated = { ...current, ...updates }
  workflow.set(updated)
  // Write to both Bridge and skin store
  await Promise.all([
    api.put('/workflow', updated),
    persistToSkinStore(updated),
  ])
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add workflow store with dual persistence (Bridge + skin store)"
```

---

### Task 11: Onboarding state store

**Files:**
- Create: `src/lib/stores/onboarding.js`

**Step 1: Implement onboarding store**

`src/lib/stores/onboarding.js`:

```js
import { writable, get } from 'svelte/store'
import { api } from '../api/index.js'

const SKIN_NS = 'extracto-patronum'

const defaultState = {
  completed: false,
  currentStep: 0,
  roast: null,        // { level, bean }
  profile: null,      // selected profile
  targets: null,      // { dose, yield }
}

export const onboarding = writable(defaultState)
export const onboardingLoading = writable(true)

export async function loadOnboarding() {
  onboardingLoading.set(true)
  try {
    const stored = await api.get(`/store/${SKIN_NS}/onboarding`).catch(() => null)
    if (stored?.value) {
      const parsed = typeof stored.value === 'string' ? JSON.parse(stored.value) : stored.value
      onboarding.set({ ...defaultState, ...parsed })
    }
  } catch (e) {
    console.error('Failed to load onboarding state:', e)
  } finally {
    onboardingLoading.set(false)
  }
}

export async function saveOnboarding(updates) {
  const current = get(onboarding)
  const updated = { ...current, ...updates }
  onboarding.set(updated)
  try {
    await api.post(`/store/${SKIN_NS}/onboarding`, { value: JSON.stringify(updated) })
  } catch (e) {
    console.error('Failed to save onboarding state:', e)
  }
}

export async function resetOnboarding() {
  onboarding.set(defaultState)
  try {
    await api.post(`/store/${SKIN_NS}/onboarding`, { value: JSON.stringify(defaultState) })
  } catch (e) {
    console.error('Failed to reset onboarding state:', e)
  }
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add onboarding state store with skin-store persistence"
```

---

### Task 12: Shots store

**Files:**
- Create: `src/lib/stores/shots.js`

**Step 1: Implement shots store**

`src/lib/stores/shots.js`:

```js
import { writable, get } from 'svelte/store'
import { api } from '../api/index.js'

export const shots = writable([])
export const shotsLoading = writable(false)
export const latestShot = writable(null)

let currentOffset = 0
const PAGE_SIZE = 20

export async function loadShots(filters = {}) {
  shotsLoading.set(true)
  currentOffset = 0
  try {
    const params = new URLSearchParams({ limit: PAGE_SIZE, offset: 0, order: 'desc' })
    for (const [key, val] of Object.entries(filters)) {
      if (val) params.set(key, val)
    }
    const result = await api.get(`/shots?${params}`)
    const list = Array.isArray(result) ? result : (result.shots ?? [])
    shots.set(list)
    currentOffset = list.length
  } catch (e) {
    console.error('Failed to load shots:', e)
  } finally {
    shotsLoading.set(false)
  }
}

export async function loadMoreShots(filters = {}) {
  shotsLoading.set(true)
  try {
    const params = new URLSearchParams({ limit: PAGE_SIZE, offset: currentOffset, order: 'desc' })
    for (const [key, val] of Object.entries(filters)) {
      if (val) params.set(key, val)
    }
    const result = await api.get(`/shots?${params}`)
    const list = Array.isArray(result) ? result : (result.shots ?? [])
    shots.update((current) => [...current, ...list])
    currentOffset += list.length
  } catch (e) {
    console.error('Failed to load more shots:', e)
  } finally {
    shotsLoading.set(false)
  }
}

export async function loadLatestShot() {
  try {
    const shot = await api.get('/shots/latest')
    latestShot.set(shot)
  } catch (e) {
    console.error('Failed to load latest shot:', e)
  }
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add shots store with pagination and filtering"
```

---

## Phase 4: App Shell

### Task 13: Router setup

**Files:**
- Modify: `src/App.svelte`
- Create: `src/pages/Dashboard.svelte`, `src/pages/ExtractionLab.svelte`, `src/pages/History.svelte`, `src/pages/Maintenance.svelte`, `src/pages/Settings.svelte`, `src/pages/Onboarding/Onboarding.svelte`

**Step 1: Create placeholder pages**

Each page is a minimal placeholder for now. Example `src/pages/Dashboard.svelte`:

```svelte
<div class="p-8">
  <h1 class="font-headline text-3xl font-bold text-primary">Dashboard</h1>
  <p class="text-on-surface-variant mt-2">Coming soon</p>
</div>
```

Create identical placeholders for `ExtractionLab.svelte`, `History.svelte`, `Maintenance.svelte`, `Settings.svelte`, and `Onboarding/Onboarding.svelte` (changing title text accordingly).

**Step 2: Set up router in `App.svelte`**

```svelte
<script>
  import Router, { replace } from 'svelte-spa-router'
  import { onMount } from 'svelte'
  import { onboarding, loadOnboarding, onboardingLoading } from './lib/stores/onboarding.js'
  import { loadWorkflow, workflowLoading } from './lib/stores/workflow.js'
  import TopBar from './lib/components/TopBar.svelte'

  import Dashboard from './pages/Dashboard.svelte'
  import ExtractionLab from './pages/ExtractionLab.svelte'
  import History from './pages/History.svelte'
  import Maintenance from './pages/Maintenance.svelte'
  import Settings from './pages/Settings.svelte'
  import Onboarding from './pages/Onboarding/Onboarding.svelte'

  const routes = {
    '/': null, // handled by redirect logic
    '/onboarding': Onboarding,
    '/dashboard': Dashboard,
    '/lab': ExtractionLab,
    '/history': History,
    '/maintenance': Maintenance,
    '/settings': Settings,
  }

  let loading = true

  onMount(async () => {
    await Promise.all([loadOnboarding(), loadWorkflow()])
    loading = false

    // Redirect logic for root
    if (window.location.hash === '#/' || window.location.hash === '' || window.location.hash === '#') {
      if (!$onboarding.completed) {
        replace('/onboarding')
      } else {
        replace('/dashboard')
      }
    }
  })

  function conditionsFailed(event) {
    // If a guarded route fails, redirect to onboarding
    replace('/onboarding')
  }
</script>

{#if loading}
  <div class="h-screen bg-background flex items-center justify-center">
    <div class="text-primary font-label text-sm tracking-widest uppercase animate-pulse">
      Initializing Console...
    </div>
  </div>
{:else}
  <div class="h-screen bg-background flex flex-col overflow-hidden">
    <TopBar />
    <main class="flex-1 overflow-y-auto">
      <Router {routes} on:conditionsFailed={conditionsFailed} />
    </main>
  </div>
{/if}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add hash-based router with placeholder pages"
```

---

### Task 14: Top bar component

**Files:**
- Create: `src/lib/components/TopBar.svelte`

**Step 1: Implement top bar**

`src/lib/components/TopBar.svelte`:

```svelte
<script>
  import { link, location } from 'svelte-spa-router'
  import { devices } from '../stores/devices.js'
  import { machineState } from '../stores/machine.js'
  import { scaleState } from '../stores/scale.js'
  import { scanDevices } from '../stores/devices.js'

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/lab', label: 'Customizer' },
    { path: '/maintenance', label: 'Maintenance' },
    { path: '/history', label: 'History' },
  ]

  function handleDeviceClick() {
    scanDevices()
  }
</script>

<header class="h-14 bg-surface-container-low flex items-center justify-between px-6 shrink-0">
  <!-- Left: Device Status -->
  <div class="flex items-center gap-4">
    <span class="font-headline font-extrabold text-sm text-primary tracking-tight uppercase">
      Extracto Patronum
    </span>

    <div class="flex items-center gap-3 ml-4">
      <!-- Machine status -->
      <button
        class="flex items-center gap-1.5 text-xs font-label tracking-wider uppercase transition-colors hover:text-primary"
        class:text-primary={$machineState.state !== 'disconnected'}
        class:text-outline={$machineState.state === 'disconnected'}
        onclick={handleDeviceClick}
      >
        <span
          class="w-2 h-2 rounded-full"
          class:bg-emerald-500={$machineState.state !== 'disconnected'}
          class:bg-outline={$machineState.state === 'disconnected'}
          class:animate-pulse={$machineState.state !== 'disconnected'}
        ></span>
        Machine
      </button>

      <!-- Scale status -->
      <button
        class="flex items-center gap-1.5 text-xs font-label tracking-wider uppercase transition-colors hover:text-primary"
        class:text-primary={$scaleState.connected}
        class:text-outline={!$scaleState.connected}
        onclick={handleDeviceClick}
      >
        <span
          class="w-2 h-2 rounded-full"
          class:bg-emerald-500={$scaleState.connected}
          class:bg-outline={!$scaleState.connected}
        ></span>
        Scale
      </button>
    </div>
  </div>

  <!-- Right: Navigation + Settings -->
  <nav class="flex items-center gap-1">
    {#each navItems as item}
      <a
        href={item.path}
        use:link
        class="px-4 py-1.5 text-xs font-label tracking-widest uppercase transition-colors rounded-sm"
        class:text-primary={$location === item.path}
        class:bg-surface-container={$location === item.path}
        class:text-on-surface-variant={$location !== item.path}
        class:hover:text-primary={$location !== item.path}
      >
        {item.label}
      </a>
    {/each}

    <a
      href="/settings"
      use:link
      class="ml-2 p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </a>
  </nav>
</header>
```

**Step 2: Verify visually**

Run dev server. Confirm: top bar with logo + device indicators on left, nav links + gear on right, active link highlighted in amber.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add top bar with device status and navigation"
```

---

## Phase 5: Shared Components

### Task 15: Gauge component (SVG circular gauge)

**Files:**
- Create: `src/lib/components/Gauge.svelte`

**Step 1: Implement the dual-ring SVG gauge**

`src/lib/components/Gauge.svelte`:

```svelte
<script>
  /** @type {number} */
  export let value = 0
  /** @type {number} */
  export let max = 12
  /** @type {string} */
  export let label = ''
  /** @type {string} */
  export let unit = ''
  /** @type {number} */
  export let size = 200
  /** @type {string} */
  export let color = 'var(--color-primary)'

  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  $: dashOffset = circumference - (Math.min(value / max, 1) * circumference)
</script>

<div class="relative inline-flex items-center justify-center" style="width: {size}px; height: {size}px;">
  <svg width={size} height={size} class="transform -rotate-90">
    <!-- Track -->
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="none"
      stroke="var(--color-surface-container-highest)"
      stroke-width={strokeWidth}
    />
    <!-- Value arc -->
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="none"
      stroke={color}
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-dasharray={circumference}
      stroke-dashoffset={dashOffset}
      class="transition-[stroke-dashoffset] duration-200"
      style="filter: drop-shadow(0 0 8px {color}40);"
    />
  </svg>
  <div class="absolute flex flex-col items-center">
    <span class="font-label text-3xl font-bold" style="color: {color};">
      {value.toFixed(1)}
    </span>
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">
      {unit}
    </span>
    {#if label}
      <span class="font-body text-xs text-outline mt-1">{label}</span>
    {/if}
  </div>
</div>
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add circular Gauge SVG component"
```

---

### Task 16: MetricCard component

**Files:**
- Create: `src/lib/components/MetricCard.svelte`

**Step 1: Implement metric card**

`src/lib/components/MetricCard.svelte`:

```svelte
<script>
  /** @type {string} */
  export let label = ''
  /** @type {string | number} */
  export let value = ''
  /** @type {string} */
  export let unit = ''
  /** @type {string} */
  export let icon = ''
</script>

<div class="bg-surface-container-low px-4 py-3 rounded-xl ghost-border flex flex-col gap-1">
  <div class="flex items-center gap-2">
    {#if icon}
      <span class="text-primary text-sm">{icon}</span>
    {/if}
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">
      {label}
    </span>
  </div>
  <div class="flex items-baseline gap-1">
    <span class="font-label text-2xl font-bold text-on-surface">{value}</span>
    {#if unit}
      <span class="font-label text-xs text-outline">{unit}</span>
    {/if}
  </div>
</div>
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add MetricCard component"
```

---

### Task 17: GradientButton component

**Files:**
- Create: `src/lib/components/GradientButton.svelte`

**Step 1: Implement gradient CTA button**

`src/lib/components/GradientButton.svelte`:

```svelte
<script>
  /** @type {string} */
  export let label = ''
  /** @type {boolean} */
  export let disabled = false
  /** @type {() => void} */
  export let onclick = () => {}
</script>

<button
  class="w-full py-4 gradient-cta text-on-primary-fixed font-label font-bold uppercase tracking-widest rounded-sm tactile-sink transition-opacity"
  class:opacity-50={disabled}
  class:cursor-not-allowed={disabled}
  {disabled}
  {onclick}
>
  {label}
  <slot />
</button>
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add GradientButton CTA component"
```

---

## Phase 6: Onboarding Flow

### Task 18: Onboarding shell with step navigation

**Files:**
- Modify: `src/pages/Onboarding/Onboarding.svelte`
- Create: `src/pages/Onboarding/StepRoast.svelte`, `src/pages/Onboarding/StepProfile.svelte`, `src/pages/Onboarding/StepTargets.svelte`, `src/pages/Onboarding/StepReview.svelte`

**Step 1: Implement onboarding shell**

`src/pages/Onboarding/Onboarding.svelte`:

```svelte
<script>
  import { push } from 'svelte-spa-router'
  import { onboarding, saveOnboarding } from '../../lib/stores/onboarding.js'
  import StepRoast from './StepRoast.svelte'
  import StepProfile from './StepProfile.svelte'
  import StepTargets from './StepTargets.svelte'
  import StepReview from './StepReview.svelte'

  const steps = [
    { component: StepRoast, label: 'Roast Selection', num: '01' },
    { component: StepProfile, label: 'Shot Profile', num: '02' },
    { component: StepTargets, label: 'Extraction Targets', num: '03' },
    { component: StepReview, label: 'Review', num: '04' },
  ]

  $: currentStep = $onboarding.currentStep ?? 0
  $: CurrentComponent = steps[currentStep].component

  async function nextStep(data) {
    await saveOnboarding({ ...data, currentStep: currentStep + 1 })
  }

  async function prevStep() {
    if (currentStep > 0) {
      await saveOnboarding({ currentStep: currentStep - 1 })
    }
  }

  async function complete(data) {
    await saveOnboarding({ ...data, completed: true })
    push('/dashboard')
  }
</script>

<div class="flex h-full">
  <!-- Left sidebar: step indicator -->
  <aside class="w-64 bg-surface-container-low p-6 flex flex-col shrink-0">
    <div class="mb-8">
      <h2 class="font-headline font-bold text-lg text-on-surface">Master Console</h2>
      <p class="font-label text-xs tracking-widest uppercase text-primary mt-1">Onboarding Phase</p>
    </div>

    <nav class="flex flex-col gap-1">
      {#each steps as step, i}
        <div
          class="flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors"
          class:text-primary={i === currentStep}
          class:border-r-2={i === currentStep}
          class:border-primary={i === currentStep}
          class:bg-primary/5={i === currentStep}
          class:text-on-surface-variant={i !== currentStep}
          class:opacity-50={i > currentStep}
        >
          <span class="font-label text-xs tracking-widest">{step.num}</span>
          <span class="font-body text-sm">{step.label}</span>
        </div>
      {/each}
    </nav>
  </aside>

  <!-- Main content -->
  <div class="flex-1 overflow-y-auto p-8 lg:p-12">
    <!-- Progress bar -->
    <div class="flex gap-2 mb-8">
      {#each steps as _, i}
        <div
          class="h-1 w-12 rounded-full transition-colors"
          class:bg-primary={i <= currentStep}
          class:bg-surface-container-highest={i > currentStep}
        ></div>
      {/each}
      <span class="font-label text-xs tracking-widest text-primary uppercase ml-2">
        Step {String(currentStep + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
      </span>
    </div>

    <svelte:component
      this={CurrentComponent}
      state={$onboarding}
      on:next={(e) => nextStep(e.detail)}
      on:prev={prevStep}
      on:complete={(e) => complete(e.detail)}
    />
  </div>
</div>
```

**Step 2: Create placeholder step components**

Each step component (`StepRoast.svelte`, `StepProfile.svelte`, `StepTargets.svelte`, `StepReview.svelte`) starts as a placeholder with the correct event dispatching:

Example `src/pages/Onboarding/StepRoast.svelte`:

```svelte
<script>
  import { createEventDispatcher } from 'svelte'
  import GradientButton from '../../lib/components/GradientButton.svelte'

  export let state

  const dispatch = createEventDispatcher()

  // Placeholder state
  let roastLevel = state.roast?.level ?? 'medium'
  let beanName = state.roast?.bean?.name ?? ''
  let beanOrigin = state.roast?.bean?.origin ?? ''
  let processing = state.roast?.bean?.processing ?? 'Washed'

  function next() {
    dispatch('next', {
      roast: {
        level: roastLevel,
        bean: { name: beanName, origin: beanOrigin, processing },
      },
    })
  }
</script>

<div class="max-w-4xl">
  <p class="font-label text-xs tracking-widest uppercase text-primary mb-2">Sequence 1</p>
  <h1 class="font-headline font-extrabold text-4xl md:text-5xl tracking-tighter text-on-surface">
    What's on <span class="italic text-primary">Bar</span> today?
  </h1>
  <p class="text-on-surface-variant text-lg mt-3 max-w-xl leading-relaxed">
    Configure your beans. This data calibrates our extraction algorithms for your specific roast density.
  </p>

  <div class="grid grid-cols-1 md:grid-cols-12 gap-6 mt-10">
    <!-- Roast spectrum -->
    <div class="md:col-span-7 p-8 rounded-xl bg-surface-container-low copper-glow">
      <h3 class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-6">
        Roast Profile Spectrum
      </h3>
      <div class="flex justify-between gap-4">
        {#each ['light', 'medium', 'medium-dark', 'dark'] as level}
          {@const temps = { light: '180°C', medium: '205°C', 'medium-dark': '215°C', dark: '225°C' }}
          {@const heights = { light: 'h-16', medium: 'h-24', 'medium-dark': 'h-28', dark: 'h-36' }}
          <button
            class="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all"
            class:ring-2={roastLevel === level}
            class:ring-primary={roastLevel === level}
            class:ring-offset-4={roastLevel === level}
            class:ring-offset-background={roastLevel === level}
            class:bg-primary-container={roastLevel === level}
            class:hover:bg-surface-container={roastLevel !== level}
            onclick={() => (roastLevel = level)}
          >
            <div class="w-full {heights[level]} rounded-sm transition-all"
              class:bg-primary={roastLevel === level}
              class:bg-surface-container-highest={roastLevel !== level}
            ></div>
            <span class="font-label text-xs tracking-wider uppercase"
              class:text-primary={roastLevel === level}
              class:text-on-surface-variant={roastLevel !== level}
            >{level.replace('-', ' ')}</span>
            <span class="font-label text-xs text-outline">{temps[level]}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Metadata console -->
    <div class="md:col-span-5 glass-panel p-8 rounded-xl ghost-border">
      <h3 class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-6">
        Metadata Console
      </h3>
      <div class="flex flex-col gap-8">
        <div class="group">
          <label class="font-label text-xs tracking-wider uppercase text-outline group-focus-within:text-primary transition-colors">
            Bean Identifier
          </label>
          <input
            type="text"
            bind:value={beanName}
            placeholder="e.g. Ethiopian Yirgacheffe"
            class="w-full bg-transparent border-b border-outline-variant/30 py-3 text-xl font-headline text-on-surface focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div class="group">
          <label class="font-label text-xs tracking-wider uppercase text-outline group-focus-within:text-primary transition-colors">
            Geographic Origin
          </label>
          <input
            type="text"
            bind:value={beanOrigin}
            placeholder="Enter Region/Country"
            class="w-full bg-transparent border-b border-outline-variant/30 py-3 text-xl font-headline text-on-surface focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div class="group">
          <label class="font-label text-xs tracking-wider uppercase text-outline group-focus-within:text-primary transition-colors">
            Processing Method
          </label>
          <select
            bind:value={processing}
            class="w-full bg-transparent border-b border-outline-variant/30 py-3 text-xl font-headline text-on-surface focus:border-primary focus:outline-none appearance-none cursor-pointer"
          >
            <option value="Washed">Washed</option>
            <option value="Natural">Natural</option>
            <option value="Honey">Honey</option>
            <option value="Anaerobic">Anaerobic</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <div class="mt-10 max-w-sm ml-auto">
    <GradientButton label="Continue Calibration →" onclick={next} />
  </div>
</div>
```

Create similar placeholders for `StepProfile.svelte`, `StepTargets.svelte`, and `StepReview.svelte` with their respective fields from the design doc. Each dispatches `next` or `complete` with relevant data.

**Step 3: Verify visually**

Navigate to `#/onboarding`. Confirm step sidebar, progress bar, roast selection step renders correctly.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add onboarding flow with step navigation and roast selection"
```

---

### Task 19: Onboarding Step 2 — Shot Profile selection

**Files:**
- Modify: `src/pages/Onboarding/StepProfile.svelte`

**Step 1: Implement profile selection step**

`src/pages/Onboarding/StepProfile.svelte`:

```svelte
<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import { api } from '../../lib/api/index.js'
  import GradientButton from '../../lib/components/GradientButton.svelte'

  export let state

  const dispatch = createEventDispatcher()

  let profiles = []
  let selectedId = state.profile?.id ?? null
  let loading = true

  const presets = [
    {
      title: 'Classic 9-Bar',
      desc: 'The industry standard. Constant pressure for heavy body and traditional, high-viscosity extraction.',
      icon: '◆',
    },
    {
      title: 'Turbo Shot',
      desc: 'Reduced pressure for higher clarity. Maximizes extraction percentage while minimizing channeling.',
      icon: '⚡',
    },
    {
      title: 'Advanced Flow-Profiled',
      desc: 'Dynamic water management. Emphasizes even flow saturation. Long pre-infusion followed by declining flow.',
      icon: '◇',
    },
  ]

  onMount(async () => {
    try {
      const result = await api.get('/profiles')
      profiles = Array.isArray(result) ? result : (result.profiles ?? [])
    } catch (e) {
      console.error('Failed to load profiles:', e)
    } finally {
      loading = false
    }
  })

  function selectProfile(profile) {
    selectedId = profile.id
  }

  function next() {
    const selected = profiles.find((p) => p.id === selectedId) ?? null
    dispatch('next', { profile: selected })
  }
</script>

<div class="max-w-4xl">
  <p class="font-label text-xs tracking-widest uppercase text-primary mb-2">Sequence 2</p>
  <h1 class="font-headline font-extrabold text-4xl md:text-5xl tracking-tighter text-on-surface">
    Select Your <span class="italic text-primary">Extraction Intent</span>
  </h1>
  <p class="text-on-surface-variant text-lg mt-3 max-w-xl leading-relaxed">
    The profile defines how the machine manages water pressure and flow rate throughout the 30-second window. Choose a blueprint to begin calibration.
  </p>

  {#if loading}
    <div class="mt-10 text-on-surface-variant animate-pulse">Loading profiles...</div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
      {#each profiles.slice(0, 9) as profile, i}
        {@const preset = presets[i] ?? { title: profile.title, desc: profile.notes ?? '', icon: '●' }}
        <button
          class="p-6 rounded-xl text-left transition-all"
          class:bg-surface-container-high={selectedId === profile.id}
          class:ambient-glow-active={selectedId === profile.id}
          class:ring-1={selectedId === profile.id}
          class:ring-primary={selectedId === profile.id}
          class:bg-surface-container-low={selectedId !== profile.id}
          class:hover:bg-surface-container={selectedId !== profile.id}
          onclick={() => selectProfile(profile)}
        >
          <span class="text-2xl mb-3 block">{preset.icon}</span>
          <h3 class="font-headline font-bold text-lg text-on-surface">{profile.title ?? preset.title}</h3>
          <p class="font-body text-sm text-on-surface-variant mt-2 leading-relaxed">
            {profile.notes ?? preset.desc}
          </p>
        </button>
      {/each}
    </div>
  {/if}

  <div class="mt-10 flex items-center justify-between max-w-sm ml-auto gap-4">
    <button
      class="px-6 py-4 font-label text-sm tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
      onclick={() => dispatch('prev')}
    >
      ← Back
    </button>
    <GradientButton label="Confirm Profile →" onclick={next} disabled={!selectedId} />
  </div>
</div>
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add onboarding step 2 — shot profile selection"
```

---

### Task 20: Onboarding Step 3 — Extraction Targets

**Files:**
- Modify: `src/pages/Onboarding/StepTargets.svelte`

**Step 1: Implement targets step**

`src/pages/Onboarding/StepTargets.svelte`:

```svelte
<script>
  import { createEventDispatcher } from 'svelte'
  import GradientButton from '../../lib/components/GradientButton.svelte'

  export let state

  const dispatch = createEventDispatcher()

  let dose = state.targets?.dose ?? 18.5
  let yieldTarget = state.targets?.yield ?? 37.0

  $: ratio = dose > 0 ? (yieldTarget / dose).toFixed(1) : '0'
  $: ratioLabel = ratio === '2.0' ? 'Standard Normale' : ratio === '1.5' ? 'Ristretto' : ratio === '3.0' ? 'Lungo' : 'Custom'

  function adjustDose(delta) {
    dose = Math.max(10, Math.min(30, +(dose + delta).toFixed(1)))
  }
  function adjustYield(delta) {
    yieldTarget = Math.max(15, Math.min(80, +(yieldTarget + delta).toFixed(1)))
  }

  function next() {
    dispatch('next', { targets: { dose, yield: yieldTarget } })
  }
</script>

<div class="max-w-4xl">
  <p class="font-label text-xs tracking-widest uppercase text-primary mb-2">Sequence 3</p>
  <h1 class="font-headline font-extrabold text-4xl md:text-5xl tracking-tighter text-on-surface">
    Extraction <span class="italic text-primary">Targets</span>
  </h1>
  <p class="text-on-surface-variant text-lg mt-3 max-w-xl leading-relaxed">
    Define the mass relationship of your espresso. Precision at this stage ensures repeatable excellence for every single pull.
  </p>

  <div class="grid grid-cols-1 md:grid-cols-12 gap-6 mt-10">
    <!-- Dose & Yield -->
    <div class="md:col-span-7 flex flex-col gap-6">
      <!-- Dose -->
      <div class="p-8 rounded-xl bg-surface-container-low">
        <h3 class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-4">
          Nominal Input Dose
        </h3>
        <div class="flex items-center gap-4">
          <span class="font-label text-5xl font-bold text-on-surface">{dose.toFixed(1)}</span>
          <span class="font-label text-lg text-outline">g</span>
          <div class="ml-auto flex gap-2">
            <button
              class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors click-sink"
              onclick={() => adjustDose(-0.5)}
            >−</button>
            <button
              class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors click-sink"
              onclick={() => adjustDose(0.5)}
            >+</button>
          </div>
        </div>
      </div>

      <!-- Yield -->
      <div class="p-8 rounded-xl bg-surface-container-low">
        <h3 class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-4">
          Preferred Output Yield
        </h3>
        <div class="flex items-center gap-4">
          <span class="font-label text-5xl font-bold text-on-surface">{yieldTarget.toFixed(1)}</span>
          <span class="font-label text-lg text-outline">g</span>
          <div class="ml-auto flex gap-2">
            <button
              class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors click-sink"
              onclick={() => adjustYield(-0.5)}
            >−</button>
            <button
              class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors click-sink"
              onclick={() => adjustYield(0.5)}
            >+</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Ratio display -->
    <div class="md:col-span-5 flex flex-col gap-6">
      <div class="p-8 rounded-xl bg-surface-container copper-glow flex-1 flex flex-col items-center justify-center">
        <h3 class="font-label text-xs tracking-widest uppercase text-primary mb-4">
          Brewing Ratio
        </h3>
        <span class="font-label text-6xl font-bold text-primary">1:{ratio}</span>
        <span class="font-body text-sm text-on-surface-variant mt-2">{ratioLabel}</span>
      </div>

      <div class="p-6 rounded-xl bg-surface-container-low">
        <h3 class="font-headline font-bold text-sm text-on-surface mb-2">Patronum Tip</h3>
        <p class="font-body text-sm text-on-surface-variant leading-relaxed">
          A 1:2 ratio is the golden standard for medium roasts.
          Increase to 1:2.5 for lighter roasts to maximize solubility, or
          pull 1:1.5 for a ristretto-style heavy body.
        </p>
      </div>
    </div>
  </div>

  <div class="mt-10 flex items-center justify-between max-w-sm ml-auto gap-4">
    <button
      class="px-6 py-4 font-label text-sm tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
      onclick={() => dispatch('prev')}
    >
      ← Back
    </button>
    <GradientButton label="Finalize Profile →" onclick={next} />
  </div>
</div>
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add onboarding step 3 — extraction targets with ratio"
```

---

### Task 21: Onboarding Step 4 — Review & Bake Profile

**Files:**
- Modify: `src/pages/Onboarding/StepReview.svelte`

**Step 1: Implement review step**

`src/pages/Onboarding/StepReview.svelte`:

```svelte
<script>
  import { createEventDispatcher } from 'svelte'
  import { updateWorkflow } from '../../lib/stores/workflow.js'
  import { api } from '../../lib/api/index.js'
  import GradientButton from '../../lib/components/GradientButton.svelte'

  export let state

  const dispatch = createEventDispatcher()

  let baking = false

  async function bakeProfile() {
    baking = true
    try {
      // Create/update bean entity
      let beanBatchId = null
      if (state.roast?.bean?.name) {
        const bean = await api.post('/beans', {
          roaster: 'User',
          name: state.roast.bean.name,
          country: state.roast.bean.origin,
          processing: state.roast.bean.processing,
        }).catch(() => null)
        if (bean?.id) {
          beanBatchId = bean.id
        }
      }

      // Upload the selected profile
      if (state.profile) {
        await api.post('/machine/profile', state.profile).catch(() => {})
      }

      // Build and save the full workflow
      await updateWorkflow({
        context: {
          targetDoseWeight: state.targets?.dose ?? 18.5,
          targetYield: state.targets?.yield ?? 37.0,
          coffeeName: state.roast?.bean?.name ?? '',
          beanBatchId,
          grinderSetting: '',
        },
      })

      dispatch('complete', {})
    } catch (e) {
      console.error('Failed to bake profile:', e)
    } finally {
      baking = false
    }
  }
</script>

<div class="max-w-3xl">
  <p class="font-label text-xs tracking-widest uppercase text-primary mb-2">Sequence 4</p>
  <h1 class="font-headline font-extrabold text-4xl md:text-5xl tracking-tighter text-on-surface">
    Review & <span class="italic text-primary">Confirm</span>
  </h1>
  <p class="text-on-surface-variant text-lg mt-3 max-w-xl leading-relaxed">
    Verify your extraction parameters. Once confirmed, the workflow will be written to the machine.
  </p>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
    <!-- Roast -->
    <div class="p-6 rounded-xl bg-surface-container-low">
      <h3 class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-3">Coffee</h3>
      <p class="font-headline font-bold text-xl text-on-surface">{state.roast?.bean?.name || 'Not set'}</p>
      <p class="text-on-surface-variant text-sm mt-1">{state.roast?.bean?.origin || ''}</p>
      <p class="font-label text-xs text-primary uppercase tracking-wider mt-2">
        {state.roast?.level ?? 'Medium'} roast · {state.roast?.bean?.processing ?? 'Washed'}
      </p>
    </div>

    <!-- Profile -->
    <div class="p-6 rounded-xl bg-surface-container-low">
      <h3 class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-3">Profile</h3>
      <p class="font-headline font-bold text-xl text-on-surface">{state.profile?.title || 'Not selected'}</p>
      <p class="text-on-surface-variant text-sm mt-1">{state.profile?.author || ''}</p>
    </div>

    <!-- Targets -->
    <div class="p-6 rounded-xl bg-surface-container-low">
      <h3 class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-3">Dose</h3>
      <span class="font-label text-3xl font-bold text-on-surface">{state.targets?.dose ?? 18.5}</span>
      <span class="font-label text-sm text-outline ml-1">g in</span>
    </div>

    <div class="p-6 rounded-xl bg-surface-container-low">
      <h3 class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-3">Yield</h3>
      <span class="font-label text-3xl font-bold text-on-surface">{state.targets?.yield ?? 37.0}</span>
      <span class="font-label text-sm text-outline ml-1">g out</span>
    </div>
  </div>

  <div class="mt-10 flex items-center justify-between max-w-sm ml-auto gap-4">
    <button
      class="px-6 py-4 font-label text-sm tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
      onclick={() => dispatch('prev')}
    >
      ← Back
    </button>
    <GradientButton label={baking ? 'Baking...' : 'Bake Profile →'} onclick={bakeProfile} disabled={baking} />
  </div>
</div>
```

**Step 2: Verify full onboarding flow end-to-end**

Navigate through all 4 steps, verify state persists between steps, final "Bake Profile" redirects to dashboard.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add onboarding step 4 — review and bake profile"
```

---

## Phase 7: Dashboard

### Task 22: Dashboard layout and live data

**Files:**
- Modify: `src/pages/Dashboard.svelte`

**Step 1: Implement dashboard**

`src/pages/Dashboard.svelte`:

```svelte
<script>
  import { onMount } from 'svelte'
  import { machineState, machineSnapshot } from '../lib/stores/machine.js'
  import { scaleState } from '../lib/stores/scale.js'
  import { workflow } from '../lib/stores/workflow.js'
  import { latestShot, loadLatestShot } from '../lib/stores/shots.js'
  import { api } from '../lib/api/index.js'
  import Gauge from '../lib/components/Gauge.svelte'
  import MetricCard from '../lib/components/MetricCard.svelte'

  // Shot timer
  let timerStart = null
  let elapsed = 0
  let timerInterval = null

  $: if ($machineState.isBrewing && !timerInterval) {
    timerStart = Date.now()
    timerInterval = setInterval(() => {
      elapsed = (Date.now() - timerStart) / 1000
    }, 100)
  }

  $: if (!$machineState.isBrewing && timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  $: timerDisplay = formatTimer(elapsed)

  function formatTimer(s) {
    const min = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    const ms = Math.floor((s % 1) * 10)
    return `${min}:${sec}.${ms}`
  }

  // Steam controls
  let steamTemp = 135
  let steamBusy = false

  async function startSteam() {
    steamBusy = true
    try {
      await api.post('/machine/shotSettings', {
        targetSteamTemp: steamTemp,
      })
      await api.put('/machine/state/steam')
    } catch (e) {
      console.error('Failed to start steam:', e)
    } finally {
      steamBusy = false
    }
  }

  async function startSteamRinse() {
    try {
      await api.put('/machine/state/steamRinse')
    } catch (e) {
      console.error('Failed to start steam rinse:', e)
    }
  }

  onMount(() => {
    loadLatestShot()
    return () => {
      if (timerInterval) clearInterval(timerInterval)
    }
  })
</script>

<div class="p-6 lg:p-8 h-full">
  <!-- Bean identity header -->
  <div class="flex items-start justify-between mb-6">
    <div>
      <span class="font-label text-xs tracking-widest uppercase text-primary">
        {$machineState.state === 'disconnected' ? 'Offline' : $machineState.state.toUpperCase()}
      </span>
      <h1 class="font-headline font-extrabold text-3xl tracking-tighter text-on-surface mt-1">
        {$workflow?.context?.coffeeName || 'No Coffee Selected'}
      </h1>
    </div>
    <div class="text-right">
      <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Active Profile</span>
      <p class="font-headline font-bold text-on-surface">{$workflow?.profile?.title || '—'}</p>
    </div>
  </div>

  <div class="grid grid-cols-12 gap-6">
    <!-- Dual Gauges -->
    <div class="col-span-4 flex flex-col items-center justify-center p-6 rounded-xl bg-surface-container-low copper-glow">
      <div class="flex gap-8">
        <Gauge
          value={$machineState.pressure}
          max={12}
          unit="BAR"
          label="Pressure"
          size={160}
          color="var(--color-primary)"
        />
        <Gauge
          value={$machineState.flow}
          max={8}
          unit="ML/S"
          label="Flow"
          size={160}
          color="var(--color-secondary)"
        />
      </div>
    </div>

    <!-- Shot Timer -->
    <div class="col-span-3 p-6 rounded-xl bg-surface-container-low flex flex-col items-center justify-center"
      class:ambient-glow-active={$machineState.isBrewing}
    >
      <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-2">Shot Timer</span>
      <span class="font-label text-6xl font-light text-on-surface">{timerDisplay}</span>
      {#if $machineState.isBrewing}
        <div class="flex gap-1 mt-3">
          <div class="w-8 h-1 bg-primary rounded-full animate-pulse"></div>
          <div class="w-8 h-1 bg-primary/60 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
          <div class="w-8 h-1 bg-primary/30 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
        </div>
      {/if}
    </div>

    <!-- Steam Panel -->
    <div class="col-span-5 p-6 rounded-xl bg-surface-container-low"
      class:ambient-glow-active={$machineState.isSteaming}
    >
      <h3 class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-4">Steam Control</h3>
      <div class="flex items-center gap-6">
        <!-- Steam temp -->
        <div class="flex items-center gap-3">
          <button
            class="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors click-sink text-sm"
            onclick={() => (steamTemp = Math.max(100, steamTemp - 5))}
          >−</button>
          <div class="text-center">
            <span class="font-label text-3xl font-bold text-on-surface">{steamTemp}</span>
            <span class="font-label text-xs text-outline ml-1">°C</span>
          </div>
          <button
            class="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors click-sink text-sm"
            onclick={() => (steamTemp = Math.min(165, steamTemp + 5))}
          >+</button>
        </div>

        <!-- Live steam temp during steaming -->
        {#if $machineState.isSteaming}
          <div class="text-center">
            <span class="font-label text-xs tracking-widest uppercase text-primary">Live</span>
            <p class="font-label text-2xl font-bold text-primary">{$machineState.steamTemperature.toFixed(1)}°C</p>
          </div>
        {/if}

        <div class="ml-auto flex gap-2">
          <button
            class="px-4 py-2.5 gradient-cta text-on-primary-fixed font-label font-bold text-xs tracking-widest uppercase rounded-sm tactile-sink"
            disabled={steamBusy || $machineState.isSteaming}
            onclick={startSteam}
          >
            {$machineState.isSteaming ? 'Steaming...' : 'Start Steam'}
          </button>
          <button
            class="px-3 py-2.5 bg-surface-container-high text-on-surface-variant font-label text-xs tracking-widest uppercase rounded-sm ghost-border hover:text-primary transition-colors click-sink"
            onclick={startSteamRinse}
          >
            Rinse
          </button>
        </div>
      </div>
    </div>

    <!-- Metrics row -->
    <div class="col-span-12 grid grid-cols-5 gap-4">
      <MetricCard label="Mix Temp" value={$machineState.mixTemperature.toFixed(1)} unit="°C" />
      <MetricCard label="Group Temp" value={$machineState.groupTemperature.toFixed(1)} unit="°C" />
      <MetricCard label="Weight" value={$scaleState.weight.toFixed(1)} unit="g" />
      <MetricCard label="Target Yield" value={$workflow?.context?.targetYield ?? '—'} unit="g" />
      <MetricCard label="Dose" value={$workflow?.context?.targetDoseWeight ?? '—'} unit="g" />
    </div>

    <!-- Extraction Curve (placeholder) -->
    <div class="col-span-7 p-6 rounded-xl glass-panel ghost-border min-h-48">
      <h3 class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-4">Extraction Curve</h3>
      <p class="text-on-surface-variant text-sm">Real-time chart will render here during extraction.</p>
      <!-- TODO: Task 25 — implement real-time extraction chart -->
    </div>

    <!-- Extraction Intelligence -->
    <div class="col-span-5 p-6 rounded-xl glass-panel ghost-border min-h-48">
      <h3 class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-4">Extraction Intelligence</h3>
      {#if $latestShot}
        <p class="text-on-surface text-sm">{$latestShot.shotNotes || 'No notes from last shot.'}</p>
        {#if $latestShot.annotations?.espressoNotes}
          <p class="text-on-surface-variant text-sm mt-2">{$latestShot.annotations.espressoNotes}</p>
        {/if}
      {:else}
        <p class="text-on-surface-variant text-sm">Pull your first shot to see extraction insights.</p>
      {/if}
    </div>
  </div>
</div>
```

**Step 2: Verify visually**

Run dev server. Dashboard should show dual gauges, shot timer, steam panel, metric cards, and placeholder panels. All values will be 0/null without a live Bridge connection.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add dashboard with dual gauges, shot timer, steam controls, and metrics"
```

---

## Phase 8: Extraction Lab

### Task 23: Extraction Lab page

**Files:**
- Modify: `src/pages/ExtractionLab.svelte`

**Step 1: Implement extraction lab**

`src/pages/ExtractionLab.svelte` — Profile parameter editor with cards for dose, pressure, flow, temperature, grind size. Uses `workflow` store for read/write. Includes profile steps visualization (list of step names from `workflow.profile.steps`). Save button writes to both Bridge and skin store via `updateWorkflow()`. Reset button reloads from skin store.

This is a large component — implement the parameter cards grid (dose, pressure, flow, grind size, temperature) with editable values and +/- controls matching the Stitch design, plus a save/reset footer.

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Extraction Lab with profile parameter editing"
```

---

## Phase 9: History

### Task 24: History page

**Files:**
- Modify: `src/pages/History.svelte`

**Step 1: Implement history page**

`src/pages/History.svelte` — Loads shots via `loadShots()` on mount. Renders a table with columns: date, bean, dose, yield, time, rating (stars). Filter bar at top for bean name and profile. "Load More" button calls `loadMoreShots()`. Stats footer with MetricCard components showing average temperature, yield precision, taste trend.

Click on a row expands to show shot detail with notes and annotations.

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add History page with shots table and filtering"
```

---

## Phase 10: Maintenance

### Task 25: Maintenance page

**Files:**
- Modify: `src/pages/Maintenance.svelte`

**Step 1: Implement maintenance page**

`src/pages/Maintenance.svelte` — Machine health dashboard. Tracks maintenance state in skin store (`/store/extracto-patronum/maintenance`). Shows:
- Descaling alert with configurable countdown
- Backflush routine checklist (items stored in skin store)
- Water quality entries (hardness, TDS, pH) persisted to skin store
- Flush button triggers `api.put('/machine/state/flush')`

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Maintenance page with health alerts and backflush routine"
```

---

## Phase 11: Settings

### Task 26: Settings page

**Files:**
- Modify: `src/pages/Settings.svelte`

**Step 1: Implement settings page**

`src/pages/Settings.svelte` — Sections:
- Interface mode toggle (Operator/Tinkerer) — persisted to skin store
- Re-run onboarding button — calls `resetOnboarding()` then `push('/onboarding')`
- Display brightness slider — reads from `api.get('/display')`, writes via `api.put('/display/brightness', { brightness })`
- Presence schedules — list from `api.get('/presence/schedules')`, add/edit/delete
- Device preferences — shows discovered devices from `devices` store, set preferred IDs via `api.post('/settings', { preferredMachineId, preferredScaleId })`

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Settings page with brightness, presence, and device preferences"
```

---

## Phase 12: Real-time Extraction Chart

### Task 27: Extraction curve chart component

**Files:**
- Create: `src/lib/components/ExtractionChart.svelte`
- Modify: `src/pages/Dashboard.svelte`

**Step 1: Implement SVG-based extraction chart**

`src/lib/components/ExtractionChart.svelte` — A lightweight SVG line chart that:
- Subscribes to `machineSnapshot` store
- Accumulates data points during brew (pressure + flow vs time)
- Renders two SVG polylines (pressure in primary color, flow in secondary)
- Clears on new brew start
- Shows last shot's data when idle (from `latestShot.measurements`)

No charting library — hand-rolled SVG polyline with axis labels using Space Grotesk. Keep it under 150 lines.

**Step 2: Wire into Dashboard**

Replace the extraction curve placeholder in `Dashboard.svelte` with the `ExtractionChart` component.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add real-time extraction curve SVG chart"
```

---

## Phase 13: PWA Setup

### Task 28: PWA manifest and service worker

**Files:**
- Create: `public/manifest.json`, `public/sw.js`, `public/icons/` (placeholder icons)
- Modify: `index.html`

**Step 1: Create manifest**

`public/manifest.json`:

```json
{
  "name": "Extracto Patronum",
  "short_name": "Extracto",
  "description": "The Master Roaster's Console",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#161311",
  "theme_color": "#d97707",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Step 2: Add manifest link and service worker registration to `index.html`**

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#d97707">
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
  }
</script>
```

**Step 3: Create minimal service worker**

`public/sw.js` — cache-first strategy for static assets, network-first for API calls. Keep it minimal.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add PWA manifest and service worker"
```

---

## Phase 14: Polish & Final Verification

### Task 29: End-to-end verification

**Step 1:** Run `npm run build` — verify clean build with no errors.

**Step 2:** Serve the `dist/` folder locally and walk through the full flow:
1. App loads → redirects to onboarding
2. Complete all 4 onboarding steps
3. Dashboard shows with all panels
4. Navigate to Lab, History, Maintenance, Settings
5. Return to Dashboard

**Step 3:** Run `npm test` — verify all tests pass.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: end-to-end verification pass"
```
