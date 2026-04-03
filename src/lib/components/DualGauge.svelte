<script>
  let { pressure = 0, maxPressure = 12, flow = 0, maxFlow = 8, size = 280 } = $props()

  const outerStroke = 8
  const innerStroke = 6
  const gap = 14

  let outerRadius = $derived((size - outerStroke) / 2)
  let innerRadius = $derived(outerRadius - gap - innerStroke / 2)
  let outerCirc = $derived(2 * Math.PI * outerRadius)
  let innerCirc = $derived(2 * Math.PI * innerRadius)
  let outerOffset = $derived(outerCirc - (Math.min(pressure / maxPressure, 1) * outerCirc))
  let innerOffset = $derived(innerCirc - (Math.min(flow / maxFlow, 1) * innerCirc))

  let pressureGlow = $derived(Math.min(pressure / maxPressure, 1) * 0.4)
  let flowGlow = $derived(Math.min(flow / maxFlow, 1) * 0.3)
</script>

<div class="relative inline-flex items-center justify-center" style="width: {size}px; height: {size}px;">
  <svg width={size} height={size} class="transform -rotate-90">
    <!-- Outer ring track (pressure) -->
    <circle
      cx={size / 2} cy={size / 2} r={outerRadius}
      fill="none"
      stroke="var(--color-surface-container-highest)"
      stroke-width={outerStroke}
    />
    <!-- Outer ring value (pressure) -->
    <circle
      cx={size / 2} cy={size / 2} r={outerRadius}
      fill="none"
      stroke="var(--color-primary)"
      stroke-width={outerStroke}
      stroke-linecap="round"
      stroke-dasharray={outerCirc}
      stroke-dashoffset={outerOffset}
      class="transition-[stroke-dashoffset] duration-200"
      style="filter: drop-shadow(0 0 10px oklch(from var(--color-primary) l c h / {pressureGlow}));"
    />
    <!-- Inner ring track (flow) -->
    <circle
      cx={size / 2} cy={size / 2} r={innerRadius}
      fill="none"
      stroke="var(--color-surface-container-highest)"
      stroke-width={innerStroke}
    />
    <!-- Inner ring value (flow) -->
    <circle
      cx={size / 2} cy={size / 2} r={innerRadius}
      fill="none"
      stroke="var(--color-secondary)"
      stroke-width={innerStroke}
      stroke-linecap="round"
      stroke-dasharray={innerCirc}
      stroke-dashoffset={innerOffset}
      class="transition-[stroke-dashoffset] duration-200"
      style="filter: drop-shadow(0 0 8px oklch(from var(--color-secondary) l c h / {flowGlow}));"
    />
  </svg>

  <!-- Center labels -->
  <div class="absolute flex flex-col items-center gap-1">
    <div class="flex flex-col items-center">
      <span class="font-label text-3xl font-bold text-primary">{pressure.toFixed(1)}</span>
      <span class="font-label text-[10px] tracking-widest uppercase text-on-surface-variant">BAR</span>
    </div>
    <div class="w-8 h-px bg-surface-container-highest"></div>
    <div class="flex flex-col items-center">
      <span class="font-label text-xl font-bold text-secondary">{flow.toFixed(1)}</span>
      <span class="font-label text-[10px] tracking-widest uppercase text-on-surface-variant">ML/S</span>
    </div>
  </div>
</div>
