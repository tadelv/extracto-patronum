<script>
  import { workflow, updateWorkflow } from '../lib/stores/workflow.js'
  import { api } from '../lib/api/index.js'
  import { onMount } from 'svelte'
  import MetricCard from '../lib/components/MetricCard.svelte'

  let wf = $derived($workflow)

  // --- Editable parameters ---
  let dose = $state(18)
  let yieldTarget = $state(36)
  let grinderSetting = $state('')
  let temperature = $state(93)

  // --- Profile data ---
  let profiles = $state([])
  let profilesLoading = $state(true)
  let currentProfileId = $derived(wf?.profile?.id ?? null)
  let currentProfileTitle = $derived(wf?.profile?.title ?? 'No profile')
  let profileSteps = $derived(wf?.profile?.steps ?? [])

  // --- Sync from workflow on load ---
  let synced = false
  $effect(() => {
    if (wf && !synced) {
      dose = wf.context?.targetDoseWeight ?? 18
      yieldTarget = wf.context?.targetYield ?? 36
      grinderSetting = wf.context?.grinderSetting ?? ''
      const tankTemp = wf.profile?.tank_temperature
      const firstStepTemp = wf.profile?.steps?.[0]?.temperature
      temperature = tankTemp ?? firstStepTemp ?? 93
      synced = true
    }
  })

  // --- Auto-save with debounce ---
  let saveTimer = null
  function debounceSave() {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      try {
        await updateWorkflow({
          context: {
            targetDoseWeight: dose,
            targetYield: yieldTarget,
            grinderSetting,
          },
          profile: {
            ...(wf?.profile ?? {}),
            tank_temperature: temperature,
          },
        })
      } catch (e) {
        console.error('Failed to save parameters:', e)
      }
    }, 500)
  }

  $effect(() => {
    const _ = [dose, yieldTarget, grinderSetting, temperature]
    if (synced) debounceSave()
  })

  // Cleanup
  $effect(() => {
    return () => clearTimeout(saveTimer)
  })

  // --- Profile loading ---
  onMount(async () => {
    try {
      const res = await api.get('/profiles')
      const all = Array.isArray(res) ? res : (res?.profiles ?? [])
      profiles = all.filter(p => (p.profile?.beverage_type ?? '').toLowerCase() === 'espresso')
    } catch (e) {
      console.error('Failed to load profiles:', e)
    } finally {
      profilesLoading = false
    }
  })

  async function selectProfile(profileRecord) {
    try {
      await updateWorkflow({ profile: profileRecord.profile })
      // Re-sync temperature from new profile
      const tankTemp = profileRecord.profile?.tank_temperature
      const firstStepTemp = profileRecord.profile?.steps?.[0]?.temperature
      temperature = tankTemp ?? firstStepTemp ?? 93
    } catch (e) {
      console.error('Failed to switch profile:', e)
    }
  }

  // --- Helpers ---
  let ratio = $derived(dose > 0 ? (yieldTarget / dose) : 0)
  let ratioDisplay = $derived(ratio.toFixed(1))

  function adjustDose(delta) {
    dose = Math.max(10, Math.min(30, Math.round((dose + delta) * 2) / 2))
  }
  function adjustYield(delta) {
    yieldTarget = Math.max(15, Math.min(80, Math.round((yieldTarget + delta) * 2) / 2))
  }
  function adjustTemp(delta) {
    temperature = Math.max(70, Math.min(100, Math.round((temperature + delta) * 10) / 10))
  }

  let showProfilePicker = $state(false)
</script>

