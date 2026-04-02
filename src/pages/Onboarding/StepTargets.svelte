<script>
  import GradientButton from '../../lib/components/GradientButton.svelte'

  let { data = {}, onnext = () => {}, onprev = () => {} } = $props()

  const initTargets = data.targets

  let dose = $state(initTargets?.dose ?? 18.5)
  let yieldTarget = $state(initTargets?.yield ?? 37.0)

  let ratio = $derived(dose > 0 ? (yieldTarget / dose) : 0)
  let ratioDisplay = $derived(ratio.toFixed(1))
  let ratioLabel = $derived.by(() => {
    if (ratio < 1.7) return 'Ristretto'
    if (ratio > 2.5) return 'Lungo'
    return 'Standard Normale'
  })

  let tip = $derived.by(() => {
    if (ratio < 1.7) return 'A ristretto ratio produces a concentrated, intense shot with syrupy body. Best for darker roasts.'
    if (ratio > 2.5) return 'A lungo ratio yields a lighter, more diluted extraction. Can highlight delicate floral notes in light roasts.'
    return 'A standard ratio around 1:2 is the classic espresso benchmark. A great starting point for most beans.'
  })

  function adjustDose(delta) {
    dose = Math.round(Math.min(30, Math.max(10, dose + delta)) * 10) / 10
  }

  function adjustYield(delta) {
    yieldTarget = Math.round(Math.min(80, Math.max(15, yieldTarget + delta)) * 10) / 10
  }

  function handleContinue() {
    onnext({ targets: { dose, yield: yieldTarget } })
  }
</script>

<div class="max-w-2xl">
  <h1 class="font-headline text-3xl font-bold text-on-surface mb-2">Extraction Targets</h1>
  <p class="font-body text-on-surface-variant mb-8">
    Set your dose and yield to define the brewing ratio.
  </p>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <!-- Dose -->
    <div class="glass-panel ghost-border rounded-lg p-6">
      <p class="font-label text-xs tracking-widest uppercase text-primary mb-4">Dose In</p>
      <div class="flex items-center justify-center gap-4">
        <button
          class="w-10 h-10 rounded-full border border-outline-variant text-on-surface-variant
                 font-headline text-xl flex items-center justify-center transition-colors
                 hover:border-primary hover:text-primary cursor-pointer"
          onclick={() => adjustDose(-0.5)}
        >
          &minus;
        </button>
        <div class="text-center">
          <span class="font-headline text-5xl font-bold text-on-surface">{dose.toFixed(1)}</span>
          <span class="font-label text-sm text-on-surface-variant ml-1">g</span>
        </div>
        <button
          class="w-10 h-10 rounded-full border border-outline-variant text-on-surface-variant
                 font-headline text-xl flex items-center justify-center transition-colors
                 hover:border-primary hover:text-primary cursor-pointer"
          onclick={() => adjustDose(0.5)}
        >
          +
        </button>
      </div>
    </div>

    <!-- Yield -->
    <div class="glass-panel ghost-border rounded-lg p-6">
      <p class="font-label text-xs tracking-widest uppercase text-primary mb-4">Yield Out</p>
      <div class="flex items-center justify-center gap-4">
        <button
          class="w-10 h-10 rounded-full border border-outline-variant text-on-surface-variant
                 font-headline text-xl flex items-center justify-center transition-colors
                 hover:border-primary hover:text-primary cursor-pointer"
          onclick={() => adjustYield(-0.5)}
        >
          &minus;
        </button>
        <div class="text-center">
          <span class="font-headline text-5xl font-bold text-on-surface">{yieldTarget.toFixed(1)}</span>
          <span class="font-label text-sm text-on-surface-variant ml-1">g</span>
        </div>
        <button
          class="w-10 h-10 rounded-full border border-outline-variant text-on-surface-variant
                 font-headline text-xl flex items-center justify-center transition-colors
                 hover:border-primary hover:text-primary cursor-pointer"
          onclick={() => adjustYield(0.5)}
        >
          +
        </button>
      </div>
    </div>
  </div>

  <!-- Ratio Display -->
  <div class="copper-glow ghost-border rounded-lg p-6 mb-8 text-center">
    <p class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-2">Brewing Ratio</p>
    <div class="flex items-baseline justify-center gap-2">
      <span class="font-headline text-4xl font-bold text-primary">1:{ratioDisplay}</span>
      <span class="font-label text-sm tracking-widest uppercase text-on-surface-variant">{ratioLabel}</span>
    </div>
  </div>

  <!-- Patronum Tip -->
  <div class="glass-panel ghost-border rounded-lg p-5 mb-8 flex gap-3">
    <span class="text-primary text-lg shrink-0">&#9733;</span>
    <div>
      <p class="font-label text-xs tracking-widest uppercase text-primary mb-1">Patronum Tip</p>
      <p class="font-body text-sm text-on-surface-variant">{tip}</p>
    </div>
  </div>

  <div class="flex gap-4 max-w-md">
    <button
      class="px-6 py-4 font-label font-bold uppercase tracking-widest text-on-surface-variant
             border border-outline-variant rounded-sm transition-colors hover:text-on-surface
             hover:border-outline cursor-pointer"
      onclick={onprev}
    >
      Back
    </button>
    <div class="flex-1">
      <GradientButton label="Finalize" onclick={handleContinue} />
    </div>
  </div>
</div>
