<script>
  import { onMount } from 'svelte'
  import { api } from '../../lib/api/index.js'
  import GradientButton from '../../lib/components/GradientButton.svelte'

  let { data = {}, suggestions = null, onnext = () => {}, onprev = () => {} } = $props()

  const initProfileId = data.profile?.id ?? null

  let allProfiles = $state([])
  let loading = $state(true)
  let error = $state('')
  let selectedId = $state(initProfileId)
  let showAll = $state(false)

  // Roast level from step 1
  let roastLevel = $derived(data.roast?.level ?? '')

  // Keywords that hint at roast suitability
  const roastKeywords = {
    light: ['light', 'bloom', 'allonge', 'allongé', 'turbo', 'filter', 'adaptive', 'rao', 'gagné', 'gagne', 'best practice (light'],
    medium: ['medium', 'classic', 'traditional', 'italian', 'default', 'baseline', 'best practice', 'adaptive'],
    'medium-dark': ['medium', 'dark', 'lever', 'cremina', 'londonium', 'leva', 'milky', 'traditional'],
    dark: ['dark', 'very-dark', 'milky', '80s', 'lever', 'cremina', 'italian', 'ristretto'],
  }

  // Filter profiles: espresso only, exclude cleaning/tea/pourover
  let espressoProfiles = $derived(
    allProfiles.filter(p => {
      const type = (p.profile?.beverage_type ?? '').toLowerCase()
      return type === 'espresso'
    })
  )

  // Score and sort profiles by roast relevance
  let rankedProfiles = $derived.by(() => {
    if (!roastLevel || !espressoProfiles.length) return espressoProfiles

    const keywords = roastKeywords[roastLevel] ?? []

    return [...espressoProfiles].map(p => {
      const title = (p.profile?.title ?? '').toLowerCase()
      const notes = (p.profile?.notes ?? '').toLowerCase()
      const text = title + ' ' + notes
      let score = 0

      for (const kw of keywords) {
        if (text.includes(kw)) score += 2
        if (title.includes(kw)) score += 3 // title match weighted higher
      }

      // Boost profiles with explicit roast level in title
      if (roastLevel === 'dark' && (title.includes('dark') || title.includes('very-dark'))) score += 5
      if (roastLevel === 'light' && title.includes('light')) score += 5
      if (roastLevel === 'medium' && title.includes('medium') && !title.includes('dark')) score += 5

      return { ...p, _score: score }
    }).sort((a, b) => b._score - a._score)
  })

  // Show recommended (score > 0) vs all espresso
  let recommendedProfiles = $derived(rankedProfiles.filter(p => p._score > 0))
  let displayProfiles = $derived(showAll ? rankedProfiles : (recommendedProfiles.length > 0 ? recommendedProfiles : rankedProfiles))

  let selectedProfile = $derived(allProfiles.find(p => p.id === selectedId) ?? null)
  let canContinue = $derived(selectedProfile !== null)

  onMount(async () => {
    try {
      const res = await api.get('/profiles')
      allProfiles = Array.isArray(res) ? res : (res?.profiles ?? [])

      // Auto-select suggested profile if no prior selection
      if (!selectedId && suggestions?.profile?.title) {
        const match = allProfiles.find(p =>
          (p.profile?.title ?? p.title) === suggestions.profile.title
        )
        if (match) selectedId = match.id
      }
    } catch (e) {
      error = 'Failed to load profiles. Check your connection to the machine.'
      console.error('Failed to fetch profiles:', e)
    } finally {
      loading = false
    }
  })

  function handleContinue() {
    if (!canContinue) return
    onnext({ profile: selectedProfile })
  }

  function roastLabel(p) {
    const title = (p.profile?.title ?? '').toLowerCase()
    const notes = (p.profile?.notes ?? '').toLowerCase()
    if (title.includes('light') || notes.includes('light roast')) return 'Light'
    if (title.includes('very-dark') || title.includes('very dark')) return 'Very Dark'
    if (title.includes('dark')) return 'Dark'
    if (title.includes('medium')) return 'Medium'
    if (notes.includes('dark roast') || notes.includes('darker roast')) return 'Dark'
    if (notes.includes('light roast') || notes.includes('lightly roasted')) return 'Light'
    if (notes.includes('medium roast')) return 'Medium'
    return null
  }
</script>

