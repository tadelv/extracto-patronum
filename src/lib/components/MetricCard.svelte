<script>
  import { link } from 'svelte-spa-router'
  let { label = '', value = '', unit = '', href = '' } = $props()
</script>

{#if href}
  <a
    {href}
    use:link
    class="bg-surface-container-low px-4 py-3 rounded-xl ghost-border flex flex-col gap-1 hover:bg-surface-container transition-colors click-sink no-underline"
  >
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">{label}</span>
    <div class="flex items-baseline gap-1">
      <span class="font-label text-2xl font-bold text-on-surface">{value}</span>
      {#if unit}
        <span class="font-label text-xs text-outline">{unit}</span>
      {/if}
    </div>
  </a>
{:else}
  <div class="bg-surface-container-low px-4 py-3 rounded-xl ghost-border flex flex-col gap-1">
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">{label}</span>
    <div class="flex items-baseline gap-1">
      <span class="font-label text-2xl font-bold text-on-surface">{value}</span>
      {#if unit}
        <span class="font-label text-xs text-outline">{unit}</span>
      {/if}
    </div>
  </div>
{/if}
