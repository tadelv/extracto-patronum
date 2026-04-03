<script>
  import { machineState } from '../lib/stores/machine.js'
  import { machineInfo } from '../lib/stores/machineInfo.js'
  import { scaleState } from '../lib/stores/scale.js'
  import { workflow } from '../lib/stores/workflow.js'
  import { latestShot, loadLatestShot } from '../lib/stores/shots.js'
  import { api } from '../lib/api/index.js'
  import DualGauge from '../lib/components/DualGauge.svelte'
  import MetricCard from '../lib/components/MetricCard.svelte'
  import GradientButton from '../lib/components/GradientButton.svelte'
  import ExtractionChart from '../lib/components/ExtractionChart.svelte'

  // --- Local state ---
  let steamTemp = $state(140)
  let timerMs = $state(0)
  let timerRunning = $state(false)
  let wasBrewing = false
  let steamLoading = $state(false)
  let rinseLoading = $state(false)

  // --- Derived values ---
  let ms = $derived($machineState)
  let sc = $derived($scaleState)
  let wf = $derived($workflow)
  let shot = $derived($latestShot)

  let info = $derived($machineInfo)
  let hasGHC = $derived(info?.GHC ?? true)

  let stateLabel = $derived(ms.state?.toUpperCase() ?? 'DISCONNECTED')
  let coffeeName = $derived(wf?.context?.coffeeName ?? '')
  let profileTitle = $derived(wf?.profile?.title ?? 'No profile')
  let targetYield = $derived(wf?.context?.targetYield ?? '—')
  let targetDose = $derived(wf?.context?.targetDoseWeight ?? '—')

  let timerDisplay = $derived(formatTimer(timerMs))

  // --- Shot timer via $effect ---
  let timerInterval = null

  $effect(() => {
    const brewing = ms.isBrewing

    // Detect transition: not brewing -> brewing => reset + start
    if (brewing && !wasBrewing) {
      timerMs = 0
      startTimer()
    }
    // Detect transition: brewing -> not brewing => stop
    if (!brewing && wasBrewing) {
      stopTimer()
      loadLatestShot()
    }
    wasBrewing = brewing
  })

  // Cleanup on unmount
  $effect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval)
    }
  })

  // Load latest shot on mount
  $effect(() => {
    loadLatestShot()
  })

  function startTimer() {
    stopTimer()
    timerRunning = true
    const startTime = Date.now() - timerMs
    timerInterval = setInterval(() => {
      timerMs = Date.now() - startTime
    }, 50)
  }

  function stopTimer() {
    timerRunning = false
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function formatTimer(ms) {
    const totalSeconds = ms / 1000
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const tenths = Math.floor((totalSeconds % 1) * 10)
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`
  }

  function adjustSteamTemp(delta) {
    steamTemp = Math.max(100, Math.min(165, steamTemp + delta))
  }

  async function startSteam() {
    steamLoading = true
    try {
      await api.post('/machine/shotSettings', { targetSteamTemp: steamTemp })
      await api.put('/machine/state/steam')
    } catch (e) {
      console.error('Failed to start steam:', e)
    } finally {
      steamLoading = false
    }
  }

  async function startRinse() {
    rinseLoading = true
    try {
      await api.put('/machine/state/steamRinse')
    } catch (e) {
      console.error('Failed to start rinse:', e)
    } finally {
      rinseLoading = false
    }
  }
</script>

<!-- Header row -->
<div class="flex items-baseline justify-between px-6 pt-6 pb-2">
  <div class="flex items-baseline gap-3">
    <span class="font-headline text-sm font-bold tracking-widest text-primary">{stateLabel}</span>
    {#if coffeeName}
      <span class="font-body text-sm text-on-surface-variant">{coffeeName}</span>
    {/if}
  </div>
  <span class="font-label text-sm text-on-surface-variant truncate max-w-48">{profileTitle}</span>
</div>

{#if !hasGHC}
  <div class="mx-6 mb-2 px-4 py-2 rounded-lg bg-surface-container-low">
    <span class="font-label text-xs tracking-wide text-on-surface-variant">No Group Head Controller detected -- start shots from this app or another interface.</span>
  </div>
{/if}

<!-- Main grid -->
<div class="grid grid-cols-12 gap-4 px-6">

  <!-- Dual Gauges -->
  <div class="col-span-4 glass-panel copper-glow rounded-2xl p-6 flex items-center justify-center">
    <DualGauge pressure={ms.pressure} maxPressure={12} flow={ms.flow} maxFlow={8} size={260} />
  </div>

  <!-- Shot Timer -->
  <div class="col-span-3 glass-panel rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Shot Timer</span>
    <span class="font-mono text-5xl font-bold text-on-surface tabular-nums">{timerDisplay}</span>
    {#if timerRunning}
      <div class="flex gap-1.5 items-center h-4">
        {#each [0, 1, 2, 3, 4] as i}
          <div
            class="w-1 rounded-full bg-primary"
            style="animation: pulse-bar 0.8s ease-in-out {i * 0.12}s infinite alternate; height: 8px;"
          ></div>
        {/each}
      </div>
    {:else}
      <div class="h-4"></div>
    {/if}
  </div>

  <!-- Steam Panel -->
  <div
    class="col-span-5 glass-panel rounded-2xl p-6 flex flex-col gap-4 transition-shadow duration-500"
    class:steam-active-glow={ms.isSteaming}
  >
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Steam Control</span>

    <!-- Target temp -->
    <div class="flex items-center justify-between">
      <span class="font-body text-sm text-on-surface-variant">Target</span>
      <div class="flex items-center gap-3">
        <button
          class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold text-lg flex items-center justify-center tactile-sink"
          onclick={() => adjustSteamTemp(-5)}
        >&minus;</button>
        <span class="font-label text-2xl font-bold text-on-surface tabular-nums w-16 text-center">{steamTemp}&deg;C</span>
        <button
          class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold text-lg flex items-center justify-center tactile-sink"
          onclick={() => adjustSteamTemp(5)}
        >+</button>
      </div>
    </div>

    <!-- Live steam temp (visible when steaming) -->
    {#if ms.isSteaming}
      <div class="flex items-center justify-between">
        <span class="font-body text-sm text-on-surface-variant">Live</span>
        <span class="font-label text-2xl font-bold text-primary tabular-nums">{ms.steamTemperature.toFixed(1)}&deg;C</span>
      </div>
    {/if}

    <!-- Buttons -->
    <div class="flex gap-3 mt-auto">
      <div class="flex-1">
        <GradientButton label="Start Steam" disabled={steamLoading || ms.isSteaming} onclick={startSteam} />
      </div>
      <button
        class="px-5 py-4 rounded-sm bg-surface-container-highest text-on-surface font-label font-bold uppercase tracking-widest tactile-sink transition-opacity"
        class:opacity-50={rinseLoading}
        disabled={rinseLoading}
        onclick={startRinse}
      >Rinse</button>
    </div>
  </div>

  <!-- Metrics row -->
  <div class="col-span-12 grid grid-cols-5 gap-4">
    <MetricCard label="Mix Temp" value={ms.mixTemperature.toFixed(1)} unit="°C" icon="🌡" />
    <MetricCard label="Group Temp" value={ms.groupTemperature.toFixed(1)} unit="°C" icon="🔥" />
    <MetricCard label="Weight" value={sc.weight.toFixed(1)} unit="g" icon="⚖" />
    <MetricCard label="Target Yield" value={targetYield} unit="g" icon="🎯" />
    <MetricCard label="Dose" value={targetDose} unit="g" icon="☕" />
  </div>

  <!-- Bottom row -->
  <!-- Extraction Curve -->
  <ExtractionChart />

  <!-- Extraction Intelligence -->
  <div class="col-span-5 glass-panel rounded-2xl p-6 flex flex-col gap-3 min-h-48">
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Extraction Intelligence</span>
    {#if shot}
      <div class="flex flex-col gap-2 overflow-y-auto">
        {#if shot.annotations?.enjoyment}
          <div class="flex items-center gap-2">
            <span class="font-label text-xs text-on-surface-variant">Enjoyment</span>
            <span class="font-label text-lg font-bold text-primary">{shot.annotations.enjoyment}/5</span>
          </div>
        {/if}
        {#if shot.annotations?.actualYield}
          <div class="flex items-center gap-2">
            <span class="font-label text-xs text-on-surface-variant">Actual Yield</span>
            <span class="font-label text-sm text-on-surface">{shot.annotations.actualYield}g</span>
          </div>
        {/if}
        {#if shot.shotNotes || shot.annotations?.espressoNotes}
          <p class="font-body text-sm text-on-surface-variant leading-relaxed">
            {shot.annotations?.espressoNotes ?? shot.shotNotes}
          </p>
        {/if}
      </div>
    {:else}
      <div class="flex-1 flex items-center justify-center">
        <span class="font-body text-sm text-outline">No shot data yet. Brew your first espresso!</span>
      </div>
    {/if}
  </div>
</div>

<!-- Bottom padding -->
<div class="h-6"></div>

<style>
  @keyframes pulse-bar {
    from { height: 4px; opacity: 0.4; }
    to { height: 16px; opacity: 1; }
  }

  .steam-active-glow {
    box-shadow: 0 0 40px oklch(from var(--color-primary) l c h / 0.15),
                inset 0 0 20px oklch(from var(--color-primary) l c h / 0.05);
  }
</style>