<div class="max-w-3xl">
  <h1 class="font-headline text-3xl font-bold text-on-surface mb-2">Choose a Shot Profile</h1>
  <p class="font-body text-on-surface-variant mb-4">
    {#if roastLevel}
      Showing profiles suited for <span class="text-primary font-bold">{roastLevel}</span> roasts.
    {:else}
      Select a pressure/flow profile for your espresso extraction.
    {/if}
  </p>

  {#if loading}
    <div class="flex items-center justify-center py-16">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p class="font-label text-xs tracking-widest uppercase text-on-surface-variant">Loading profiles...</p>
      </div>
    </div>
  {:else if error}
    <div class="glass-panel ghost-border rounded-lg p-6 text-center">
      <p class="text-error font-body">{error}</p>
    </div>
  {:else if espressoProfiles.length === 0}
    <div class="mt-10 p-8 rounded-xl bg-surface-container-low text-center">
      <p class="text-on-surface-variant font-body mb-4">No espresso profiles found on the machine.</p>
      <button
        class="px-6 py-4 font-label font-bold uppercase tracking-widest text-on-surface-variant
               border border-outline-variant rounded-sm transition-colors hover:text-on-surface
               hover:border-outline cursor-pointer"
        onclick={() => onnext({ profile: null })}
      >
        Skip — Continue Without Profile
      </button>
    </div>
  {:else}
    {#if suggestions?.profile?.title && selectedId}
      <div class="mb-4 px-4 py-3 rounded-lg bg-surface-container">
        <span class="font-label text-xs tracking-widest uppercase text-primary">Most used recently:</span>
        <span class="font-body text-sm text-on-surface ml-2">{suggestions.profile.title}</span>
        <span class="font-label text-xs text-on-surface-variant ml-1">({suggestions.profile.count} shots)</span>
      </div>
    {/if}

    {#if recommendedProfiles.length > 0 && !showAll}
      <div class="flex items-center justify-between mb-4">
        <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">
          {recommendedProfiles.length} recommended for {roastLevel}
        </span>
        <button
          class="font-label text-xs tracking-widest uppercase text-primary hover:underline"
          onclick={() => showAll = true}
        >Show all ({espressoProfiles.length})</button>
      </div>
    {:else if showAll}
      <div class="flex items-center justify-between mb-4">
        <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">
          All espresso profiles ({espressoProfiles.length})
        </span>
        {#if recommendedProfiles.length > 0}
          <button
            class="font-label text-xs tracking-widest uppercase text-primary hover:underline"
            onclick={() => showAll = false}
          >Show recommended only</button>
        {/if}
      </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-96 overflow-y-auto pr-1">
      {#each displayProfiles as profile}
        {@const rl = roastLabel(profile)}
        <button
          class="text-left glass-panel ghost-border rounded-lg p-5 transition-all cursor-pointer"
          class:ambient-glow-active={selectedId === profile.id}
          class:ring-1={selectedId === profile.id}
          class:ring-primary={selectedId === profile.id}
          onclick={() => selectedId = profile.id}
        >
          <h3 class="font-headline font-bold text-on-surface mb-1 truncate">
            {profile.profile?.title ?? 'Untitled'}
          </h3>
          <div class="flex items-center gap-2 mb-2">
            {#if profile.profile?.author}
              <span class="font-label text-xs text-on-surface-variant">by {profile.profile.author}</span>
            {/if}
            {#if rl}
              <span class="font-label text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm bg-surface-container-highest text-primary">{rl}</span>
            {/if}
          </div>
          {#if profile.profile?.notes}
            <p class="font-body text-xs text-on-surface-variant line-clamp-3">{profile.profile.notes}</p>
          {/if}
        </button>
      {/each}
    </div>
  {/if}

  <div class="flex gap-4 max-w-md">
    <button
      class="px-6 py-4 font-label font-bold uppercase tracking-widest text-on-surface-variant
             border border-outline-variant rounded-sm transition-colors hover:text-on-surface
             hover:border-outline cursor-pointer"
      onclick={onprev}
    >
      Back
    </button>
    <button
      class="px-4 py-4 font-label text-xs tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
      onclick={() => onnext({ profile: null })}
    >
      Skip
    </button>
    <div class="flex-1">
      <GradientButton label="Continue" disabled={!canContinue} onclick={handleContinue} />
    </div>
  </div>
</div>
