<script>
  import { push } from 'svelte-spa-router'
  import { onboarding, saveOnboarding } from '../../lib/stores/onboarding.js'
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

  let currentStep = $derived($onboarding.currentStep ?? 0)

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
  <!-- Left sidebar: step indicator -->
  <aside class="w-64 bg-surface-container-low p-6 flex flex-col shrink-0">
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
      <StepRoast state={$onboarding} onnext={nextStep} />
    {:else if currentStep === 1}
      <StepProfile state={$onboarding} onnext={nextStep} onprev={prevStep} />
    {:else if currentStep === 2}
      <StepTargets state={$onboarding} onnext={nextStep} onprev={prevStep} />
    {:else if currentStep === 3}
      <StepReview state={$onboarding} oncomplete={complete} onprev={prevStep} />
    {/if}
  </div>
</div>
