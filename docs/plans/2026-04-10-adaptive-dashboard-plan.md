# Adaptive Dashboard Layout — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the dashboard viewport-height-aware so widgets compress to fit the screen, with a gradient fade scroll indicator when content overflows.

**Architecture:** CSS grid with `minmax()` row sizing on a container that fills available viewport height. A gradient overlay in App.svelte hides/shows based on scroll position. Widget DOM order is reordered to match priority.

**Tech Stack:** Svelte 5 runes, Tailwind CSS v4, CSS grid

---

### Task 1: Reorder Dashboard widgets by priority

Current DOM order: Metrics → Controls → Gauges → Timer → Steam → Chart → Notes
Target DOM order: Metrics → Gauges+Timer+Brew → Controls → Steam → Chart → Notes

**Files:**
- Modify: `src/pages/Dashboard.svelte:257-486` (template section)

**Step 1: Move the Control row block below the Gauges+Timer row**

In `src/pages/Dashboard.svelte`, swap the order so that:
- Metrics row stays at top (line 260-287)
- Gauges (line 295-298) + Shot Timer (line 300-337) + Steam (line 339-442) come next
- Control row (line 289-293) moves between Shot Timer and Steam
- Chart + Notes stay at bottom

Specifically, cut lines 289-293 (the Control row):
```html
  <!-- Control row -->
  <div class="col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
    <MachineControl />
    <ScaleCard />
  </div>
```

And paste it after the Shot Timer block (after line 337, before the Steam Panel comment).

**Step 2: Verify dev server renders correctly**

Run: `npm run dev -- --host`
Check: Dashboard loads, all widgets visible, same content just reordered.

**Step 3: Commit**

```bash
git add src/pages/Dashboard.svelte
git commit -m "refactor: reorder dashboard widgets by priority"
```

---

### Task 2: Add height-aware grid wrapper to Dashboard

Replace the flat `grid` div with a wrapper that fills the available viewport height and uses CSS grid rows with `minmax()` so rows compress proportionally.

**Files:**
- Modify: `src/pages/Dashboard.svelte:257-258` (grid opening) and closing `</div>` at line ~486

**Step 1: Replace the main grid container**

Change the opening `<div class="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 md:px-6 pb-6">` to a dashboard wrapper that:
- Uses CSS grid with named rows
- Sets `grid-template-rows` with `minmax()` for each widget section
- Each row section is wrapped in its own container

The new structure (inside `Dashboard.svelte` template, replacing lines 257-486):

```html
<!-- Dashboard wrapper — fills viewport, rows compress to fit -->
<div class="dashboard-grid grid gap-4 px-4 md:px-6 pb-6">

  <!-- Row 1: Metrics -->
  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
    <div class="col-span-12 flex flex-wrap gap-3 md:gap-4">
      ...metrics cards unchanged...
    </div>
  </div>

  <!-- Row 2: Gauges + Timer -->
  <div class="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
    ...gauges, timer, unchanged but min-h-0 to allow shrinking...
  </div>

  <!-- Row 3: Machine + Scale controls -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <MachineControl />
    <ScaleCard />
  </div>

  <!-- Row 4: Steam -->
  <div class="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
    ...steam panel...
  </div>

  <!-- Row 5: Chart + Notes -->
  <div class="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
    ...chart and notes...
  </div>
</div>
```

**Step 2: Add the `.dashboard-grid` CSS**

In the `<style>` block of `Dashboard.svelte`, add:

```css
.dashboard-grid {
  grid-template-rows:
    auto                        /* metrics — natural height */
    minmax(14rem, 1fr)          /* gauges + timer — compresses but min 14rem */
    auto                        /* controls — natural height */
    minmax(10rem, auto)         /* steam — compresses but min 10rem */
    minmax(10rem, 1fr);         /* chart + notes — fills remaining space */
}
```

**Step 3: Verify**

Run: `npm run dev -- --host`
Check on various viewport sizes: widgets compress on shorter viewports, scroll kicks in when minimums are hit.

**Step 4: Commit**

```bash
git add src/pages/Dashboard.svelte
git commit -m "feat: add height-aware grid layout to dashboard"
```

---

### Task 3: Add gradient fade scroll indicator to App.svelte

Add a gradient overlay at the bottom of `<main>` that indicates more content below. It fades out when the user scrolls to the bottom.

**Files:**
- Modify: `src/App.svelte:57-62`

**Step 1: Add scroll state and fade overlay**

In the `<script>` block, add:

```js
let mainEl = $state(null)
let showScrollFade = $state(false)

function checkScroll() {
  if (!mainEl) return
  const { scrollTop, scrollHeight, clientHeight } = mainEl
  showScrollFade = scrollHeight - scrollTop - clientHeight > 20
}
```

**Step 2: Add `$effect` to watch for content changes**

```js
$effect(() => {
  if (!mainEl) return
  checkScroll()
  const observer = new ResizeObserver(checkScroll)
  observer.observe(mainEl)
  return () => observer.disconnect()
})
```

**Step 3: Update the `<main>` element**

Change:
```html
<main class="flex-1 overflow-y-auto">
  <Router {routes} />
</main>
```

To:
```html
<main class="flex-1 overflow-y-auto relative" bind:this={mainEl} onscroll={checkScroll}>
  <Router {routes} />
  <div
    class="sticky bottom-0 left-0 right-0 h-12 pointer-events-none transition-opacity duration-300 bg-gradient-to-t from-background to-transparent"
    class:opacity-0={!showScrollFade}
  ></div>
</main>
```

**Step 4: Verify**

Run: `npm run dev -- --host`
Check:
- On a tall viewport (desktop): no fade visible (content fits)
- On a short viewport (or resize browser): fade appears at bottom
- Scrolling to bottom: fade disappears
- Other pages (History, Settings): fade also works correctly when content overflows

**Step 5: Commit**

```bash
git add src/App.svelte
git commit -m "feat: add gradient fade scroll indicator"
```

---

### Task 4: Visual QA and final adjustments

**Step 1: Test on multiple viewport sizes**

Using browser dev tools, test at:
- 768×1024 (iPad portrait)
- 1024×768 (iPad landscape)
- 1280×800 (common tablet landscape)
- 375×667 (iPhone SE — phone)
- 1920×1080 (desktop)

Check: widgets compress reasonably, no overlapping, scroll indicator appears/disappears correctly.

**Step 2: Adjust minmax values if needed**

If gauges or steam panel look too crushed at certain sizes, tweak the `minmax()` values in `.dashboard-grid`.

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: fine-tune adaptive dashboard layout"
```
