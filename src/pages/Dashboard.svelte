<script>
  import { machineState } from '../lib/stores/machine.js'
  import { machineInfo } from '../lib/stores/machineInfo.js'
  import { workflow, updateWorkflow } from '../lib/stores/workflow.js'
  import { latestShot, loadLatestShot } from '../lib/stores/shots.js'
  import { waterLevel } from '../lib/stores/waterLevel.js'
  import { api } from '../lib/api/index.js'
  import DualGauge from '../lib/components/DualGauge.svelte'
  import MetricCard from '../lib/components/MetricCard.svelte'
  import GradientButton from '../lib/components/GradientButton.svelte'
  import ExtractionChart from '../lib/components/ExtractionChart.svelte'
  import MachineControl from '../lib/components/MachineControl.svelte'
  import ScaleCard from '../lib/components/ScaleCard.svelte'

  // --- Local state ---
  let steamEnabled = $state(true)
  let steamTemp = $state(140)
  let steamDuration = $state(60)
  let steamFlow = $state(0.6) // 0.6 = smooth, 1.2 = fast
  let timerMs = $state(0)
  let timerRunning = $state(false)
  let wasBrewing = false
  let steamLoading = $state(false)
  let rinseLoading = $state(false)
  let brewLoading = $state(false)
  let notesText = $state('')
  let notesRating = $state(0)
  let notesSaved = $state(false)

  // --- Derived values ---
  let ms = $derived($machineState)
  let wf = $derived($workflow)
  let shot = $derived($latestShot)
  let water = $derived($waterLevel)

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
    const activelyBrewing = ms.isBrewing &&
      (ms.substate === 'preinfusion' || ms.substate === 'pouring')

    // Detect transition: not actively brewing -> actively brewing => reset + start
    if (activelyBrewing && !wasBrewing) {
      timerMs = 0
      startTimer()
    }
    // Detect transition: brewing -> not brewing => stop
    if (!ms.isBrewing && wasBrewing) {
      stopTimer()
      loadLatestShot()
    }
    wasBrewing = activelyBrewing
  })

  // Cleanup on unmount
  $effect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval)
      clearTimeout(applyTimer)
    }
  })

  // Load latest shot on mount
  $effect(() => {
    loadLatestShot()
  })

  // Sync notes + rating when latest shot changes
  $effect(() => {
    if (shot) {
      notesText = shot.annotations?.espressoNotes ?? shot.shotNotes ?? ''
      notesRating = shot.annotations?.enjoyment ?? 0
      notesSaved = false
    }
  })

  function startTimer() {
    stopTimer()
    timerRunning = true
    const startTime = Date.now() - timerMs
    timerInterval = setInterval(() => {
      timerMs = Date.now() - startTime
    }, 100)
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
    steamTemp = Math.max(130, Math.min(160, steamTemp + delta))
  }

  function adjustSteamDuration(delta) {
    steamDuration = Math.max(10, Math.min(90, steamDuration + delta))
  }

  // Sync steam settings from workflow on first load
  let steamSettingsSynced = false
  $effect(() => {
    if (wf?.steamSettings && !steamSettingsSynced) {
      const t = wf.steamSettings.targetTemperature ?? 0
      steamEnabled = t > 0
      steamTemp = t > 0 ? Math.max(130, Math.min(160, t)) : 140
      steamDuration = wf.steamSettings.duration ?? 60
      steamFlow = wf.steamSettings.flow ?? 0.6
      steamSettingsSynced = true
    }
  })

  function buildSteamSettings() {
    return {
      targetTemperature: steamEnabled ? steamTemp : 0,
      duration: steamDuration,
      flow: steamFlow,
    }
  }

  // Auto-apply steam settings with 500ms debounce
  let applyTimer = null
  function debounceSteamApply() {
    clearTimeout(applyTimer)
    applyTimer = setTimeout(async () => {
      try {
        await updateWorkflow({ steamSettings: buildSteamSettings() })
      } catch (e) {
        console.error('Failed to apply steam settings:', e)
      }
    }, 500)
  }

  // Watch steam settings changes and auto-apply
  $effect(() => {
    // Read all steam values to track them
    const _ = [steamEnabled, steamTemp, steamDuration, steamFlow]
    if (steamSettingsSynced) {
      debounceSteamApply()
    }
  })

  async function startSteam() {
    clearTimeout(applyTimer) // cancel pending debounce, apply immediately
    steamLoading = true
    try {
      await updateWorkflow({ steamSettings: buildSteamSettings() })
      await api.put('/machine/state/steam')
    } catch (e) {
      console.error('Failed to start steam:', e)
    } finally {
      steamLoading = false
    }
  }

  async function stopSteam() {
    steamLoading = true
    try {
      await api.put('/machine/state/idle')
    } catch (e) {
      console.error('Failed to stop steam:', e)
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
        annotations: {
          ...shot.annotations,
          espressoNotes: notesText,
          enjoyment: notesRating > 0 ? notesRating : undefined,
        },
      })
      notesSaved = true
    } catch (e) {
      console.error('Failed to save notes:', e)
    }
  }

  function setRating(value) {
    notesRating = notesRating === value ? 0 : value // tap again to clear
    saveNotes()
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

<h1 class="sr-only">Dashboard</h1>

<!-- Header row -->
<div class="flex items-baseline justify-between px-4 md:px-6 pt-6 pb-2">
  <div class="flex items-baseline gap-3">
    <span class="font-headline text-sm font-bold tracking-widest text-primary">{stateLabel}</span>
    {#if coffeeName}
      <span class="font-body text-sm text-on-surface-variant">{coffeeName}</span>
    {/if}
  </div>
  <span class="font-label text-sm text-on-surface-variant truncate max-w-48">{profileTitle}</span>
</div>

<!-- Main grid -->
<div class="dashboard-grid gap-4 px-4 md:px-6 pb-6">

  <!-- Row 1: Metrics (auto height) -->
  <div class="flex flex-wrap gap-3 md:gap-4">
    <div class="flex-1 min-w-[calc(50%-0.75rem)] sm:min-w-0"><MetricCard label="Mix Temp" value={ms.mixTemperature.toFixed(1)} unit="°C" href="/lab" /></div>
    <div class="flex-1 min-w-[calc(50%-0.75rem)] sm:min-w-0"><MetricCard label="Group Temp" value={ms.groupTemperature.toFixed(1)} unit="°C" href="/lab" /></div>
    <div class="flex-1 min-w-[calc(50%-0.75rem)] sm:min-w-0"><MetricCard label="Steam Temp" value={ms.steamTemperature.toFixed(1)} unit="°C" /></div>
    <div class="flex-1 min-w-[calc(50%-0.75rem)] sm:min-w-0"><MetricCard label="Target Yield" value={targetYield} unit="g" href="/lab" /></div>
    <div class="flex-1 min-w-[calc(50%-0.75rem)] sm:min-w-0"><MetricCard label="Dose" value={targetDose} unit="g" href="/lab" /></div>
    {#if water.connected}
      <div class="flex-1">
        <div
          class="bg-surface-container-low px-4 py-3 rounded-xl ghost-border flex flex-col gap-1"
          class:text-error={water.needsRefill}
        >
          <span class="font-label text-xs tracking-widest uppercase"
            class:text-on-surface-variant={!water.needsRefill}
            class:text-error={water.needsRefill}
          >Water</span>
          <div class="flex items-baseline gap-1">
            <span class="font-label text-2xl font-bold"
              class:text-on-surface={!water.needsRefill}
              class:text-error={water.needsRefill}
            >{water.percent}</span>
            <span class="font-label text-xs text-outline">%</span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Row 2: Controls (auto height) -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <MachineControl />
    <ScaleCard />
  </div>

  <!-- Row 3: Gauges + Timer + Steam (minmax compression) -->
  <div class="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
    <!-- Dual Gauges -->
    <div class="col-span-12 md:col-span-4 glass-panel copper-glow rounded-2xl p-6 flex items-center justify-center min-h-0">
      <DualGauge pressure={ms.pressure} maxPressure={12} flow={ms.flow} maxFlow={8} size={260} />
    </div>

    <!-- Shot Timer + Brew Control -->
    <div
      class="col-span-12 sm:col-span-6 md:col-span-3 glass-panel rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-shadow duration-500 min-h-0"
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

      {#if !hasGHC}
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
      {/if}
    </div>

    <!-- Steam Panel -->
    <div
      class="col-span-12 sm:col-span-6 md:col-span-5 glass-panel rounded-2xl p-6 flex flex-col gap-3 transition-shadow duration-500 min-h-0"
      class:steam-active-glow={ms.isSteaming}
    >
      <!-- Header with enable toggle -->
      <div class="flex items-center justify-between">
        <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Steam Control</span>
        <button
          class="relative w-12 h-6 rounded-full transition-colors tactile-sink"
          class:bg-primary={steamEnabled}
          class:bg-surface-container-highest={!steamEnabled}
          onclick={() => { steamEnabled = !steamEnabled; applySteamSettings() }}
          aria-label="Toggle steam"
        >
          <div
            class="absolute top-1 w-4 h-4 rounded-full bg-on-surface transition-transform duration-200"
            class:translate-x-1={!steamEnabled}
            class:translate-x-7={steamEnabled}
          ></div>
        </button>
      </div>

      {#if steamEnabled}
        <!-- Temperature -->
        <div class="flex items-center justify-between">
          <span class="font-label text-xs tracking-wider uppercase text-on-surface-variant">Temp</span>
          <div class="flex items-center gap-2">
            <button class="w-10 h-10 rounded-md bg-surface-container-highest text-on-surface text-sm flex items-center justify-center tactile-sink" onclick={() => adjustSteamTemp(-5)} aria-label="Decrease steam temperature">&minus;</button>
            <span class="font-label text-lg font-bold text-on-surface tabular-nums w-14 text-center">{steamTemp}&deg;C</span>
            <button class="w-10 h-10 rounded-md bg-surface-container-highest text-on-surface text-sm flex items-center justify-center tactile-sink" onclick={() => adjustSteamTemp(5)} aria-label="Increase steam temperature">+</button>
          </div>
        </div>

        <!-- Duration -->
        <div class="flex items-center justify-between">
          <span class="font-label text-xs tracking-wider uppercase text-on-surface-variant">Time</span>
          <div class="flex items-center gap-2">
            <button class="w-10 h-10 rounded-md bg-surface-container-highest text-on-surface text-sm flex items-center justify-center tactile-sink" onclick={() => adjustSteamDuration(-5)} aria-label="Decrease steam duration">&minus;</button>
            <span class="font-label text-lg font-bold text-on-surface tabular-nums w-14 text-center">{steamDuration}s</span>
            <button class="w-10 h-10 rounded-md bg-surface-container-highest text-on-surface text-sm flex items-center justify-center tactile-sink" onclick={() => adjustSteamDuration(5)} aria-label="Increase steam duration">+</button>
          </div>
        </div>

        <!-- Flow -->
        <div class="flex items-center justify-between">
          <span class="font-label text-xs tracking-wider uppercase text-on-surface-variant">Flow</span>
          <div class="flex gap-1">
            <button
              class="px-3 py-2 rounded-md font-label text-xs tracking-wider uppercase transition-colors tactile-sink"
              class:bg-primary={steamFlow === 0.6}
              class:text-on-primary={steamFlow === 0.6}
              class:bg-surface-container-highest={steamFlow !== 0.6}
              class:text-on-surface-variant={steamFlow !== 0.6}
              onclick={() => steamFlow = 0.6}
            >Smooth</button>
            <button
              class="px-3 py-2 rounded-md font-label text-xs tracking-wider uppercase transition-colors tactile-sink"
              class:bg-primary={steamFlow === 1.2}
              class:text-on-primary={steamFlow === 1.2}
              class:bg-surface-container-highest={steamFlow !== 1.2}
              class:text-on-surface-variant={steamFlow !== 1.2}
              onclick={() => steamFlow = 1.2}
            >Fast</button>
          </div>
        </div>

        <!-- Live steam temp -->
        {#if ms.isSteaming}
          <div class="flex items-center justify-between">
            <span class="font-label text-xs tracking-wider uppercase text-primary">Live</span>
            <span class="font-label text-lg font-bold text-primary tabular-nums">{ms.steamTemperature.toFixed(1)}&deg;C</span>
          </div>
        {/if}
      {:else}
        <p class="font-body text-sm text-outline py-2">Steam disabled. Toggle on to configure.</p>
      {/if}

      <!-- Buttons -->
      <div class="flex gap-2 mt-auto">
        {#if ms.isSteaming}
          <div class="flex-1">
            <button
              class="w-full py-3 rounded-sm bg-error/20 text-error font-label font-bold uppercase tracking-widest tactile-sink transition-opacity"
              class:opacity-50={steamLoading}
              disabled={steamLoading}
              onclick={stopSteam}
            >Stop Steam</button>
          </div>
        {:else}
          {#if !hasGHC}
            <div class="flex-1">
              <GradientButton label="Start Steam" disabled={steamLoading || !steamEnabled || !ms.isIdle} onclick={startSteam} />
            </div>
          {/if}
        {/if}
        <button
          class="px-4 py-3 rounded-sm bg-surface-container-highest text-on-surface font-label font-bold uppercase tracking-widest tactile-sink transition-opacity text-sm"
          class:opacity-50={rinseLoading}
          disabled={rinseLoading}
          onclick={startRinse}
        >Rinse</button>
      </div>
    </div>
  </div>

  <!-- Row 4: Chart + Notes (minmax compression) -->
  <div class="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
    <!-- Extraction Curve -->
    <ExtractionChart />

    <!-- Extraction Notes -->
    <div class="col-span-12 md:col-span-5 glass-panel rounded-2xl p-6 flex flex-col gap-3 min-h-0">
      <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Extraction Notes</span>
      {#if shot}
        <textarea
          class="flex-1 bg-transparent text-on-surface font-body text-sm leading-relaxed resize-none outline-none placeholder:text-on-surface-variant/50"
          placeholder="Tasting notes, observations, adjustments for next time..."
          aria-label="Extraction notes"
          bind:value={notesText}
          onfocusout={saveNotes}
        ></textarea>
        <!-- Rating -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1" role="radiogroup" aria-label="Shot rating">
            <span class="font-label text-[10px] tracking-wider uppercase text-on-surface-variant mr-2">Rating</span>
            {#each [1, 2, 3, 4, 5] as n}
              <button
                class="w-7 h-7 rounded-md font-label text-xs font-bold transition-colors tactile-sink"
                class:bg-primary={notesRating >= n}
                class:text-on-primary={notesRating >= n}
                class:bg-surface-container-highest={notesRating < n}
                class:text-on-surface-variant={notesRating < n}
                onclick={() => setRating(n)}
                aria-label="Rate {n} out of 5"
                aria-pressed={notesRating >= n}
              >{n}</button>
            {/each}
          </div>
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
</div>

<style>
  .dashboard-grid {
    display: grid;
    min-height: 100%;
    grid-template-rows:
      auto                   /* metrics */
      auto                   /* controls */
      minmax(14rem, 1fr)     /* gauges + timer + steam */
      minmax(10rem, 1fr);    /* chart + notes */
  }

  @keyframes pulse-bar {
    from { height: 4px; opacity: 0.4; }
    to { height: 16px; opacity: 1; }
  }

  .steam-active-glow {
    box-shadow: 0 0 40px oklch(from var(--color-primary) l c h / 0.15),
                inset 0 0 20px oklch(from var(--color-primary) l c h / 0.05);
  }
</style>
