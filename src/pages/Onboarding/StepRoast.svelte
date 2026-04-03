<script>
  import GradientButton from '../../lib/components/GradientButton.svelte'

  let { data = {}, suggestions = null, onnext = () => {} } = $props()

  const roastLevels = [
    { id: 'light', label: 'Light', temp: '180°C', height: 'h-12', color: 'bg-amber-300' },
    { id: 'medium', label: 'Medium', temp: '205°C', height: 'h-20', color: 'bg-amber-500' },
    { id: 'medium-dark', label: 'Med-Dark', temp: '215°C', height: 'h-28', color: 'bg-amber-700' },
    { id: 'dark', label: 'Dark', temp: '225°C', height: 'h-36', color: 'bg-amber-900' },
  ]

  const processingMethods = ['Washed', 'Natural', 'Honey', 'Anaerobic']

  const initRoast = data.roast
  const initBean = initRoast?.bean

  let selectedLevel = $state(initRoast?.level ?? '')
  let beanName = $state(initBean?.name ?? '')
  let beanOrigin = $state(initBean?.origin ?? '')
  let beanProcessing = $state(initBean?.processing ?? 'Washed')

  let hasSuggestion = $derived(suggestions?.coffee?.name && !beanName)
  let canContinue = $derived(selectedLevel !== '' && beanName.trim() !== '')

  function applySuggestion() {
    if (!suggestions?.coffee) return
    beanName = suggestions.coffee.name
    beanOrigin = suggestions.coffee.origin ?? ''
  }

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

  {#if hasSuggestion}
    <button
      class="w-full mb-6 p-4 rounded-xl bg-surface-container copper-glow text-left transition-colors hover:bg-surface-container-high click-sink"
      onclick={applySuggestion}
    >
      <span class="font-label text-xs tracking-widest uppercase text-primary">Suggested from recent shots</span>
      <div class="flex items-baseline gap-2 mt-1">
        <span class="font-headline font-bold text-lg text-on-surface">{suggestions.coffee.name}</span>
        {#if suggestions.coffee.count > 1}
          <span class="font-label text-xs text-on-surface-variant">{suggestions.coffee.count} shots in last 14 days</span>
        {/if}
      </div>
      <span class="font-label text-xs text-on-surface-variant mt-1">Tap to use</span>
    </button>
  {/if}

  <!-- Roast Spectrum Selector -->
  <div class="copper-glow ghost-border rounded-lg p-6 mb-8">
    <p class="font-label text-xs tracking-widest uppercase text-primary mb-6">Roast Spectrum</p>
    <div class="flex items-end gap-4 justify-center">
      {#each roastLevels as roast}
        <button
          class="flex flex-col items-center gap-2 px-4 py-3 rounded-md transition-all cursor-pointer"
          class:ring-2={selectedLevel === roast.id}
          class:ring-primary={selectedLevel === roast.id}
          style:background-color={selectedLevel === roast.id ? 'oklch(from var(--color-primary) l c h / 0.1)' : undefined}
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
        <label class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-2 block" for="bean-name">
          Bean Identifier
        </label>
        <input
          id="bean-name"
          type="text"
          bind:value={beanName}
          placeholder="e.g. Ethiopia Yirgacheffe"
          class="w-full bg-transparent border-b border-outline-variant font-headline text-lg text-on-surface
                 placeholder:text-outline focus:border-primary focus:outline-none pb-2 transition-colors"
        />
      </div>
      <div>
        <label class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-2 block" for="bean-origin">
          Geographic Origin
        </label>
        <input
          id="bean-origin"
          type="text"
          bind:value={beanOrigin}
          placeholder="e.g. Sidamo, Ethiopia"
          class="w-full bg-transparent border-b border-outline-variant font-headline text-lg text-on-surface
                 placeholder:text-outline focus:border-primary focus:outline-none pb-2 transition-colors"
        />
      </div>
      <div>
        <label class="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-2 block" for="bean-processing">
          Processing Method
        </label>
        <select
          id="bean-processing"
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
