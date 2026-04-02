<script>
  import { api } from '../lib/api/index.js'
  import { shots } from '../lib/stores/shots.js'
  import GradientButton from '../lib/components/GradientButton.svelte'
  import MetricCard from '../lib/components/MetricCard.svelte'

  const SKIN_NS = 'extracto-patronum'

  // --- Maintenance data ---
  let lastDescaleDate = $state(null)
  let daysSinceDescale = $state(0)
  let flushLoading = $state(false)
  let saving = $state(false)
  let loading = $state(true)

  // Backflush checklist
  let flushSteps = $state([
    { label: 'Insert blind basket', done: false },
    { label: 'Initiate Pressure Cycle', done: false },
    { label: 'Rinse and Repeat', done: false },
  ])

  // Water quality
  let hardness = $state('')
  let tds = $state('')
  let ph = $state('')

  // Stats
  let totalShotsCount = $derived($shots.length)
  let lastMaintenanceLabel = $derived(
    lastDescaleDate
      ? new Date(lastDescaleDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Never'
  )

  // Load maintenance data on mount
  $effect(() => {
    loadMaintenanceData()
  })

  async function loadMaintenanceData() {
    loading = true
    try {
      const data = await api.get(`/store/${SKIN_NS}/maintenance`).catch(() => null)
      if (data?.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
        lastDescaleDate = parsed.lastDescaleDate ?? null
        hardness = parsed.waterQuality?.hardness ?? ''
        tds = parsed.waterQuality?.tds ?? ''
        ph = parsed.waterQuality?.ph ?? ''
      }
      if (lastDescaleDate) {
        const diff = Date.now() - new Date(lastDescaleDate).getTime()
        daysSinceDescale = Math.floor(diff / (1000 * 60 * 60 * 24))
      }
    } catch (e) {
      console.error('Failed to load maintenance data:', e)
    } finally {
      loading = false
    }
  }

  async function saveMaintenanceData() {
    saving = true
    try {
      await api.post(`/store/${SKIN_NS}/maintenance`, {
        value: JSON.stringify({
          lastDescaleDate,
          waterQuality: { hardness, tds, ph },
        }),
      })
    } catch (e) {
      console.error('Failed to save maintenance data:', e)
    } finally {
      saving = false
    }
  }

  async function markDescaled() {
    lastDescaleDate = new Date().toISOString()
    daysSinceDescale = 0
    await saveMaintenanceData()
  }

  async function startFlush() {
    flushLoading = true
    try {
      await api.put('/machine/state/flush')
    } catch (e) {
      console.error('Failed to start flush:', e)
    } finally {
      flushLoading = false
    }
  }

  function toggleStep(index) {
    flushSteps[index].done = !flushSteps[index].done
  }

  async function saveWaterQuality() {
    await saveMaintenanceData()
  }
</script>

<!-- Header -->
<div class="px-6 pt-6 pb-2">
  <h1 class="font-headline text-3xl font-bold text-primary">Machine Health</h1>
  <p class="font-body text-sm text-on-surface-variant mt-1">Maintenance and diagnostics</p>
</div>

{#if loading}
  <div class="flex items-center justify-center py-16">
    <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    <span class="font-label text-sm text-on-surface-variant ml-3">Loading...</span>
  </div>
{:else}
  <div class="grid grid-cols-12 gap-4 px-6">

    <!-- Descaling Alert -->
    <div class="col-span-6 bg-surface-container-low p-6 rounded-xl">
      <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Descaling</span>
      <div class="mt-4">
        {#if daysSinceDescale > 30}
          <div class="bg-error/10 border border-error/30 rounded-lg px-4 py-3 mb-4">
            <span class="font-label text-sm font-bold text-error">Descaling overdue!</span>
            <p class="font-body text-xs text-error/80 mt-1">{daysSinceDescale} days since last descale. Recommended every 30 days.</p>
          </div>
        {:else if lastDescaleDate}
          <p class="font-body text-sm text-on-surface-variant mb-4">
            Last descaled <span class="font-bold text-on-surface">{daysSinceDescale} days ago</span>. Next due in {30 - daysSinceDescale} days.
          </p>
        {:else}
          <p class="font-body text-sm text-on-surface-variant mb-4">No descaling recorded yet.</p>
        {/if}
        <button
          class="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface font-label font-bold uppercase tracking-widest tactile-sink text-sm"
          onclick={markDescaled}
        >Mark as Descaled</button>
      </div>
    </div>

    <!-- Backflush Routine -->
    <div class="col-span-6 bg-surface-container-low p-6 rounded-xl">
      <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Backflush Routine</span>
      <div class="mt-4 flex flex-col gap-3">
        {#each flushSteps as step, i}
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={step.done}
              onchange={() => toggleStep(i)}
              class="w-5 h-5 rounded accent-primary"
            />
            <span
              class="font-label text-sm transition-colors"
              class:text-on-surface={!step.done}
              class:text-outline={step.done}
              class:line-through={step.done}
            >{step.label}</span>
          </label>
        {/each}
        <div class="mt-2">
          <GradientButton label={flushLoading ? 'Flushing...' : 'Start Flush'} disabled={flushLoading} onclick={startFlush} />
        </div>
      </div>
    </div>

    <!-- Water Quality -->
    <div class="col-span-12 bg-surface-container-low p-6 rounded-xl">
      <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Water Quality</span>
      <div class="grid grid-cols-3 gap-4 mt-4">
        <div>
          <label class="font-label text-xs text-on-surface-variant block mb-1">Hardness (ppm)</label>
          <input
            type="number"
            bind:value={hardness}
            placeholder="e.g. 50"
            class="w-full bg-surface-container-highest text-on-surface font-label text-sm px-4 py-3 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary placeholder:text-outline"
          />
        </div>
        <div>
          <label class="font-label text-xs text-on-surface-variant block mb-1">TDS (ppm)</label>
          <input
            type="number"
            bind:value={tds}
            placeholder="e.g. 100"
            class="w-full bg-surface-container-highest text-on-surface font-label text-sm px-4 py-3 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary placeholder:text-outline"
          />
        </div>
        <div>
          <label class="font-label text-xs text-on-surface-variant block mb-1">pH</label>
          <input
            type="number"
            step="0.1"
            bind:value={ph}
            placeholder="e.g. 7.0"
            class="w-full bg-surface-container-highest text-on-surface font-label text-sm px-4 py-3 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary placeholder:text-outline"
          />
        </div>
      </div>
      <div class="mt-4">
        <button
          class="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface font-label font-bold uppercase tracking-widest tactile-sink text-sm"
          class:opacity-50={saving}
          disabled={saving}
          onclick={saveWaterQuality}
        >{saving ? 'Saving...' : 'Save Water Quality'}</button>
      </div>
    </div>

    <!-- Cycle Stats -->
    <div class="col-span-12 grid grid-cols-3 gap-4">
      <MetricCard label="Total Shots" value={totalShotsCount} icon="" />
      <MetricCard label="Last Maintenance" value={lastMaintenanceLabel} icon="" />
      <MetricCard label="Days Since Descale" value={daysSinceDescale} icon="" />
    </div>
  </div>
{/if}

<div class="h-6"></div>
