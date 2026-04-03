<script>
  import { untrack } from 'svelte'
  import { machineState } from '../stores/machine.js'
  import { latestShotFull } from '../stores/shots.js'

  const PRESSURE_MAX = 12
  const FLOW_MAX = 8
  const PADDING = { top: 10, right: 10, bottom: 24, left: 36 }
  const WIDTH = 520
  const HEIGHT = 200

  let livePoints = $state([])
  let brewStart = $state(0)
  let wasBrewing = false
  let isLive = $state(false)

  let ms = $derived($machineState)
  let fullShot = $derived($latestShotFull)

  // Convert last shot's measurements to chart points
  let historicPoints = $derived.by(() => {
    if (!fullShot?.measurements?.length) return []
    const start = fullShot.measurements[0]?.machine?.timestamp
    return fullShot.measurements.map((m, i) => {
      const time = start
        ? (new Date(m.machine?.timestamp).getTime() - new Date(start).getTime()) / 1000
        : i * 0.1
      return {
        time: Math.max(0, time),
        pressure: m.machine?.pressure ?? 0,
        flow: m.machine?.flow ?? 0,
      }
    })
  })

  let dataPoints = $derived(isLive ? livePoints : historicPoints)
  let hasData = $derived(dataPoints.length > 0)

  let plotW = WIDTH - PADDING.left - PADDING.right
  let plotH = HEIGHT - PADDING.top - PADDING.bottom

  let maxTime = $derived(Math.max(30, ...dataPoints.map((d) => d.time)))

  let pressurePath = $derived(buildPath(dataPoints, 'pressure', PRESSURE_MAX))
  let flowPath = $derived(buildPath(dataPoints, 'flow', FLOW_MAX))

  // Accumulate data while brewing
  $effect(() => {
    const brewing = ms.isBrewing
    const pressure = ms.pressure
    const flow = ms.flow

    if (brewing && !wasBrewing) {
      livePoints = []
      brewStart = Date.now()
      isLive = true
    }
    if (brewing) {
      const time = (Date.now() - brewStart) / 1000
      untrack(() => {
        livePoints.push({ time, pressure, flow })
      })
    }
    if (!brewing && wasBrewing) {
      // Keep showing live data until next historic load
    }
    wasBrewing = brewing
  })

  function buildPath(points, key, max) {
    if (points.length < 2) return ''
    return points
      .map((p) => {
        const x = PADDING.left + (p.time / maxTime) * plotW
        const y = PADDING.top + plotH - (p[key] / max) * plotH
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  // Y-axis tick positions
  let pressureTicks = [0, 3, 6, 9, 12]
  let flowTicks = [0, 2, 4, 6, 8]

  function yPos(value, max) {
    return PADDING.top + plotH - (value / max) * plotH
  }
</script>

<div class="col-span-7 glass-panel rounded-2xl p-6 flex flex-col gap-3 min-h-48">
  <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Extraction Curve</span>
  {#if hasData}
    <svg viewBox="0 0 {WIDTH} {HEIGHT}" class="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <!-- Grid lines -->
      {#each pressureTicks as tick}
        <line
          x1={PADDING.left} x2={WIDTH - PADDING.right}
          y1={yPos(tick, PRESSURE_MAX)} y2={yPos(tick, PRESSURE_MAX)}
          stroke="var(--color-outline)" stroke-opacity="0.15" stroke-width="0.5"
        />
      {/each}

      <!-- Y-axis labels: pressure (left) -->
      {#each pressureTicks as tick}
        <text
          x={PADDING.left - 4} y={yPos(tick, PRESSURE_MAX) + 3}
          text-anchor="end" class="chart-label" fill="var(--color-primary)"
        >{tick}</text>
      {/each}

      <!-- Y-axis labels: flow (right) -->
      {#each flowTicks as tick}
        <text
          x={WIDTH - PADDING.right + 4} y={yPos(tick, FLOW_MAX) + 3}
          text-anchor="start" class="chart-label" fill="var(--color-secondary)"
        >{tick}</text>
      {/each}

      <!-- X-axis time labels -->
      {#each Array.from({ length: Math.floor(maxTime / 10) + 1 }, (_, i) => i * 10) as t}
        <text
          x={PADDING.left + (t / maxTime) * plotW} y={HEIGHT - 4}
          text-anchor="middle" class="chart-label" fill="var(--color-on-surface-variant)"
        >{t}s</text>
      {/each}

      <!-- Axis unit labels -->
      <text x={4} y={PADDING.top - 2} class="chart-label" fill="var(--color-primary)">bar</text>
      <text x={WIDTH - 4} y={PADDING.top - 2} text-anchor="end" class="chart-label" fill="var(--color-secondary)">ml/s</text>

      <!-- Data lines -->
      {#if pressurePath}
        <polyline points={pressurePath} fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      {/if}
      {#if flowPath}
        <polyline points={flowPath} fill="none" stroke="var(--color-secondary)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      {/if}
    </svg>
  {:else}
    <div class="flex-1 flex items-center justify-center">
      <span class="font-body text-sm text-outline">No extraction data yet</span>
    </div>
  {/if}
</div>

<style>
  .chart-label {
    font-family: var(--font-label, 'Space Grotesk', sans-serif);
    font-size: 9px;
  }
</style>
