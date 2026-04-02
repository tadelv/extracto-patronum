<script>
  import { workflow, updateWorkflow } from '../lib/stores/workflow.js'
  import { get } from 'svelte/store'
  import GradientButton from '../lib/components/GradientButton.svelte'

  // --- Local editable state ---
  let dose = $state(0)
  let targetPressure = $state(9)
  let targetFlow = $state(2)
  let grinderSetting = $state('')
  let temperature = $state(93)
  let saving = $state(false)
  let dirty = $state(false)

  let wf = $derived($workflow)
  let profileSteps = $derived(wf?.profile?.steps ?? [])

  // Sync local state from workflow store
  $effect(() => {
    if (wf && !dirty) {
      dose = wf.context?.targetDoseWeight ?? 18
      grinderSetting = wf.context?.grinderSetting ?? ''
      // Temperature from profile tank_temperature or first step temp
      const tankTemp = wf.profile?.tank_temperature
      const firstStepTemp = wf.profile?.steps?.[0]?.temperature
      temperature = tankTemp ?? firstStepTemp ?? 93
      // Pressure/flow from profile first step or defaults
      const firstStep = wf.profile?.steps?.[0]
      targetPressure = firstStep?.pressure ?? 9
      targetFlow = firstStep?.flow ?? 2
    }
  })

  function adjust(field, delta, min, max) {
    dirty = true
    if (field === 'dose') dose = clamp(dose + delta, min, max)
    else if (field === 'pressure') targetPressure = clamp(targetPressure + delta, min, max)
    else if (field === 'flow') targetFlow = clamp(targetFlow + delta, min, max)
    else if (field === 'temperature') temperature = clamp(temperature + delta, min, max)
  }

  function clamp(val, min, max) {
    return Math.round(Math.max(min, Math.min(max, val)) * 10) / 10
  }

  function handleGrinderInput(e) {
    dirty = true
    grinderSetting = e.target.value
  }

  async function save() {
    saving = true
    try {
      // Update first profile step with pressure/flow if steps exist
      const currentSteps = wf?.profile?.steps ? [...wf.profile.steps] : []
      if (currentSteps.length > 0) {
        currentSteps[0] = {
          ...currentSteps[0],
          pressure: targetPressure,
          flow: targetFlow,
        }
      }
      const updates = {
        context: {
          ...(wf?.context ?? {}),
          targetDoseWeight: dose,
          targetYield: wf?.context?.targetYield ?? 0,
          grinderSetting,
        },
        profile: {
          ...(wf?.profile ?? {}),
          tank_temperature: temperature,
          steps: currentSteps,
        },
      }
      await updateWorkflow(updates)
      dirty = false
    } catch (e) {
      console.error('Failed to save extraction parameters:', e)
    } finally {
      saving = false
    }
  }

  function reset() {
    const current = get(workflow)
    dose = current?.context?.targetDoseWeight ?? 18
    grinderSetting = current?.context?.grinderSetting ?? ''
    const tankTemp = current?.profile?.tank_temperature
    const firstStepTemp = current?.profile?.steps?.[0]?.temperature
    temperature = tankTemp ?? firstStepTemp ?? 93
    const firstStep = current?.profile?.steps?.[0]
    targetPressure = firstStep?.pressure ?? 9
    targetFlow = firstStep?.flow ?? 2
    dirty = false
  }
</script>

<!-- Header -->
<div class="px-6 pt-6 pb-2">
  <h1 class="font-headline text-3xl font-bold text-primary">Extraction Lab</h1>
  <p class="font-body text-sm text-on-surface-variant mt-1">Fine-tune your extraction parameters</p>
</div>

