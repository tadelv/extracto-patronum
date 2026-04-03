<script>
  let { pressure = 0, maxPressure = 12, flow = 0, maxFlow = 8, size = 280 } = $props()

  // Stitch design: outer=thick pressure ring, inner=thin flow ring
  const outerStroke = 18
  const innerStroke = 4
  const ringGap = 20

  let cx = $derived(size / 2)
  let outerRadius = $derived((size - outerStroke) / 2)
  let innerRadius = $derived(outerRadius - ringGap)
  let outerCirc = $derived(2 * Math.PI * outerRadius)
  let innerCirc = $derived(2 * Math.PI * innerRadius)
  let outerOffset = $derived(outerCirc - (Math.min(pressure / maxPressure, 1) * outerCirc))
  let innerOffset = $derived(innerCirc - (Math.min(flow / maxFlow, 1) * innerCirc))
</script>

<div class="relative inline-flex items-center justify-center" style="width: {size}px; height: {size}px;">
  <svg width={size} height={size} class="transform -rotate-90 overflow-visible">
    <!-- Outer track (pressure) -->
    <circle
      cx={cx} cy={cx} r={outerRadius}
      fill="none"
      stroke="var(--color-surface-container-highest)"
      stroke-width={outerStroke}
    />
    <!-- Outer value (pressure) — thick, primary amber -->
    <circle
      cx={cx} cy={cx} r={outerRadius}
      fill="none"
      stroke="var(--color-primary)"
      stroke-width={outerStroke}
      stroke-linecap="round"
      stroke-dasharray={outerCirc}
      stroke-dashoffset={outerOffset}
      class="transition-[stroke-dashoffset] duration-150"
      style="filter: drop-shadow(0 0 12px rgba(255,183,125,0.4));"
    />
    <!-- Inner track (flow) -->
    <circle
      cx={cx} cy={cx} r={innerRadius}
      fill="none"
      stroke="rgba(255,251,235,0.15)"
      stroke-width={innerStroke}
    />
    <!-- Inner value (flow) — thin, light cream-gold -->
    <circle
      cx={cx} cy={cx} r={innerRadius}
      fill="none"
      stroke="#fef3c7"
      stroke-width={innerStroke}
      stroke-linecap="round"
      stroke-dasharray={innerCirc}
      stroke-dashoffset={innerOffset}
      class="transition-[stroke-dashoffset] duration-150"
      style="filter: drop-shadow(0 0 8px rgba(252,211,77,0.3));"
    />
  </svg>

  <!-- Center labels — matching Stitch hierarchy -->
  <div class="absolute flex flex-col items-center">
    <span class="font-label text-6xl font-bold tracking-tighter text-on-surface">{pressure.toFixed(1)}</span>
    <span class="font-label text-xs tracking-[0.4em] text-primary mt-1 uppercase">Bar Pressure</span>
    <div class="w-16 h-px bg-outline-variant/20 mt-3 mb-3"></div>
    <span class="font-label text-2xl font-medium" style="color: #fef3c7;">{flow.toFixed(1)}</span>
    <span class="font-label text-[10px] tracking-[0.2em] text-outline uppercase">ml/s Flow</span>
  </div>
</div>
