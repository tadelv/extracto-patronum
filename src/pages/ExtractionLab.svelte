<script>
  import { workflow, updateWorkflow } from '../lib/stores/workflow.js'
  import { api } from '../lib/api/index.js'
  import { onMount } from 'svelte'

  let wf = $derived($workflow)

  // --- Editable parameters ---
  let dose = $state(18)
  let yieldTarget = $state(36)
  let grinderSetting = $state('')
  let temperature = $state(93)
  let preinfusionTime = $state(10)
  let peakPressure = $state(9)
  let extractionFlow = $state(2)

  // --- Coffee/beans data ---
  let beans = $state([])
  let beansLoading = $state(true)
  let showBeanPicker = $state(false)
  let currentCoffeeName = $derived(wf?.context?.coffeeName ?? '')
  let currentRoaster = $derived(wf?.context?.coffeeRoaster ?? '')

  // --- Profile data ---
  let profiles = $state([])
  let profilesLoading = $state(true)
  let currentProfileId = $derived(wf?.profile?.id ?? null)
  let currentProfileTitle = $derived(wf?.profile?.title ?? 'No profile')
  let profileSteps = $derived(wf?.profile?.steps ?? [])

  // --- Profile type analysis ---
  // Identify preinfusion steps (early steps before the main ramp/extraction)
  // and determine if the profile is pressure-dominant or flow-dominant
  let profileAnalysis = $derived.by(() => {
    const steps = wf?.profile?.steps ?? []
    if (steps.length === 0) return { type: 'unknown', preinfusionIndices: [], extractionIndices: [] }

    // Find where preinfusion ends and extraction begins
    // Heuristic: preinfusion steps are early steps with low pressure or fill/infuse/soak/bloom in name
    // Extraction steps come after and have the main pressure/flow targets
    const preinfusionNames = ['fill', 'prefill', 'preinfusion', 'infuse', 'soak', 'bloom', 'compress', 'drip', 'pause', 'dynamic bloom']
    const preinfusionIndices = []
    const extractionIndices = []
    let foundExtraction = false

    for (let i = 0; i < steps.length; i++) {
      const name = (steps[i].name ?? '').toLowerCase()
      const isPreinfusion = !foundExtraction && (
        preinfusionNames.some(n => name.includes(n)) ||
        (i === 0 && steps.length > 2) // first step of multi-step is usually preinfusion
      )

      if (isPreinfusion) {
        preinfusionIndices.push(i)
      } else {
        foundExtraction = true
        extractionIndices.push(i)
      }
    }

    // If we didn't identify any preinfusion, treat step 0 as preinfusion for simple profiles
    if (preinfusionIndices.length === 0 && steps.length > 1) {
      preinfusionIndices.push(0)
      extractionIndices.splice(0, 0) // remove 0 from extraction if it was there
    }

    // Determine profile type from extraction steps' pump mode
    let pressureCount = 0
    let flowCount = 0
    for (const i of extractionIndices) {
      const pump = steps[i]?.pump ?? ''
      if (pump === 'pressure') pressureCount++
      else if (pump === 'flow') flowCount++
    }

    const type = flowCount > pressureCount ? 'flow' : 'pressure'

    // Find the peak value in extraction steps
    let peakPressureValue = 0
    let peakFlowValue = 0
    for (const i of extractionIndices) {
      const p = steps[i]?.pressure ?? 0
      const f = steps[i]?.flow ?? 0
      if (p > peakPressureValue) peakPressureValue = p
      if (f > peakFlowValue) peakFlowValue = f
    }

    // Total preinfusion time
    let totalPreinfusionTime = 0
    for (const i of preinfusionIndices) {
      totalPreinfusionTime += steps[i]?.seconds ?? 0
    }

    return {
      type,
      preinfusionIndices,
      extractionIndices,
      peakPressure: peakPressureValue,
      peakFlow: peakFlowValue,
      totalPreinfusionTime,
    }
  })

  let isFlowProfile = $derived(profileAnalysis.type === 'flow')

  // --- Sync from workflow on load ---
  let synced = false
  $effect(() => {
    if (wf && !synced) {
      dose = wf.context?.targetDoseWeight ?? 18
      yieldTarget = wf.context?.targetYield ?? 36
      grinderSetting = wf.context?.grinderSetting ?? ''
      temperature = wf.profile?.steps?.[0]?.temperature || 93
      preinfusionTime = profileAnalysis.totalPreinfusionTime || 10
      peakPressure = profileAnalysis.peakPressure || 9
      extractionFlow = profileAnalysis.peakFlow || 2
      synced = true
    }
  })

  // Re-sync profile-specific values when profile changes
  let lastProfileTitle = ''
  $effect(() => {
    const title = wf?.profile?.title ?? ''
    if (synced && title && title !== lastProfileTitle) {
      lastProfileTitle = title
      temperature = wf.profile?.steps?.[0]?.temperature || 93
      preinfusionTime = profileAnalysis.totalPreinfusionTime || 10
      peakPressure = profileAnalysis.peakPressure || 9
      extractionFlow = profileAnalysis.peakFlow || 2
    }
  })

  // --- Build adjusted steps ---
  function buildAdjustedSteps() {
    const steps = wf?.profile?.steps ?? []
    if (steps.length === 0) return steps

    const analysis = profileAnalysis
    const originalFirstTemp = steps[0]?.temperature ?? 93
    const tempDelta = temperature - originalFirstTemp

    // Calculate preinfusion time scale factor
    const originalPreTime = analysis.totalPreinfusionTime || 1
    const preTimeScale = preinfusionTime / originalPreTime

    // Calculate peak pressure/flow scale factor
    const originalPeakPressure = analysis.peakPressure || 1
    const pressureScale = peakPressure / originalPeakPressure

    const originalPeakFlow = analysis.peakFlow || 1
    const flowScale = extractionFlow / originalPeakFlow

    return steps.map((step, i) => {
      const adjusted = { ...step }

      // Temperature: shift all steps by delta
      if (adjusted.temperature != null) {
        adjusted.temperature = Math.round((adjusted.temperature + tempDelta) * 10) / 10
      }

      // Preinfusion time: scale preinfusion step durations
      if (analysis.preinfusionIndices.includes(i) && adjusted.seconds != null) {
        adjusted.seconds = Math.round(adjusted.seconds * preTimeScale * 10) / 10
      }

      // Peak pressure: scale extraction step pressures proportionally
      if (analysis.extractionIndices.includes(i) && analysis.type === 'pressure') {
        if (adjusted.pressure != null && adjusted.pressure > 0) {
          adjusted.pressure = Math.round(adjusted.pressure * pressureScale * 10) / 10
        }
      }

      // Extraction flow: scale extraction step flows proportionally
      if (analysis.extractionIndices.includes(i) && analysis.type === 'flow') {
        if (adjusted.flow != null && adjusted.flow > 0) {
          adjusted.flow = Math.round(adjusted.flow * flowScale * 10) / 10
        }
      }

      return adjusted
    })
  }

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
            steps: buildAdjustedSteps(),
          },
        })
      } catch (e) {
        console.error('Failed to save parameters:', e)
      }
    }, 500)
  }

  $effect(() => {
    const _ = [dose, yieldTarget, grinderSetting, temperature, preinfusionTime, peakPressure, extractionFlow]
    if (synced) debounceSave()
  })

  // Cleanup
  $effect(() => {
    return () => clearTimeout(saveTimer)
  })

  // --- Data loading ---
  onMount(async () => {
    // Load profiles and beans in parallel
    const [profileRes, beansRes, shotsRes] = await Promise.all([
      api.get('/profiles').catch(() => []),
      api.get('/beans').catch(() => []),
      api.get('/shots?limit=100&offset=0&order=desc').catch(() => ({ items: [] })),
    ])

    // Profiles
    const allProfiles = Array.isArray(profileRes) ? profileRes : (profileRes?.profiles ?? [])
    profiles = allProfiles.filter(p => (p.profile?.beverage_type ?? '').toLowerCase() === 'espresso')
    profilesLoading = false

    // Beans — cross-reference with recent shots for usage counts
    const allBeans = Array.isArray(beansRes) ? beansRes : []
    const shots = Array.isArray(shotsRes) ? shotsRes : (shotsRes?.items ?? [])

    // Count bean usage from recent shots
    const beanUsage = {}
    for (const s of shots) {
      const batchId = s.workflow?.context?.beanBatchId
      const name = s.workflow?.context?.coffeeName
      const key = batchId || name
      if (key) beanUsage[key] = (beanUsage[key] ?? 0) + 1
    }

    // Annotate beans with usage count and sort by recency
    beans = allBeans
      .filter(b => !b.archived)
      .map(b => ({
        ...b,
        _usage: beanUsage[b.id] ?? beanUsage[b.name] ?? 0,
      }))
      .sort((a, b) => b._usage - a._usage || new Date(b.updatedAt) - new Date(a.updatedAt))
    beansLoading = false
  })

  async function selectBean(bean) {
    try {
      await updateWorkflow({
        context: {
          coffeeName: bean.name,
          coffeeRoaster: bean.roaster,
          beanBatchId: bean.id,
        },
      })
      showBeanPicker = false
    } catch (e) {
      console.error('Failed to switch bean:', e)
    }
  }

  async function selectProfile(profileRecord) {
    try {
      lastProfileTitle = '' // force re-sync
      await updateWorkflow({ profile: profileRecord.profile })
    } catch (e) {
      console.error('Failed to switch profile:', e)
    }
  }

  // --- Helpers ---
  let ratio = $derived(dose > 0 ? (yieldTarget / dose) : 0)
  let ratioDisplay = $derived(ratio.toFixed(1))

  function adjustDose(delta) { dose = Math.max(10, Math.min(30, Math.round((dose + delta) * 2) / 2)) }
  function adjustYield(delta) { yieldTarget = Math.max(15, Math.min(80, Math.round((yieldTarget + delta) * 2) / 2)) }
  function adjustTemp(delta) { temperature = Math.max(70, Math.min(100, Math.round((temperature + delta) * 10) / 10)) }
  function adjustPreinfusion(delta) { preinfusionTime = Math.max(2, Math.min(60, Math.round((preinfusionTime + delta) * 10) / 10)) }
  function adjustPeakPressure(delta) { peakPressure = Math.max(3, Math.min(12, Math.round((peakPressure + delta) * 10) / 10)) }
  function adjustExtractionFlow(delta) { extractionFlow = Math.max(0.5, Math.min(6, Math.round((extractionFlow + delta) * 10) / 10)) }

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
        <div class="glass-panel ghost-border rounded-xl p-5">
          <span class="font-label text-xs tracking-widest uppercase text-primary">Dose In</span>
          <div class="flex items-center justify-between mt-3">
            <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustDose(-0.5)}>&minus;</button>
            <div class="flex items-baseline">
              <input type="number" bind:value={dose} step="0.5" min="10" max="30"
                class="w-16 bg-transparent font-label text-4xl font-bold text-on-surface text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
              <span class="font-label text-sm text-outline">g</span>
            </div>
            <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustDose(0.5)}>+</button>
          </div>
        </div>
        <div class="glass-panel ghost-border rounded-xl p-5">
          <span class="font-label text-xs tracking-widest uppercase text-primary">Yield Out</span>
          <div class="flex items-center justify-between mt-3">
            <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustYield(-0.5)}>&minus;</button>
            <div class="flex items-baseline">
              <input type="number" bind:value={yieldTarget} step="0.5" min="15" max="80"
                class="w-16 bg-transparent font-label text-4xl font-bold text-on-surface text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
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

      <!-- Brew Temperature -->
      <div class="glass-panel ghost-border rounded-xl p-5">
        <span class="font-label text-xs tracking-widest uppercase text-primary">Brew Temperature</span>
        <div class="flex items-center justify-between mt-3">
          <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustTemp(-0.5)}>&minus;</button>
          <span class="font-label text-5xl font-bold text-on-surface tabular-nums">{temperature.toFixed(1)}<span class="text-lg text-outline ml-1">&deg;C</span></span>
          <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustTemp(0.5)}>+</button>
        </div>
      </div>

      <!-- Preinfusion Time + Peak Pressure/Flow row -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Preinfusion Time -->
        <div class="glass-panel ghost-border rounded-xl p-5">
          <span class="font-label text-xs tracking-widest uppercase text-primary">Preinfusion</span>
          <p class="font-body text-[10px] text-on-surface-variant mt-0.5">Total soak time before extraction</p>
          <div class="flex items-center justify-between mt-3">
            <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustPreinfusion(-1)}>&minus;</button>
            <span class="font-label text-3xl font-bold text-on-surface tabular-nums">{preinfusionTime.toFixed(0)}<span class="text-sm text-outline ml-1">s</span></span>
            <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustPreinfusion(1)}>+</button>
          </div>
        </div>

        <!-- Peak Pressure or Extraction Flow (based on profile type) -->
        {#if isFlowProfile}
          <div class="glass-panel ghost-border rounded-xl p-5">
            <span class="font-label text-xs tracking-widest uppercase" style="color: #fef3c7;">Extraction Flow</span>
            <p class="font-body text-[10px] text-on-surface-variant mt-0.5">Target flow during extraction</p>
            <div class="flex items-center justify-between mt-3">
              <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustExtractionFlow(-0.1)}>&minus;</button>
              <span class="font-label text-3xl font-bold tabular-nums" style="color: #fef3c7;">{extractionFlow.toFixed(1)}<span class="text-sm text-outline ml-1">ml/s</span></span>
              <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustExtractionFlow(0.1)}>+</button>
            </div>
          </div>
        {:else}
          <div class="glass-panel ghost-border rounded-xl p-5">
            <span class="font-label text-xs tracking-widest uppercase text-primary">Peak Pressure</span>
            <p class="font-body text-[10px] text-on-surface-variant mt-0.5">Max pressure during extraction</p>
            <div class="flex items-center justify-between mt-3">
              <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustPeakPressure(-0.5)}>&minus;</button>
              <span class="font-label text-3xl font-bold text-on-surface tabular-nums">{peakPressure.toFixed(1)}<span class="text-sm text-outline ml-1">bar</span></span>
              <button class="w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface font-bold flex items-center justify-center tactile-sink" onclick={() => adjustPeakPressure(0.5)}>+</button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Grind Setting -->
      <div class="glass-panel ghost-border rounded-xl p-5">
        <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Grind Setting</span>
        <input type="text" bind:value={grinderSetting} placeholder="e.g. 2.5 or Fine"
          class="mt-3 w-full bg-transparent border-b border-outline-variant font-label text-xl font-bold text-on-surface
                 placeholder:text-outline focus:border-primary focus:outline-none pb-2 transition-colors" />
      </div>
    </div>

    <!-- Right column: Coffee + Profile -->
    <div class="col-span-5 flex flex-col gap-4">

      <!-- Current coffee card -->
      <div class="glass-panel ghost-border rounded-xl p-5">
        <span class="font-label text-xs tracking-widest uppercase text-primary">Coffee</span>
        <h2 class="font-headline text-lg font-bold text-on-surface mt-2">{currentCoffeeName || 'No coffee selected'}</h2>
        {#if currentRoaster}
          <p class="font-label text-xs text-on-surface-variant mt-0.5">{currentRoaster}</p>
        {/if}
        <button
          class="mt-3 font-label text-xs tracking-widest uppercase text-primary hover:underline transition-colors"
          onclick={() => showBeanPicker = !showBeanPicker}
        >{showBeanPicker ? 'Hide' : 'Change coffee'}</button>
      </div>

      <!-- Bean picker -->
      {#if showBeanPicker}
        <div class="glass-panel ghost-border rounded-xl p-4 max-h-56 overflow-y-auto flex flex-col gap-1">
          {#if beansLoading}
            <div class="flex items-center justify-center py-4">
              <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          {:else if beans.length === 0}
            <p class="font-body text-sm text-outline text-center py-4">No beans found on the Bridge</p>
          {:else}
            {#each beans as bean}
              {@const isActive = bean.name === currentCoffeeName && bean.roaster === currentRoaster}
              <button
                class="text-left px-3 py-2 rounded-lg transition-all hover:bg-surface-container-high"
                style:background-color={isActive ? 'oklch(from var(--color-primary) l c h / 0.1)' : undefined}
                onclick={() => selectBean(bean)}
              >
                <div class="flex items-center justify-between">
                  <span class="font-label text-sm font-bold truncate"
                    class:text-primary={isActive}
                    class:text-on-surface={!isActive}
                  >{bean.name}</span>
                  {#if bean._usage > 0}
                    <span class="font-label text-[10px] text-on-surface-variant ml-2 shrink-0">{bean._usage} shots</span>
                  {/if}
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-label text-[10px] text-on-surface-variant">{bean.roaster}</span>
                  {#if bean.country}
                    <span class="font-label text-[10px] text-outline">{bean.country}</span>
                  {/if}
                  {#if bean.processing}
                    <span class="font-label text-[10px] text-outline">{bean.processing}</span>
                  {/if}
                </div>
              </button>
            {/each}
          {/if}
        </div>
      {/if}

      <!-- Current profile card -->
      <div class="glass-panel ghost-border rounded-xl p-5 copper-glow">
        <div class="flex items-center justify-between">
          <span class="font-label text-xs tracking-widest uppercase text-primary">Active Profile</span>
          <span class="font-label text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm bg-surface-container-highest"
            class:text-primary={isFlowProfile}
            class:text-on-surface-variant={!isFlowProfile}
          >{isFlowProfile ? 'Flow' : 'Pressure'}</span>
        </div>
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

      <!-- Profile picker -->
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
              {@const isPreinfusion = profileAnalysis.preinfusionIndices.includes(i)}
              <div class="flex items-center gap-3 px-3 py-2 rounded-md"
                style:background-color={isPreinfusion ? 'oklch(from var(--color-primary) l c h / 0.04)' : 'oklch(from var(--color-surface-container-lowest) l c h / 0.5)'}
              >
                <span class="font-label text-[10px] w-4 text-center"
                  class:text-primary={isPreinfusion}
                  class:text-outline={!isPreinfusion}
                >{i + 1}</span>
                <span class="font-label text-xs font-bold flex-1 truncate"
                  class:text-primary={isPreinfusion}
                  class:text-on-surface={!isPreinfusion}
                >{step.name ?? `Step ${i + 1}`}</span>
                <div class="flex gap-3">
                  {#if step.pressure != null}
                    <span class="font-label text-[10px] text-on-surface-variant tabular-nums">{step.pressure}bar</span>
                  {/if}
                  {#if step.flow != null && step.flow > 0}
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
