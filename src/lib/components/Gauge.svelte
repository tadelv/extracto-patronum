<script>
  let { value = 0, max = 12, label = '', unit = '', size = 200, color = 'var(--color-primary)' } = $props()

  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let dashOffset = $derived(circumference - (Math.min(value / max, 1) * circumference))
</script>

<div class="relative inline-flex items-center justify-center" style="width: {size}px; height: {size}px;">
  <svg width={size} height={size} class="transform -rotate-90">
    <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
      stroke="var(--color-surface-container-highest)" stroke-width={strokeWidth} />
    <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
      stroke={color} stroke-width={strokeWidth} stroke-linecap="round"
      stroke-dasharray={circumference} stroke-dashoffset={dashOffset}
      class="transition-[stroke-dashoffset] duration-200"
      style="filter: drop-shadow(0 0 8px {color}40);" />
  </svg>
  <div class="absolute flex flex-col items-center">
    <span class="font-label text-3xl font-bold" style="color: {color};">{value.toFixed(1)}</span>
    <span class="font-label text-xs tracking-widest uppercase text-on-surface-variant">{unit}</span>
    {#if label}
      <span class="font-body text-xs text-outline mt-1">{label}</span>
    {/if}
  </div>
</div>
