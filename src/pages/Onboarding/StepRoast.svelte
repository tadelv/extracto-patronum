<script>
  import GradientButton from '../../lib/components/GradientButton.svelte'

  let { state = {}, onnext = () => {} } = $props()

  const roastLevels = [
    { id: 'light', label: 'Light', temp: '180°C', height: 'h-12', color: 'bg-amber-300' },
    { id: 'medium', label: 'Medium', temp: '205°C', height: 'h-20', color: 'bg-amber-500' },
    { id: 'medium-dark', label: 'Med-Dark', temp: '215°C', height: 'h-28', color: 'bg-amber-700' },
    { id: 'dark', label: 'Dark', temp: '225°C', height: 'h-36', color: 'bg-amber-900' },
  ]

  const processingMethods = ['Washed', 'Natural', 'Honey', 'Anaerobic']

  let selectedLevel = $state(state.roast?.level ?? '')
  let beanName = $state(state.roast?.bean?.name ?? '')
  let beanOrigin = $state(state.roast?.bean?.origin ?? '')
  let beanProcessing = $state(state.roast?.bean?.processing ?? 'Washed')

  let canContinue = $derived(selectedLevel !== '' && beanName.trim() !== '')

  function handleContinue() {
    if (!canContinue) return
    onnext({
      roast: {
        level: selectedLevel,
        bean: {
          name: beanName.trim(),
          origin: beanOrigin.trim(),
          processing: beanProcessing,
        },
      },
    })
  }
</script>

<div class="max-w-2xl">
  <h1 class="font-headline text-3xl font-bold text-on-surface mb-2">Select Your Roast</h1>
  <p class="font-body text-on-surface-variant mb-8">
    Choose the roast level for your beans. This helps calibrate extraction parameters.
  </p>

  <!-- Roast Spectrum Selector -->
  <div class="copper-glow ghost-border rounded-lg p-6 mb-8">
    <p class="font-label text-xs tracking-widest uppercase text-primary mb-6">Roast Spectrum</p>
    <div class="flex items-end gap-4 justify-center">
      {#each roastLevels as roast}
        <button
          class="flex flex-col items-center gap-2 px-4 py-3 rounded-md transition-all cursor-pointer"
          class:ring-2={selectedLevel === roast.id}
          class:ring-primary={selectedLevel === roast.id}
          class:bg-primary/10={selectedLevel === roast.id}
          onclick={() => selectedLevel = roast.id}
        >
          <div class="w-10 {roast.height} {roast.color} rounded-sm transition-all"
            class:opacity-100={selectedLevel === roast.id}
            class:opacity-50={selectedLevel !== roast.id}
          ></div>
          <span class="font-label text-xs font-bold tracking-wide text-on-surface">{roast.label}</span>
          <span class="font-label text-[10px] text-on-surface-variant">{roast.temp}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Bean Metadata -->
  <div class="glass-panel ghost-border rounded-lg p-6 mb-8">
    <p class="font-label text-xs tracking-widest uppercase text-primary mb-6">Bean Metadata</p>
    <div class="flex flex-col gap-5">
      <div>
        <label class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-2 block">
          Bean Identifier
        </label>
        <input
          type="text"
          bind:value={beanName}
          placeholder="e.g. Ethiopia Yirgacheffe"
          class="w-full bg-transparent border-b border-outline-variant font-headline text-lg text-on-surface
                 placeholder:text-outline focus:border-primary focus:outline-none pb-2 transition-colors"
        />
      </div>
      <div>
        <label class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-2 block">
          Geographic Origin
        </label>
        <input
          type="text"
          bind:value={beanOrigin}
          placeholder="e.g. Sidamo, Ethiopia"
          class="w-full bg-transparent border-b border-outline-variant font-headline text-lg text-on-surface
                 placeholder:text-outline focus:border-primary focus:outline-none pb-2 transition-colors"
        />
      </div>
      <div>
        <label class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-2 block">
          Processing Method
        </label>
        <select
          bind:value={beanProcessing}
          class="w-full bg-transparent border-b border-outline-variant font-headline text-lg text-on-surface
                 focus:border-primary focus:outline-none pb-2 transition-colors appearance-none cursor-pointer"
        >
          {#each processingMethods as method}
            <option value={method} class="bg-surface-container text-on-surface">{method}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <div class="max-w-xs">
    <GradientButton label="Continue" disabled={!canContinue} onclick={handleContinue} />
  </div>
</div>
