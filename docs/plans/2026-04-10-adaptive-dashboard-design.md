# Adaptive Dashboard Layout

## Goal

Make the dashboard viewport-height-aware so widgets compress to fit the screen when possible, and gracefully scroll with a gradient fade indicator when they can't.

## Context

- Primary target: tablets of varying sizes/aspect ratios, but must also work on phones and desktop
- App shell: `h-screen flex flex-col overflow-hidden`, TopBar is `h-14` (56px), `<main>` is `flex-1 overflow-y-auto`
- Dashboard currently uses width-responsive grid (sm/md breakpoints) but has no height awareness

## Approach

CSS-driven fit-to-viewport with graceful overflow. No JS layout calculation — pure CSS grid + minmax handles compression. Only JS is a scroll-position check for the fade indicator.

## Widget Priority (top to bottom)

1. Metrics row (temps, yield, dose, water)
2. Gauges + Shot Timer + Brew controls
3. Machine Control + Scale (connection status)
4. Steam Control
5. Extraction Chart + Notes

## Implementation

### Dashboard wrapper

Grid container with `min-h-full` and row templates using `minmax(min, 1fr)` — rows shrink proportionally but respect minimums.

### Gradient fade overlay

`pointer-events-none` gradient at the bottom of `<main>`, fading from transparent to background color. Hides when user has scrolled to the bottom (small `$effect` watching scroll position).

### Files changed

- `Dashboard.svelte` — reorder Steam/Machine rows; wrap content in height-aware grid
- `App.svelte` — add gradient fade overlay inside `<main>`

### What stays the same

- Individual widget components untouched
- Width-responsive breakpoints (sm/md) preserved
- No new dependencies
