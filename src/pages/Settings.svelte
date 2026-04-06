<script>
  import { push } from 'svelte-spa-router'
  import { api } from '../lib/api/index.js'
  import { resetOnboarding } from '../lib/stores/onboarding.js'
  import { devices } from '../lib/stores/devices.js'
  import GradientButton from '../lib/components/GradientButton.svelte'

  const SKIN_NS = 'extracto-patronum'

  // --- Interface mode ---
  let interfaceMode = $state('operator')

  // --- Brightness ---
  let brightness = $state(50)
  let brightnessLoading = $state(false)

  // --- Schedules ---
  let schedules = $state([])
  let schedulesLoading = $state(false)
  let newScheduleTime = $state('07:00')
  let newScheduleDays = $state('weekdays')

  // --- Devices ---
  let devList = $derived($devices)
  let preferredMachine = $state('')
  let preferredScale = $state('')

  // --- Loading ---
  let loading = $state(true)
  let savingPrefs = $state(false)
  let saveError = $state('')

  // Load settings on mount
  $effect(() => {
    loadSettings()
  })

  async function loadSettings() {
    loading = true
    try {
      // Load skin store settings
      const prefs = await api.get(`/store/${SKIN_NS}/settings`).catch(() => null)
      if (prefs?.value) {
        const parsed = typeof prefs.value === 'string' ? JSON.parse(prefs.value) : prefs.value
        interfaceMode = parsed.interfaceMode ?? 'operator'
        preferredMachine = parsed.preferredMachine ?? ''
        preferredScale = parsed.preferredScale ?? ''
      }

      // Load display brightness
      const display = await api.get('/display').catch(() => null)
      if (display?.brightness != null) {
        brightness = display.brightness
      }

      // Load presence schedules
      await loadSchedules()
    } catch (e) {
      console.error('Failed to load settings:', e)
    } finally {
      loading = false
    }
  }

  async function loadSchedules() {
    schedulesLoading = true
    try {
      const result = await api.get('/presence/schedules').catch(() => null)
      schedules = Array.isArray(result) ? result : (result?.schedules ?? [])
    } catch (e) {
      console.error('Failed to load schedules:', e)
    } finally {
      schedulesLoading = false
    }
  }

  async function savePreferences() {
    savingPrefs = true
    saveError = ''
    try {
      await api.post(`/store/${SKIN_NS}/settings`, {
        value: JSON.stringify({
          interfaceMode,
          preferredMachine,
          preferredScale,
        }),
      })
      // Also update Bridge auto-connect settings
      await api.post('/settings', {
        preferredMachineId: preferredMachine,
        preferredScaleId: preferredScale,
      })
    } catch (e) {
      console.error('Failed to save preferences:', e)
      saveError = 'Failed to save preferences. Please try again.'
    } finally {
      savingPrefs = false
    }
  }

  async function toggleMode() {
    interfaceMode = interfaceMode === 'operator' ? 'tinkerer' : 'operator'
    await savePreferences()
  }

  async function handleRerunOnboarding() {
    await resetOnboarding()
    push('/onboarding')
  }

  async function updateBrightness() {
    brightnessLoading = true
    try {
      await api.put('/display/brightness', { brightness })
    } catch (e) {
      console.error('Failed to update brightness:', e)
    } finally {
      brightnessLoading = false
    }
  }

  function parseDays(selection) {
    if (selection === 'daily') return [1, 2, 3, 4, 5, 6, 7]
    if (selection === 'weekdays') return [1, 2, 3, 4, 5]
    if (selection === 'weekends') return [6, 7]
    return [1, 2, 3, 4, 5, 6, 7]
  }

  async function addSchedule() {
    try {
      await api.post('/presence/schedules', {
        time: newScheduleTime,
        daysOfWeek: parseDays(newScheduleDays),
        enabled: true,
      })
      await loadSchedules()
    } catch (e) {
      console.error('Failed to add schedule:', e)
    }
  }

  async function deleteSchedule(id) {
    try {
      await api.del(`/presence/schedules/${id}`)
      await loadSchedules()
    } catch (e) {
      console.error('Failed to delete schedule:', e)
    }
  }

  function handlePreferredMachine(e) {
    preferredMachine = e.target.value
    savePreferences()
  }

  function handlePreferredScale(e) {
    preferredScale = e.target.value
    savePreferences()
  }
</script>

<!-- Header -->
<div class="px-6 pt-6 pb-2">
  <h1 class="font-headline text-3xl font-bold text-primary">Settings</h1>
  <p class="font-body text-sm text-on-surface-variant mt-1">Configure your experience</p>
</div>

