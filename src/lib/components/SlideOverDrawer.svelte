<script>
  let { open = $bindable(false), title = '', children } = $props()

  function handleKeydown(e) {
    if (e.key === 'Escape') open = false
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
{#if open}
  <div
    class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
    onclick={() => open = false}
    onkeydown={(e) => e.key === 'Enter' && (open = false)}
    role="button"
    tabindex="0"
    aria-label="Close drawer"
  ></div>
{/if}

<!-- Drawer -->
<div
  class="fixed top-0 right-0 h-full w-full max-w-md bg-surface-container-low z-50 transform transition-transform duration-300 ease-out border-l border-white/5 shadow-2xl flex flex-col"
  class:translate-x-0={open}
  class:translate-x-full={!open}
  role="dialog"
  aria-modal="true"
  aria-labelledby="drawer-title"
>
  <!-- Header -->
  <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
    <h2 id="drawer-title" class="font-headline text-lg font-bold tracking-wide text-on-surface">{title}</h2>
    <button
      class="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center tactile-sink hover:bg-surface-container-high transition-colors"
      onclick={() => open = false}
      aria-label="Close"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto p-6">
    {@render children()}
  </div>
</div>