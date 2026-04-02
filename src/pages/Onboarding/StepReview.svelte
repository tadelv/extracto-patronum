<script>
  import { api } from '../../lib/api/index.js'
  import { updateWorkflow } from '../../lib/stores/workflow.js'
  import GradientButton from '../../lib/components/GradientButton.svelte'

  let { state = {}, oncomplete = () => {}, onprev = () => {} } = $props()

  let baking = $state(false)
  let error = $state('')

  let coffee = $derived(state.roast?.bean ?? {})
  let roastLevel = $derived(state.roast?.level ?? 'unknown')
  let profile = $derived(state.profile ?? {})
  let dose = $derived(state.targets?.dose ?? 0)
  let yieldTarget = $derived(state.targets?.yield ?? 0)

  async function handleBake() {
    baking = true
    error = ''
    try {
      // 1. Create bean entity
      await api.post('/beans', {
        roaster: 'User',
        name: coffee.name || 'Unknown',
        country: coffee.origin || '',
        processing: coffee.processing || 'Washed',
      }).catch(e => {
        console.warn('Bean creation failed (may already exist):', e)
      })

      // 2. Update workflow with full context
      await updateWorkflow({
        coffee_name: coffee.name || '',
        coffee_origin: coffee.origin || '',
        coffee_roast: roastLevel,
        coffee_processing: coffee.processing || '',
        profile_id: profile.id || null,
        profile_title: profile.title || profile.name || '',
        dose,
        yield: yieldTarget,
      })

      // 3. Complete onboarding
      await oncomplete({})
    } catch (e) {
      console.error('Bake failed:', e)
      error = 'Something went wrong. Please try again.'
      baking = false
    }
  }
</script>

<div class="max-w-2xl">
  <h1 class="font-headline text-3xl font-bold text-on-surface mb-2">Review & Bake</h1>
  <p class="font-body text-on-surface-variant mb-8">
    Confirm your setup before we configure the machine.
  </p>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
    <!-- Coffee card -->
    <div class="glass-panel ghost-border rounded-lg p-5">
      <p class="font-label text-xs tracking-widest uppercase text-primary mb-3">Coffee</p>
      <p class="font-headline font-bold text-on-surface">{coffee.name || 'Not set'}</p>
      {#if coffee.origin}
        <p class="font-body text-sm text-on-surface-variant mt-1">{coffee.origin}</p>
      {/if}
      <div class="flex gap-3 mt-2">
        <span class="font-label text-xs text-on-surface-variant capitalize">{roastLevel}</span>
        {#if coffee.processing}
          <span class="font-label text-xs text-on-surface-variant">{coffee.processing}</span>
        {/if}
      </div>
    </div>

    <!-- Profile card -->
    <div class="glass-panel ghost-border rounded-lg p-5">
      <p class="font-label text-xs tracking-widest uppercase text-primary mb-3">Profile</p>
      <p class="font-headline font-bold text-on-surface">{profile.title ?? profile.name ?? 'Not set'}</p>
      {#if profile.author}
        <p class="font-body text-sm text-on-surface-variant mt-1">by {profile.author}</p>
      {/if}
    </div>

    <!-- Dose card -->
    <div class="glass-panel ghost-border rounded-lg p-5">
      <p class="font-label text-xs tracking-widest uppercase text-primary mb-3">Dose</p>
      <div class="flex items-baseline gap-1">
        <span class="font-headline text-3xl font-bold text-on-surface">{dose.toFixed(1)}</span>
        <span class="font-label text-sm text-on-surface-variant">g</span>
      </div>
    </div>

    <!-- Yield card -->
    <div class="glass-panel ghost-border rounded-lg p-5">
      <p class="font-label text-xs tracking-widest uppercase text-primary mb-3">Yield</p>
      <div class="flex items-baseline gap-1">
        <span class="font-headline text-3xl font-bold text-on-surface">{yieldTarget.toFixed(1)}</span>
        <span class="font-label text-sm text-on-surface-variant">g</span>
      </div>
    </div>
  </div>

  {#if error}
    <div class="glass-panel ghost-border rounded-lg p-4 mb-6 border-error/30">
      <p class="font-body text-sm text-error">{error}</p>
    </div>
  {/if}

  <div class="flex gap-4 max-w-md">
    <button
      class="px-6 py-4 font-label font-bold uppercase tracking-widest text-on-surface-variant
             border border-outline-variant rounded-sm transition-colors hover:text-on-surface
             hover:border-outline cursor-pointer"
      class:opacity-50={baking}
      disabled={baking}
      onclick={onprev}
    >
      Back
    </button>
    <div class="flex-1">
      {#if baking}
        <div class="w-full py-4 gradient-cta rounded-sm flex items-center justify-center gap-3">
          <div class="w-4 h-4 border-2 border-on-primary-fixed border-t-transparent rounded-full animate-spin"></div>
          <span class="font-label font-bold uppercase tracking-widest text-on-primary-fixed">Baking...</span>
        </div>
      {:else}
        <GradientButton label="Bake Profile" onclick={handleBake} />
      {/if}
    </div>
  </div>
</div>
