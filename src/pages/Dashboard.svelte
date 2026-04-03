<script>
  import { machineState } from '../lib/stores/machine.js'
  import { machineInfo } from '../lib/stores/machineInfo.js'
  import { scaleState } from '../lib/stores/scale.js'
  import { workflow } from '../lib/stores/workflow.js'
  import { latestShot, loadLatestShot } from '../lib/stores/shots.js'
  import { shotSettings } from '../lib/stores/shotSettings.js'
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
  let brewLoading = $state(false)
  let notesText = $state('')
  let notesSaved = $state(false)

  // --- Derived values ---
  let ms = $derived($machineState)
  let sc = $derived($scaleState)
  let wf = $derived($workflow)
  let shot = $derived($latestShot)
  let currentSettings = $derived($shotSettings)

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

  // Sync notes text when latest shot changes
  $effect(() => {
    if (shot) {
      notesText = shot.annotations?.espressoNotes ?? shot.shotNotes ?? ''
      notesSaved = false
    }
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

  // Sync steam temp from machine settings on first receive
  let steamTempSynced = false
  $effect(() => {
    if (currentSettings && !steamTempSynced) {
      steamTemp = currentSettings.targetSteamTemp
      steamTempSynced = true
    }
  })

  async function startSteam() {
    steamLoading = true
    try {
      await api.post('/machine/shotSettings', {
        ...currentSettings,
        targetSteamTemp: steamTemp,
      })
      await api.put('/machine/state/steam')
    } catch (e) {
      console.error('Failed to start steam:', e)
    } finally {
      steamLoading = false
    }
  }

  async function startEspresso() {
    brewLoading = true
    try {
      await api.put('/machine/state/espresso')
    } catch (e) {
      console.error('Failed to start espresso:', e)
    } finally {
      brewLoading = false
    }
  }

  async function stopEspresso() {
    brewLoading = true
    try {
      await api.put('/machine/state/idle')
    } catch (e) {
      console.error('Failed to stop espresso:', e)
    } finally {
      brewLoading = false
    }
  }

  async function saveNotes() {
    if (!shot?.id) return
    try {
      await api.put(`/shots/${shot.id}`, {
        annotations: { ...shot.annotations, espressoNotes: notesText },
      })
      notesSaved = true
    } catch (e) {
      console.error('Failed to save notes:', e)
    }
  }

  async function tareScale() {
    try {
      await api.put('/scale/tare')
    } catch (e) {
      console.error('Failed to tare scale:', e)
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

<!-- Main grid -->
<div class="grid grid-cols-12 gap-4 px-6">

  <!-- Metrics row -->
  <div
    class="col-span-12 grid gap-4"
    class:grid-cols-5={sc.connected}
    class:grid-cols-4={!sc.connected}
  >
    <MetricCard label="Mix Temp" value={ms.mixTemperature.toFixed(1)} unit="°C" href="/lab" />
    <MetricCard label="Group Temp" value={ms.groupTemperature.toFixed(1)} unit="°C" href="/lab" />
    {#if sc.connected}
      <button
        class="bg-surface-container-low px-4 py-3 rounded-xl ghost-border flex flex-col gap-1 text-left cursor-pointer hover:bg-surface-container transition-colors click-sink"
        onclick={tareScale}
        title="Tap to tare"
      >
        <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Weight</span>
        <div class="flex items-baseline gap-1">
          <span class="font-label text-2xl font-bold text-on-surface">{sc.weight.toFixed(1)}</span>
          <span class="font-label text-xs text-outline">g</span>
        </div>
      </button>
    {/if}
    <MetricCard label="Target Yield" value={targetYield} unit="g" href="/lab" />
    <MetricCard label="Dose" value={targetDose} unit="g" href="/lab" />
  </div>

  <!-- Dual Gauges -->
  <div class="col-span-4 glass-panel copper-glow rounded-2xl p-6 flex items-center justify-center">
    <DualGauge pressure={ms.pressure} maxPressure={12} flow={ms.flow} maxFlow={8} size={260} />
  </div>

  <!-- Shot Timer + Brew Control -->
  <div
    class="col-span-3 glass-panel rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-shadow duration-500"
    class:ambient-glow-active={ms.isBrewing}
  >
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

    {#if ms.isBrewing}
      <button
        class="w-full py-3 rounded-sm bg-error/20 text-error font-label font-bold uppercase tracking-widest tactile-sink transition-opacity"
        class:opacity-50={brewLoading}
        disabled={brewLoading}
        onclick={stopEspresso}
      >Stop</button>
    {:else}
      <button
        class="w-full py-3 gradient-cta text-on-primary-fixed font-label font-bold uppercase tracking-widest rounded-sm tactile-sink transition-opacity"
        class:opacity-50={brewLoading || !ms.isIdle}
        disabled={brewLoading || !ms.isIdle}
        onclick={startEspresso}
      >Start Shot</button>
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

  <!-- Bottom row -->
  <!-- Extraction Curve -->
  <ExtractionChart />

  <!-- Extraction Notes -->
  <div class="col-span-5 glass-panel rounded-2xl p-6 flex flex-col gap-3 min-h-48">
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Extraction Notes</span>
    {#if shot}
      <textarea
        class="flex-1 bg-transparent text-on-surface font-body text-sm leading-relaxed resize-none outline-none placeholder:text-outline"
        placeholder="How was this shot? Tasting notes, observations..."
        bind:value={notesText}
        onfocusout={saveNotes}
      ></textarea>
      <div class="flex items-center justify-between">
        {#if shot.annotations?.enjoyment}
          <span class="font-label text-xs text-on-surface-variant">Enjoyment: <span class="text-primary font-bold">{shot.annotations.enjoyment}/5</span></span>
        {/if}
        {#if notesSaved}
          <span class="font-label text-xs text-primary">Saved</span>
        {/if}
      </div>
    {:else}
      <div class="flex-1 flex items-center justify-center">
        <span class="font-body text-sm text-outline">Pull a shot to add notes</span>
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
