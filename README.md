# Extracto Patronum

A dark, warm-toned dashboard UI for the [Decent DE1](https://decentespresso.com/) espresso machine. Think of it as a skin — it talks to the DE1 backend over REST and WebSocket, giving you real-time control and shot tracking in the browser.

![Dashboard](screenshots/dashboard.png)

## Features

- **Live dashboard** — pressure & flow gauges, shot timer, extraction curve, and steam controls, all updating in real time over WebSocket
- **Extraction lab** — tweak dose, yield, temperature, pressure, and grind parameters on the fly; swap profiles and coffees mid-session
- **Shot journal** — searchable history of every shot with extraction charts, notes, and enjoyment ratings
- **Wake schedules** — set the machine to heat up before you stumble to the kitchen
- **Scale integration** — live weight tracking from a connected Bluetooth scale

![Customizer](screenshots/lab.png)

## Installing on Streamline Bridge

1. Go to the [`dist`](https://github.com/tadelv/extracto-patronum/tree/dist) branch on GitHub
2. Click **Code > Download ZIP**
3. Open your Streamline Bridge settings and navigate to the **Skins** section
4. Install the downloaded ZIP via the skin upload option

## Planned for the future

- **Maintenance tools** — flush, descale, and transport mode

## Stack

| Layer | Tech |
|-------|------|
| Framework | Svelte 5 (runes) |
| Routing | svelte-spa-router (hash) |
| Styling | Tailwind CSS v4 |
| Build | Vite 8 |
| Tests | Vitest + jsdom |
| Fonts | Manrope, Space Grotesk |

## Getting started

```bash
npm install
npm run dev
```

Point `VITE_API_HOST` at your DE1 backend (defaults to `localhost`).

```bash
VITE_API_HOST=192.168.1.42 npm run dev
```

## Building

```bash
npm run build   # outputs to dist/
```

The built skin can be deployed as a static site or served directly by the DE1 bridge.

## License

MIT
