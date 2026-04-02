<script>
  let { label = '', value = '', unit = '', icon = '' } = $props()
</script>

<div class="bg-surface-container-low px-4 py-3 rounded-xl ghost-border flex flex-col gap-1">
  <div class="flex items-center gap-2">
    {#if icon}
      <span class="text-primary text-sm">{icon}</span>
    {/if}
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">{label}</span>
  </div>
  <div class="flex items-baseline gap-1">
    <span class="font-label text-2xl font-bold text-on-surface">{value}</span>
    {#if unit}
      <span class="font-label text-xs text-outline">{unit}</span>
    {/if}
  </div>
</div>
