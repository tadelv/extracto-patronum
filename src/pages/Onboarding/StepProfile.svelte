<script>
  import { onMount } from 'svelte'
  import { api } from '../../lib/api/index.js'
  import GradientButton from '../../lib/components/GradientButton.svelte'

  let { data = {}, suggestions = null, onnext = () => {}, onprev = () => {} } = $props()

  const initProfileId = data.profile?.id ?? null

  let profiles = $state([])
  let loading = $state(true)
  let error = $state('')
  let selectedId = $state(initProfileId)

  let selectedProfile = $derived(profiles.find(p => p.id === selectedId) ?? null)
  let canContinue = $derived(selectedProfile !== null)

  onMount(async () => {
    try {
      const res = await api.get('/profiles')
      profiles = Array.isArray(res) ? res : (res?.profiles ?? [])

      // Auto-select suggested profile if no prior selection
      if (!selectedId && suggestions?.profile?.title) {
        const match = profiles.find(p =>
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
</script>

<div class="max-w-3xl">
  <h1 class="font-headline text-3xl font-bold text-on-surface mb-2">Choose a Shot Profile</h1>
  <p class="font-body text-on-surface-variant mb-8">
    Select a pressure/flow profile for your espresso extraction.
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
  {:else if profiles.length === 0}
    <div class="mt-10 p-8 rounded-xl bg-surface-container-low text-center">
      <p class="text-on-surface-variant font-body mb-4">No profiles found on the machine.</p>
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
        <span class="font-label text-xs tracking-widest uppercase text-primary">Suggested:</span>
        <span class="font-body text-sm text-on-surface ml-2">{suggestions.profile.title}</span>
        <span class="font-label text-xs text-on-surface-variant ml-1">({suggestions.profile.count} recent shots)</span>
      </div>
    {/if}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {#each profiles as profile}
        <button
          class="text-left glass-panel ghost-border rounded-lg p-5 transition-all cursor-pointer"
          class:ambient-glow-active={selectedId === profile.id}
          class:ring-1={selectedId === profile.id}
          class:ring-primary={selectedId === profile.id}
          onclick={() => selectedId = profile.id}
        >
          <h3 class="font-headline font-bold text-on-surface mb-1 truncate">
            {profile.profile?.title ?? profile.title ?? 'Untitled'}
          </h3>
          {#if profile.profile?.author ?? profile.author}
            <p class="font-label text-xs text-on-surface-variant mb-2">by {profile.profile?.author ?? profile.author}</p>
          {/if}
          {#if profile.profile?.notes ?? profile.notes}
            <p class="font-body text-xs text-on-surface-variant line-clamp-2">{profile.profile?.notes ?? profile.notes}</p>
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
