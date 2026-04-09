<script>
  import { machineState } from '../stores/machine.js'
  import { api } from '../api/index.js'

  let ms = $derived($machineState)
  let loading = $state(false)

  let stateCategory = $derived(() => {
    const s = ms.state
    if (!s || s === 'disconnected') return 'disconnected'
    if (s === 'sleeping') return 'sleeping'
    if (s === 'heating' || s === 'preheating') return 'heating'
    if (s === 'idle') return 'idle'
    return 'active'
  })

  let displayLabel = $derived(() => {
    const s = ms.state
    if (!s || s === 'disconnected') return 'Disconnected'
    if (s === 'sleeping') return 'Sleeping'
    if (s === 'heating' || s === 'preheating') return 'Heating'
    if (s === 'idle') return 'Idle'
    if (s === 'espresso') return 'Espresso'
    if (s === 'steam') return 'Steam'
    if (s === 'steamRinse') return 'Rinse'
    if (s === 'flush') return 'Flush'
    return s.charAt(0).toUpperCase() + s.slice(1)
  })

  let dotColor = $derived(() => {
    const cat = stateCategory()
    if (cat === 'idle' || cat === 'active') return 'bg-status-connected'
    if (cat === 'heating') return 'bg-primary animate-pulse'
    return 'bg-outline'
  })

  async function sleep() {
    loading = true
    try {
      await api.put('/machine/state/sleeping')
    } catch (e) {
      console.error('Failed to sleep machine:', e)
    } finally {
      loading = false
    }
  }

  async function wake() {
    loading = true
    try {
      await api.put('/machine/state/idle')
    } catch (e) {
      console.error('Failed to wake machine:', e)
    } finally {
      loading = false
    }
  }
</script>

<div class="glass-panel rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
  <!-- Left: status dot + label -->
  <div class="flex items-center gap-3">
    <div class="w-2.5 h-2.5 rounded-full {dotColor()}"></div>
    <span class="font-label text-sm tracking-wider uppercase"
      class:text-on-surface={stateCategory() === 'idle' || stateCategory() === 'active' || stateCategory() === 'heating'}
      class:text-on-surface-variant={stateCategory() === 'sleeping'}
      class:text-outline={stateCategory() === 'disconnected'}
    >{displayLabel()}</span>
  </div>

  <!-- Right: action button -->
  <div class="flex items-center">
    {#if stateCategory() === 'sleeping'}
      <button
        class="px-5 py-2 gradient-cta text-on-primary-fixed font-label text-xs font-bold uppercase tracking-widest rounded-sm tactile-sink transition-opacity"
        class:opacity-50={loading}
        disabled={loading}
        onclick={wake}
      >Wake</button>
    {:else if stateCategory() === 'idle'}
      <button
        class="px-5 py-2 rounded-sm ghost-border font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors tactile-sink"
        class:opacity-50={loading}
        disabled={loading}
        onclick={sleep}
      >Sleep</button>
    {/if}
  </div>
</div>
