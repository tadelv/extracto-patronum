<script>
  import { push } from 'svelte-spa-router'
  import { onboarding, saveOnboarding } from '../../lib/stores/onboarding.js'
  import { api } from '../../lib/api/index.js'
  import StepRoast from './StepRoast.svelte'
  import StepProfile from './StepProfile.svelte'
  import StepTargets from './StepTargets.svelte'
  import StepReview from './StepReview.svelte'

  const steps = [
    { component: StepRoast, label: 'Roast Selection', num: '01' },
    { component: StepProfile, label: 'Shot Profile', num: '02' },
    { component: StepTargets, label: 'Extraction Targets', num: '03' },
    { component: StepReview, label: 'Review', num: '04' },
  ]

  let currentStep = $derived(Math.min(Math.max($onboarding.currentStep ?? 0, 0), steps.length - 1))

  // Smart suggestions from recent shots
  let suggestions = $state(null)
  let suggestionsLoading = $state(true)

  $effect(() => {
    loadSuggestions()
  })

  async function loadSuggestions() {
    try {
      const result = await api.get('/shots?limit=14&offset=0&order=desc')
      const items = Array.isArray(result) ? result : (result.items ?? [])
      if (items.length === 0) {
        suggestionsLoading = false
        return
      }

      const recent = items

      // Find most-used coffee
      const coffeeCounts = {}
      const profileCounts = {}
      let totalDose = 0, doseCount = 0
      let totalYield = 0, yieldCount = 0

      for (const s of recent) {
        const ctx = s.workflow?.context
        const name = ctx?.coffeeName
        if (name) coffeeCounts[name] = (coffeeCounts[name] ?? 0) + 1

        const pTitle = s.workflow?.profile?.title
        if (pTitle) profileCounts[pTitle] = (profileCounts[pTitle] ?? 0) + 1

        const dose = s.annotations?.actualDoseWeight ?? ctx?.targetDoseWeight
        if (dose) { totalDose += dose; doseCount++ }
        const yld = s.annotations?.actualYield ?? ctx?.targetYield
        if (yld) { totalYield += yld; yieldCount++ }
      }

      const topCoffee = Object.entries(coffeeCounts).sort((a, b) => b[1] - a[1])[0]
      const topProfile = Object.entries(profileCounts).sort((a, b) => b[1] - a[1])[0]

      // Find a representative shot for the top coffee to get full context
      const representative = recent.find(s => s.workflow?.context?.coffeeName === topCoffee?.[0])
      const repCtx = representative?.workflow?.context

      suggestions = {
        coffee: topCoffee ? {
          name: topCoffee[0],
          count: topCoffee[1],
          origin: repCtx?.coffeeRoaster ?? '',
          roaster: repCtx?.coffeeRoaster ?? '',
        } : null,
        profile: topProfile ? {
          title: topProfile[0],
          count: topProfile[1],
        } : null,
        dose: doseCount > 0 ? Math.round((totalDose / doseCount) * 10) / 10 : null,
        yield: yieldCount > 0 ? Math.round((totalYield / yieldCount) * 10) / 10 : null,
        totalShots: recent.length,
      }
    } catch (e) {
      console.error('Failed to load suggestions:', e)
    } finally {
      suggestionsLoading = false
    }
  }

  async function nextStep(data) {
    await saveOnboarding({ ...data, currentStep: currentStep + 1 })
  }

  async function prevStep() {
    if (currentStep > 0) {
      await saveOnboarding({ currentStep: currentStep - 1 })
    }
  }

  async function complete(data) {
    await saveOnboarding({ ...data, completed: true })
    push('/dashboard')
  }
</script>

<div class="flex h-full">
  <!-- Left sidebar: step indicator (hidden on mobile) -->
  <aside class="hidden md:flex w-64 bg-surface-container-low p-6 flex-col shrink-0">
    <div class="mb-8">
      <h2 class="font-headline font-bold text-lg text-on-surface">Master Console</h2>
      <p class="font-label text-xs tracking-widest uppercase text-primary mt-1">Onboarding Phase</p>
    </div>
    <nav class="flex flex-col gap-1">
      {#each steps as step, i}
        <div
          class="flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors"
          class:text-primary={i === currentStep}
          class:border-r-2={i === currentStep}
          class:border-primary={i === currentStep}
          style:background-color={i === currentStep ? 'oklch(from var(--color-primary) l c h / 0.05)' : undefined}
          class:text-on-surface-variant={i !== currentStep}
          class:opacity-50={i > currentStep}
        >
          <span class="font-label text-xs tracking-widest">{step.num}</span>
          <span class="font-body text-sm">{step.label}</span>
        </div>
      {/each}
    </nav>
  </aside>

  <!-- Main content -->
  <div class="flex-1 overflow-y-auto p-8 lg:p-12">
    <div class="flex gap-2 mb-8">
      {#each steps as _, i}
        <div class="h-1 w-12 rounded-full transition-colors"
          class:bg-primary={i <= currentStep}
          class:bg-surface-container-highest={i > currentStep}
        ></div>
      {/each}
      <span class="font-label text-xs tracking-widest text-primary uppercase ml-2">
        Step {String(currentStep + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
      </span>
    </div>

    {#if currentStep === 0}
      <StepRoast data={$onboarding} {suggestions} onnext={nextStep} />
    {:else if currentStep === 1}
      <StepProfile data={$onboarding} {suggestions} onnext={nextStep} onprev={prevStep} />
    {:else if currentStep === 2}
      <StepTargets data={$onboarding} {suggestions} onnext={nextStep} onprev={prevStep} />
    {:else if currentStep === 3}
      <StepReview data={$onboarding} oncomplete={complete} onprev={prevStep} />
    {/if}
  </div>
</div>