<!-- Parameter Cards Grid -->
<div class="grid grid-cols-12 gap-4 px-6">

  <!-- Dose -->
  <div class="col-span-4 bg-surface-container-low p-6 rounded-xl">
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Dose</span>
    <div class="flex items-center justify-between mt-3">
      <button
        class="w-10 h-10 rounded-lg bg-surface-container-highest text-on-surface font-bold text-lg flex items-center justify-center tactile-sink"
        onclick={() => adjust('dose', -0.1, 5, 30)}
      >&minus;</button>
      <span class="font-label text-3xl font-bold text-on-surface tabular-nums">{dose.toFixed(1)}<span class="text-sm text-outline ml-1">g</span></span>
      <button
        class="w-10 h-10 rounded-lg bg-surface-container-highest text-on-surface font-bold text-lg flex items-center justify-center tactile-sink"
        onclick={() => adjust('dose', 0.1, 5, 30)}
      >+</button>
    </div>
  </div>

  <!-- Target Pressure -->
  <div class="col-span-4 bg-surface-container-low p-6 rounded-xl">
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Target Pressure</span>
    <div class="flex items-center justify-between mt-3">
      <button
        class="w-10 h-10 rounded-lg bg-surface-container-highest text-on-surface font-bold text-lg flex items-center justify-center tactile-sink"
        onclick={() => adjust('pressure', -0.5, 1, 12)}
      >&minus;</button>
      <span class="font-label text-3xl font-bold text-on-surface tabular-nums">{targetPressure.toFixed(1)}<span class="text-sm text-outline ml-1">bar</span></span>
      <button
        class="w-10 h-10 rounded-lg bg-surface-container-highest text-on-surface font-bold text-lg flex items-center justify-center tactile-sink"
        onclick={() => adjust('pressure', 0.5, 1, 12)}
      >+</button>
    </div>
  </div>

  <!-- Target Flow -->
  <div class="col-span-4 bg-surface-container-low p-6 rounded-xl">
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Target Flow</span>
    <div class="flex items-center justify-between mt-3">
      <button
        class="w-10 h-10 rounded-lg bg-surface-container-highest text-on-surface font-bold text-lg flex items-center justify-center tactile-sink"
        onclick={() => adjust('flow', -0.1, 0.5, 8)}
      >&minus;</button>
      <span class="font-label text-3xl font-bold text-on-surface tabular-nums">{targetFlow.toFixed(1)}<span class="text-sm text-outline ml-1">ml/s</span></span>
      <button
        class="w-10 h-10 rounded-lg bg-surface-container-highest text-on-surface font-bold text-lg flex items-center justify-center tactile-sink"
        onclick={() => adjust('flow', 0.1, 0.5, 8)}
      >+</button>
    </div>
  </div>

  <!-- Grind Size -->
  <div class="col-span-4 bg-surface-container-low p-6 rounded-xl">
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Grind Size</span>
    <div class="mt-3">
      <input
        type="text"
        value={grinderSetting}
        oninput={handleGrinderInput}
        placeholder="e.g. 2.5 or Fine"
        class="w-full bg-surface-container-highest text-on-surface font-label text-xl font-bold px-4 py-3 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary placeholder:text-outline"
      />
    </div>
  </div>

  <!-- Temperature -->
  <div class="col-span-8 bg-surface-container-low p-6 rounded-xl">
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Temperature</span>
    <div class="flex items-center justify-between mt-3">
      <button
        class="w-10 h-10 rounded-lg bg-surface-container-highest text-on-surface font-bold text-lg flex items-center justify-center tactile-sink"
        onclick={() => adjust('temperature', -0.5, 70, 100)}
      >&minus;</button>
      <span class="font-label text-5xl font-bold text-primary tabular-nums">{temperature.toFixed(1)}<span class="text-lg text-outline ml-1">&deg;C</span></span>
      <button
        class="w-10 h-10 rounded-lg bg-surface-container-highest text-on-surface font-bold text-lg flex items-center justify-center tactile-sink"
        onclick={() => adjust('temperature', 0.5, 70, 100)}
      >+</button>
    </div>
  </div>

  <!-- Profile Steps -->
  <div class="col-span-12 bg-surface-container-low p-6 rounded-xl">
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Profile Steps</span>
    {#if profileSteps.length > 0}
      <div class="mt-4 flex flex-col gap-2">
        {#each profileSteps as step, i}
          <div class="flex items-center gap-4 bg-surface-container-lowest px-4 py-3 rounded-lg">
            <span class="font-label text-xs text-outline w-6 text-center">{i + 1}</span>
            <span class="font-label text-sm font-bold text-on-surface flex-1">{step.name ?? `Step ${i + 1}`}</span>
            {#if step.pressure != null}
              <span class="font-label text-xs text-on-surface-variant">{step.pressure} bar</span>
            {/if}
            {#if step.flow != null}
              <span class="font-label text-xs text-on-surface-variant">{step.flow} ml/s</span>
            {/if}
            {#if step.temperature != null}
              <span class="font-label text-xs text-on-surface-variant">{step.temperature}&deg;C</span>
            {/if}
            {#if step.seconds != null}
              <span class="font-label text-xs text-outline">{step.seconds}s</span>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <p class="font-body text-sm text-outline mt-4">No profile steps available. Load a profile from the dashboard.</p>
    {/if}
  </div>

  <!-- Action buttons -->
  <div class="col-span-12 flex gap-4">
    <div class="flex-1">
      <GradientButton label={saving ? 'Saving...' : 'Save Parameters'} disabled={saving || !dirty} onclick={save} />
    </div>
    <button
      class="px-8 py-4 rounded-sm bg-surface-container-highest text-on-surface font-label font-bold uppercase tracking-widest tactile-sink transition-opacity"
      class:opacity-50={!dirty}
      disabled={!dirty}
      onclick={reset}
    >Reset</button>
  </div>
</div>

<div class="h-6"></div>
