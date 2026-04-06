<script>
  import { shots, shotsLoading, shotsTotal, loadShots, loadMoreShots, latestShotFull } from '../lib/stores/shots.js'
  import { api } from '../lib/api/index.js'
  import MetricCard from '../lib/components/MetricCard.svelte'
  import ExtractionChart from '../lib/components/ExtractionChart.svelte'

  let filterCoffee = $state('')
  let filterProfile = $state('')
  let expandedId = $state(null)
  let expandedShot = $state(null)
  let expandLoading = $state(false)

  let shotList = $derived($shots)
  let loading = $derived($shotsLoading)
  let total = $derived($shotsTotal)

  // Aggregate stats from loaded shots
  let stats = $derived.by(() => {
    if (shotList.length === 0) return { avgDose: '—', avgYield: '—', avgEnjoyment: '—' }

    let doseSum = 0, doseCount = 0
    let yieldSum = 0, yieldCount = 0
    let enjoySum = 0, enjoyCount = 0

    for (const s of shotList) {
      const d = s.annotations?.actualDoseWeight ?? s.workflow?.context?.targetDoseWeight
      if (d) { doseSum += d; doseCount++ }
      const y = s.annotations?.actualYield ?? s.workflow?.context?.targetYield
      if (y) { yieldSum += y; yieldCount++ }
      const e = s.annotations?.enjoyment
      if (e != null) { enjoySum += e; enjoyCount++ }
    }

    return {
      avgDose: doseCount > 0 ? (doseSum / doseCount).toFixed(1) : '—',
      avgYield: yieldCount > 0 ? (yieldSum / yieldCount).toFixed(1) : '—',
      avgEnjoyment: enjoyCount > 0 ? (enjoySum / enjoyCount).toFixed(1) : '—',
    }
  })

  // Load on mount
  $effect(() => { loadShots() })

  // Debounced filter
  let filterTimer = null
  function handleFilterInput() {
    clearTimeout(filterTimer)
    filterTimer = setTimeout(() => {
      const filters = {}
      if (filterCoffee.trim()) filters.coffeeName = filterCoffee.trim()
      if (filterProfile.trim()) filters.profileTitle = filterProfile.trim()
      loadShots(filters)
    }, 400)
  }

  $effect(() => { return () => clearTimeout(filterTimer) })

  function loadMore() {
    const filters = {}
    if (filterCoffee.trim()) filters.coffeeName = filterCoffee.trim()
    if (filterProfile.trim()) filters.profileTitle = filterProfile.trim()
    loadMoreShots(filters)
  }

  async function toggleExpand(shot) {
    const id = shot.id ?? shot.timestamp
    if (expandedId === id) {
      expandedId = null
      expandedShot = null
      return
    }
    expandedId = id
    expandedShot = null

    // Fetch full shot record with measurements
    if (shot.id) {
      expandLoading = true
      try {
        expandedShot = await api.get(`/shots/${shot.id}`)
      } catch (e) {
        console.error('Failed to load shot details:', e)
      } finally {
        expandLoading = false
      }
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

      let dateLabel
      if (diffDays === 0) dateLabel = 'Today'
      else if (diffDays === 1) dateLabel = 'Yesterday'
      else if (diffDays < 7) dateLabel = d.toLocaleDateString(undefined, { weekday: 'long' })
      else dateLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

      const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      return { dateLabel, time }
    } catch {
      return { dateLabel: dateStr, time: '' }
    }
  }

  function buildChartData(measurements) {
    const startTs = measurements[0]?.machine?.timestamp ? new Date(measurements[0].machine.timestamp).getTime() : 0
    const points = measurements.map((m, idx) => {
      const t = startTs ? (new Date(m.machine?.timestamp).getTime() - startTs) / 1000 : idx * 0.1
      return { time: Math.max(0, t), pressure: m.machine?.pressure ?? 0, flow: m.machine?.flow ?? 0 }
    })
    if (points.length < 2) return { pressurePath: '', flowPath: '' }

    const maxTime = Math.max(30, ...points.map(p => p.time))
    const pad = { left: 28, top: 8 }
    const plotW = 520 - pad.left - 8
    const plotH = 136

    const toX = (t) => pad.left + (t / maxTime) * plotW
    const toYP = (v) => pad.top + plotH - (v / 12) * plotH
    const toYF = (v) => pad.top + plotH - (v / 8) * plotH

    return {
      pressurePath: points.map(p => `${toX(p.time).toFixed(1)},${toYP(p.pressure).toFixed(1)}`).join(' '),
      flowPath: points.map(p => `${toX(p.time).toFixed(1)},${toYF(p.flow).toFixed(1)}`).join(' '),
    }
  }

  function enjoymentLabel(score) {
    if (score == null) return null
    const n = Number(score)
    if (n >= 4.5) return 'Excellent'
    if (n >= 3.5) return 'Good'
    if (n >= 2.5) return 'OK'
    if (n >= 1.5) return 'Poor'
    return 'Bad'
  }