{#if loading}
  <div class="flex items-center justify-center py-16">
    <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    <span class="font-label text-sm text-on-surface-variant ml-3">Loading settings...</span>
  </div>
{:else}
  {#if saveError}
    <div class="mx-6 mb-2 p-4 rounded-lg bg-error-container text-on-error-container font-body text-sm">
      {saveError}
    </div>
  {/if}
  <div class="flex flex-col gap-4 px-6">

    <!-- Interface Mode — hidden for now, TODO: implement Operator vs Tinkerer views -->

    <!-- Re-run Onboarding -->
    <div class="bg-surface-container-low p-6 rounded-xl">
      <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Onboarding</span>
      <div class="flex items-center justify-between mt-4">
        <p class="font-body text-sm text-on-surface-variant">Re-run the setup wizard to reconfigure your preferences.</p>
        <button
          class="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface font-label font-bold uppercase tracking-widest tactile-sink text-sm whitespace-nowrap"
          onclick={handleRerunOnboarding}
        >Re-run Setup</button>
      </div>
    </div>

    <!-- Display Brightness -->
    <div class="bg-surface-container-low p-6 rounded-xl">
      <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Display Brightness</span>
      <div class="flex items-center gap-4 mt-4">
        <span class="font-label text-xs text-outline w-6">0</span>
        <input
          type="range"
          min="0"
          max="100"
          bind:value={brightness}
          onchange={updateBrightness}
          class="flex-1 accent-primary h-2"
        />
        <span class="font-label text-xs text-outline w-8">100</span>
        <span class="font-label text-lg font-bold text-on-surface tabular-nums w-12 text-right">{brightness}%</span>
      </div>
    </div>

    <!-- Device Preferences -->
    <div class="bg-surface-container-low p-6 rounded-xl">
      <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Device Preferences</span>
      <div class="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label for="preferred-machine" class="font-label text-xs text-on-surface-variant block mb-2">Preferred Machine</label>
          {#if devList.machines.length > 0}
            <select
              id="preferred-machine"
              value={preferredMachine}
              onchange={handlePreferredMachine}
              class="w-full bg-surface-container-highest text-on-surface font-label text-sm px-4 py-3 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Auto-detect</option>
              {#each devList.machines as machine}
                <option value={machine.id}>{machine.name ?? machine.id}</option>
              {/each}
            </select>
          {:else}
            <p class="font-body text-sm text-outline">No machines detected</p>
          {/if}
        </div>
        <div>
          <label for="preferred-scale" class="font-label text-xs text-on-surface-variant block mb-2">Preferred Scale</label>
          {#if devList.scales.length > 0}
            <select
              id="preferred-scale"
              value={preferredScale}
              onchange={handlePreferredScale}
              class="w-full bg-surface-container-highest text-on-surface font-label text-sm px-4 py-3 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Auto-detect</option>
              {#each devList.scales as scale}
                <option value={scale.id}>{scale.name ?? scale.id}</option>
              {/each}
            </select>
          {:else}
            <p class="font-body text-sm text-outline">No scales detected</p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Presence Schedules -->
    <div class="bg-surface-container-low p-6 rounded-xl">
      <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Presence Schedules</span>
      <p class="font-body text-xs text-on-surface-variant mt-1">Configure when the machine wakes up automatically.</p>

      {#if schedules.length > 0}
        <div class="flex flex-col gap-2 mt-4">
          {#each schedules as schedule}
            <div class="flex items-center justify-between bg-surface-container-lowest px-4 py-3 rounded-lg">
              <div>
                <span class="font-label text-sm font-bold text-on-surface">{schedule.time ?? '—'}</span>
                <span class="font-label text-xs text-on-surface-variant ml-2">{schedule.days ?? 'daily'}</span>
                {#if schedule.enabled === false}
                  <span class="font-label text-xs text-outline ml-2">(disabled)</span>
                {/if}
              </div>
              <button
                class="w-8 h-8 rounded-lg bg-surface-container-highest text-on-surface-variant font-bold flex items-center justify-center tactile-sink text-sm"
                onclick={() => deleteSchedule(schedule.id)}
              >&times;</button>
            </div>
          {/each}
        </div>
      {:else if !schedulesLoading}
        <p class="font-body text-sm text-outline mt-4">No schedules configured.</p>
      {/if}

      <!-- Add schedule -->
      <div class="flex items-end gap-3 mt-4">
        <div>
          <label for="schedule-time" class="font-label text-xs text-on-surface-variant block mb-1">Time</label>
          <input
            id="schedule-time"
            type="time"
            bind:value={newScheduleTime}
            class="bg-surface-container-highest text-on-surface font-label text-sm px-4 py-3 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label for="schedule-days" class="font-label text-xs text-on-surface-variant block mb-1">Days</label>
          <select
            id="schedule-days"
            bind:value={newScheduleDays}
            class="bg-surface-container-highest text-on-surface font-label text-sm px-4 py-3 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="daily">Daily</option>
            <option value="weekdays">Weekdays</option>
            <option value="weekends">Weekends</option>
          </select>
        </div>
        <button
          class="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface font-label font-bold uppercase tracking-widest tactile-sink text-sm"
          onclick={addSchedule}
        >Add</button>
      </div>
    </div>
  </div>
{/if}

<div class="h-6"></div>
