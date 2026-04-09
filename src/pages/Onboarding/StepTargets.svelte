<script>
  import GradientButton from '../../lib/components/GradientButton.svelte'

  let { data = {}, suggestions = null, onnext = () => {}, onprev = () => {} } = $props()

  const initTargets = data.targets
  const roastLevel = data.roast?.level ?? ''

  // Roast-aware defaults
  const roastDefaults = {
    light:        { dose: 18, yield: 45, ratio: '1:2.5', note: 'Light roasts benefit from higher ratios to develop sweetness and clarity. A longer shot extracts more of the delicate flavors.' },
    medium:       { dose: 18, yield: 36, ratio: '1:2',   note: 'The classic 1:2 ratio is the standard starting point for medium roasts. Balanced body and sweetness.' },
    'medium-dark': { dose: 18, yield: 36, ratio: '1:2',  note: 'Medium-dark roasts work well at 1:2 or slightly shorter. Reduce yield if the shot tastes hollow or ashy.' },
    dark:         { dose: 18, yield: 27, ratio: '1:1.5', note: 'Dark roasts extract quickly. A shorter ratio preserves body and avoids bitterness. Consider a ristretto-style pull.' },
  }

  const defaults = roastDefaults[roastLevel] ?? roastDefaults.medium
  const hasShotHistory = suggestions?.dose != null

  // Round suggestions to nearest 0.5
  function roundHalf(n) { return Math.round(n * 2) / 2 }

  let dose = $state(initTargets?.dose ?? (hasShotHistory ? roundHalf(suggestions.dose) : defaults.dose))
  let yieldTarget = $state(initTargets?.yield ?? (hasShotHistory ? roundHalf(suggestions.yield) : defaults.yield))

  let ratio = $derived(dose > 0 ? (yieldTarget / dose) : 0)
  let ratioDisplay = $derived(ratio.toFixed(1))
  let ratioLabel = $derived.by(() => {
    if (ratio < 1.7) return 'Ristretto'
    if (ratio > 2.5) return 'Lungo'
    return 'Normale'
  })

  let tip = $derived.by(() => {
    if (hasShotHistory) {
      return `Based on your last ${suggestions.totalShots} shots. ${defaults.note}`
    }
    return defaults.note
  })

  function adjustDose(delta) {
    dose = Math.min(30, Math.max(10, roundHalf(dose + delta)))
  }

  function adjustYield(delta) {
    yieldTarget = Math.min(80, Math.max(15, roundHalf(yieldTarget + delta)))
  }

  function clampDose() {
    dose = Math.min(30, Math.max(10, roundHalf(dose || defaults.dose)))
  }

  function clampYield() {
    yieldTarget = Math.min(80, Math.max(15, roundHalf(yieldTarget || defaults.yield)))
  }

  function handleContinue() {
    onnext({ targets: { dose, yield: yieldTarget } })
  }
</script>

<div class="max-w-2xl">
  <h1 class="font-headline text-3xl font-bold text-on-surface mb-2">Extraction Targets</h1>
  <p class="font-body text-on-surface-variant mb-8">
    {#if roastLevel}
      Targets for <span class="text-primary font-bold">{roastLevel}</span> roast.
      {#if hasShotHistory}
        Pre-filled from your recent averages.
      {:else}
        Using recommended defaults for this roast level.
      {/if}
    {:else}
      Set your dose and yield to define the brewing ratio.
    {/if}
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
          aria-label="Decrease dose"
        >
          &minus;
        </button>
        <div class="text-center flex items-baseline">
          <input
            type="number"
            bind:value={dose}
            onfocusout={clampDose}
            step="0.5"
            min="10"
            max="30"
            aria-label="Dose weight in grams"
            class="w-24 bg-transparent font-headline text-5xl font-bold text-on-surface text-center outline-none border-b border-transparent focus:border-primary transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span class="font-label text-sm text-on-surface-variant ml-1">g</span>
        </div>
        <button
          class="w-10 h-10 rounded-full border border-outline-variant text-on-surface-variant
                 font-headline text-xl flex items-center justify-center transition-colors
                 hover:border-primary hover:text-primary cursor-pointer"
          onclick={() => adjustDose(0.5)}
          aria-label="Increase dose"
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
          aria-label="Decrease yield"
        >
          &minus;
        </button>
        <div class="text-center flex items-baseline">
          <input
            type="number"
            bind:value={yieldTarget}
            onfocusout={clampYield}
            step="0.5"
            min="15"
            max="80"
            aria-label="Yield weight in grams"
            class="w-24 bg-transparent font-headline text-5xl font-bold text-on-surface text-center outline-none border-b border-transparent focus:border-primary transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span class="font-label text-sm text-on-surface-variant ml-1">g</span>
        </div>
        <button
          class="w-10 h-10 rounded-full border border-outline-variant text-on-surface-variant
                 font-headline text-xl flex items-center justify-center transition-colors
                 hover:border-primary hover:text-primary cursor-pointer"
          onclick={() => adjustYield(0.5)}
          aria-label="Increase yield"
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

  <!-- Tip -->
  <div class="glass-panel ghost-border rounded-lg p-5 mb-8">
    <p class="font-label text-xs tracking-widest uppercase text-primary mb-1">Patronum Tip</p>
    <p class="font-body text-sm text-on-surface-variant">{tip}</p>
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