<div class="h-full overflow-y-auto">
  <!-- Header -->
  <div class="px-6 pt-6 pb-4">
    <h1 class="font-headline text-3xl font-bold text-primary">Customizer</h1>
    <p class="font-body text-sm text-on-surface-variant mt-1">Tweak your shot parameters. Changes auto-save.</p>
  </div>

  <div class="grid grid-cols-12 gap-4 px-6 pb-6">

    <!-- Left column: Shot parameters -->
    <div class="col-span-7 flex flex-col gap-4">

      <!-- Dose & Yield row -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Dose -->
        <div class="glass-panel ghost-border rounded-xl p-5">
          <span class="font-label text-xs tracking-widest uppercase text-primary">Dose In</span>
          <div class="flex items-center justify-between mt-3">
            <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustDose(-0.5)}>&minus;</button>
            <div class="flex items-baseline">
              <input
                type="number"
                bind:value={dose}
                step="0.5"
                min="10" max="30"
                class="w-16 bg-transparent font-label text-4xl font-bold text-on-surface text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span class="font-label text-sm text-outline">g</span>
            </div>
            <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustDose(0.5)}>+</button>
          </div>
        </div>

        <!-- Yield -->
        <div class="glass-panel ghost-border rounded-xl p-5">
          <span class="font-label text-xs tracking-widest uppercase text-primary">Yield Out</span>
          <div class="flex items-center justify-between mt-3">
            <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustYield(-0.5)}>&minus;</button>
            <div class="flex items-baseline">
              <input
                type="number"
                bind:value={yieldTarget}
                step="0.5"
                min="15" max="80"
                class="w-16 bg-transparent font-label text-4xl font-bold text-on-surface text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span class="font-label text-sm text-outline">g</span>
            </div>
            <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustYield(0.5)}>+</button>
          </div>
        </div>
      </div>

      <!-- Ratio indicator -->
      <div class="flex items-center gap-4 px-2">
        <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Ratio</span>
        <span class="font-label text-lg font-bold text-primary">1:{ratioDisplay}</span>
        <div class="flex-1 h-px bg-outline-variant/20"></div>
      </div>

      <!-- Temperature -->
      <div class="glass-panel ghost-border rounded-xl p-5">
        <span class="font-label text-xs tracking-widest uppercase text-primary">Brew Temperature</span>
        <div class="flex items-center justify-between mt-3">
          <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustTemp(-0.5)}>&minus;</button>
          <span class="font-label text-5xl font-bold text-on-surface tabular-nums">{temperature.toFixed(1)}<span class="text-lg text-outline ml-1">&deg;C</span></span>
          <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustTemp(0.5)}>+</button>
        </div>
      </div>

      <!-- Grind Setting -->
      <div class="glass-panel ghost-border rounded-xl p-5">
        <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Grind Setting</span>
        <input
          type="text"
          bind:value={grinderSetting}
          placeholder="e.g. 2.5 or Fine"
          class="mt-3 w-full bg-transparent border-b border-outline-variant font-label text-xl font-bold text-on-surface
                 placeholder:text-outline focus:border-primary focus:outline-none pb-2 transition-colors"
        />
      </div>
    </div>

    <!-- Right column: Profile -->
    <div class="col-span-5 flex flex-col gap-4">

      <!-- Current profile card -->
      <div class="glass-panel ghost-border rounded-xl p-5 copper-glow">
        <span class="font-label text-xs tracking-widest uppercase text-primary">Active Profile</span>
        <h2 class="font-headline text-xl font-bold text-on-surface mt-2">{currentProfileTitle}</h2>
        {#if wf?.profile?.author}
          <p class="font-label text-xs text-on-surface-variant mt-1">by {wf.profile.author}</p>
        {/if}
        {#if wf?.profile?.notes}
          <p class="font-body text-xs text-on-surface-variant mt-2 line-clamp-3 leading-relaxed">{wf.profile.notes}</p>
        {/if}
        <button
          class="mt-4 font-label text-xs tracking-widest uppercase text-primary hover:underline transition-colors"
          onclick={() => showProfilePicker = !showProfilePicker}
        >{showProfilePicker ? 'Hide profiles' : 'Change profile'}</button>
      </div>

      <!-- Profile picker (toggled) -->
      {#if showProfilePicker}
        <div class="glass-panel ghost-border rounded-xl p-4 max-h-64 overflow-y-auto flex flex-col gap-2">
          {#if profilesLoading}
            <div class="flex items-center justify-center py-4">
              <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          {:else if profiles.length === 0}
            <p class="font-body text-sm text-outline text-center py-4">No espresso profiles found</p>
          {:else}
            {#each profiles as p}
              {@const isActive = p.id === currentProfileId}
              <button
                class="text-left px-3 py-2.5 rounded-lg transition-all hover:bg-surface-container-high"
                style:background-color={isActive ? 'oklch(from var(--color-primary) l c h / 0.1)' : undefined}
                onclick={() => { selectProfile(p); showProfilePicker = false }}
              >
                <span class="font-label text-sm font-bold block truncate"
                  class:text-primary={isActive}
                  class:text-on-surface={!isActive}
                >{p.profile?.title ?? 'Untitled'}</span>
                {#if p.profile?.author}
                  <span class="font-label text-[10px] text-on-surface-variant">by {p.profile.author}</span>
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      {/if}

      <!-- Profile steps visualization -->
      <div class="glass-panel ghost-border rounded-xl p-5 flex-1">
        <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Profile Steps</span>
        {#if profileSteps.length > 0}
          <div class="mt-3 flex flex-col gap-1.5">
            {#each profileSteps as step, i}
              <div class="flex items-center gap-3 px-3 py-2 rounded-md bg-surface-container-lowest/50">
                <span class="font-label text-[10px] text-outline w-4 text-center">{i + 1}</span>
                <span class="font-label text-xs font-bold text-on-surface flex-1 truncate">{step.name ?? `Step ${i + 1}`}</span>
                <div class="flex gap-3">
                  {#if step.pressure != null}
                    <span class="font-label text-[10px] text-on-surface-variant tabular-nums">{step.pressure}bar</span>
                  {/if}
                  {#if step.flow != null}
                    <span class="font-label text-[10px] tabular-nums" style="color: #fef3c7;">{step.flow}ml/s</span>
                  {/if}
                  {#if step.temperature != null}
                    <span class="font-label text-[10px] text-primary tabular-nums">{step.temperature}&deg;</span>
                  {/if}
                  {#if step.seconds != null}
                    <span class="font-label text-[10px] text-outline tabular-nums">{step.seconds}s</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="font-body text-sm text-outline mt-3">No profile loaded</p>
        {/if}
      </div>
    </div>
  </div>
</div>