</script>

<div class="h-full overflow-y-auto">
  <!-- Header -->
  <div class="px-6 pt-6 pb-2 flex items-end justify-between">
    <div>
      <h1 class="font-headline text-3xl font-bold text-primary">History</h1>
      <p class="font-body text-sm text-on-surface-variant mt-1">
        {#if total > 0}
          {total} shots recorded
        {:else}
          Your shot journal
        {/if}
      </p>
    </div>
    <!-- Stats -->
    {#if shotList.length > 0}
      <div class="flex gap-6">
        <div class="text-right">
          <span class="font-label text-[10px] tracking-widest uppercase text-on-surface-variant block">Avg Dose</span>
          <span class="font-label text-sm font-bold text-on-surface">{stats.avgDose}g</span>
        </div>
        <div class="text-right">
          <span class="font-label text-[10px] tracking-widest uppercase text-on-surface-variant block">Avg Yield</span>
          <span class="font-label text-sm font-bold text-on-surface">{stats.avgYield}g</span>
        </div>
        <div class="text-right">
          <span class="font-label text-[10px] tracking-widest uppercase text-on-surface-variant block">Avg Enjoyment</span>
          <span class="font-label text-sm font-bold text-primary">{stats.avgEnjoyment}/5</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Filter bar -->
  <div class="px-6 flex gap-3 my-4">
    <input
      type="text"
      bind:value={filterCoffee}
      oninput={handleFilterInput}
      placeholder="Filter by coffee..."
      class="flex-1 bg-surface-container-low text-on-surface font-label text-sm px-4 py-2.5 rounded-lg border-0 outline-none focus:ring-1 focus:ring-primary placeholder:text-outline"
    />
    <input
      type="text"
      bind:value={filterProfile}
      oninput={handleFilterInput}
      placeholder="Filter by profile..."
      class="flex-1 bg-surface-container-low text-on-surface font-label text-sm px-4 py-2.5 rounded-lg border-0 outline-none focus:ring-1 focus:ring-primary placeholder:text-outline"
    />
  </div>

  <!-- Shot list -->
  <div class="px-6 flex flex-col gap-2 pb-4">

    {#if shotList.length === 0 && !loading}
      <div class="flex flex-col items-center justify-center py-16">
        <p class="font-headline text-lg text-on-surface-variant">No shots yet</p>
        <p class="font-body text-sm text-outline mt-1">Pull your first shot and it will appear here.</p>
      </div>
    {/if}

    {#each shotList as shot, i}
      {@const id = shot.id ?? shot.timestamp ?? i}
      {@const date = formatDate(shot.timestamp)}
      {@const coffee = shot.workflow?.context?.coffeeName}
      {@const roaster = shot.workflow?.context?.coffeeRoaster}
      {@const profile = shot.workflow?.profile?.title}
      {@const doseVal = shot.annotations?.actualDoseWeight ?? shot.workflow?.context?.targetDoseWeight}
      {@const yieldVal = shot.annotations?.actualYield ?? shot.workflow?.context?.targetYield}
      {@const enjoyment = shot.annotations?.enjoyment}
      {@const isExpanded = expandedId === id}

      <button
        class="w-full text-left rounded-xl p-4 transition-all cursor-pointer"
        class:bg-surface-container-high={isExpanded}
        class:bg-surface-container-low={!isExpanded && i % 2 === 0}
        class:bg-surface-container={!isExpanded && i % 2 !== 0}
        class:hover:bg-surface-container-high={!isExpanded}
        onclick={() => toggleExpand(shot)}
      >
        <!-- Main row -->
        <div class="flex items-center gap-4">
          <!-- Date/time -->
          <div class="w-28 shrink-0">
            <span class="font-label text-sm font-bold text-on-surface block">{date.dateLabel}</span>
            <span class="font-label text-xs text-on-surface-variant">{date.time}</span>
          </div>

          <!-- Coffee + profile -->
          <div class="flex-1 min-w-0">
            <span class="font-headline text-sm font-bold text-on-surface block truncate">{coffee ?? 'Unknown coffee'}</span>
            <div class="flex items-center gap-2 mt-0.5">
              {#if roaster}
                <span class="font-label text-[10px] text-on-surface-variant">{roaster}</span>
              {/if}
              {#if profile}
                <span class="font-label text-[10px] text-outline">{profile}</span>
              {/if}
            </div>
          </div>

          <!-- Dose/Yield -->
          <div class="flex items-center gap-3 shrink-0">
            {#if doseVal}
              <div class="text-right">
                <span class="font-label text-sm font-bold text-on-surface tabular-nums">{doseVal}</span>
                <span class="font-label text-[10px] text-outline">g in</span>
              </div>
            {/if}
            {#if doseVal && yieldVal}
              <span class="text-outline-variant text-xs">:</span>
            {/if}
            {#if yieldVal}
              <div class="text-right">
                <span class="font-label text-sm font-bold text-on-surface tabular-nums">{yieldVal}</span>
                <span class="font-label text-[10px] text-outline">g out</span>
              </div>
            {/if}
          </div>

          <!-- Enjoyment -->
          <div class="w-20 text-right shrink-0">
            {#if enjoyment != null}
              <span class="font-label text-sm font-bold text-primary">{enjoyment}/5</span>
              <span class="font-label text-[10px] text-on-surface-variant block">{enjoymentLabel(enjoyment)}</span>
            {:else}
              <span class="font-label text-xs text-outline">No rating</span>
            {/if}
          </div>
        </div>
      </button>

      <!-- Expanded detail -->
      {#if isExpanded}
        <div class="rounded-xl bg-surface-container-high px-5 py-4 -mt-1 flex flex-col gap-4">
          {#if expandLoading}
            <div class="flex items-center justify-center py-6">
              <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span class="font-label text-xs text-on-surface-variant ml-3">Loading shot data...</span>
            </div>
          {:else}
            <!-- Details grid -->
            <div class="flex gap-6 flex-wrap">
              {#if shot.workflow?.context?.grinderSetting}
                <div>
                  <span class="font-label text-[10px] tracking-wider uppercase text-on-surface-variant block">Grind</span>
                  <span class="font-label text-sm text-on-surface">{shot.workflow.context.grinderSetting}</span>
                </div>
              {/if}
              {#if shot.annotations?.drinkTds}
                <div>
                  <span class="font-label text-[10px] tracking-wider uppercase text-on-surface-variant block">TDS</span>
                  <span class="font-label text-sm text-on-surface">{shot.annotations.drinkTds}%</span>
                </div>
              {/if}
              {#if shot.annotations?.drinkEy}
                <div>
                  <span class="font-label text-[10px] tracking-wider uppercase text-on-surface-variant block">EY</span>
                  <span class="font-label text-sm text-on-surface">{shot.annotations.drinkEy}%</span>
                </div>
              {/if}
              {#if doseVal && yieldVal}
                <div>
                  <span class="font-label text-[10px] tracking-wider uppercase text-on-surface-variant block">Ratio</span>
                  <span class="font-label text-sm text-primary">1:{(yieldVal / doseVal).toFixed(1)}</span>
                </div>
              {/if}
            </div>

            <!-- Notes -->
            {#if shot.annotations?.espressoNotes || shot.shotNotes}
              <p class="font-body text-sm text-on-surface-variant leading-relaxed">
                {shot.annotations?.espressoNotes ?? shot.shotNotes}
              </p>
            {/if}

            <!-- Extraction curve from full shot -->
            {#if expandedShot?.measurements?.length}
              {@const chartData = buildChartData(expandedShot.measurements)}
              <div class="rounded-lg bg-surface-container p-4">
                <span class="font-label text-[10px] tracking-wider uppercase text-on-surface-variant block mb-2">Extraction Curve</span>
                <svg viewBox="0 0 520 160" class="w-full" preserveAspectRatio="xMidYMid meet">
                  {#each [0, 3, 6, 9, 12] as tick}
                    <line x1={28} x2={512}
                      y1={8 + 136 - (tick / 12) * 136}
                      y2={8 + 136 - (tick / 12) * 136}
                      stroke="var(--color-outline)" stroke-opacity="0.1" stroke-width="0.5" />
                    <text x={24} y={8 + 136 - (tick / 12) * 136 + 3}
                      text-anchor="end" fill="var(--color-primary)" style="font-family: var(--font-label); font-size: 7px;">{tick}</text>
                  {/each}

                  {#if chartData.pressurePath}
                    <polyline points={chartData.pressurePath}
                      fill="none" stroke="var(--color-primary)" stroke-width="1.5" stroke-linejoin="round" />
                  {/if}
                  {#if chartData.flowPath}
                    <polyline points={chartData.flowPath}
                      fill="none" stroke="#fef3c7" stroke-width="1.5" stroke-linejoin="round" />
                  {/if}
                </svg>
              </div>
            {/if}

            {#if !shot.annotations?.espressoNotes && !shot.shotNotes && !expandedShot?.measurements?.length && !shot.annotations?.drinkTds}
              <p class="font-body text-sm text-outline">No additional details for this shot.</p>
            {/if}
          {/if}
        </div>
      {/if}
    {/each}

    <!-- Loading -->
    {#if loading}
      <div class="flex items-center justify-center py-8">
        <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span class="font-label text-sm text-on-surface-variant ml-3">Loading...</span>
      </div>
    {/if}

    <!-- Load more -->
    {#if shotList.length > 0 && !loading && $shots.length < $shotsTotal}
      <div class="flex justify-center py-4">
        <button
          class="px-8 py-3 rounded-lg bg-surface-container-highest text-on-surface font-label font-bold uppercase tracking-widest tactile-sink text-sm"
          onclick={loadMore}
        >Load More</button>
      </div>
    {/if}
  </div>
</div>
