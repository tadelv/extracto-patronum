<script>
  import { shots, shotsLoading, loadShots, loadMoreShots } from '../lib/stores/shots.js'
  import MetricCard from '../lib/components/MetricCard.svelte'

  let filterCoffee = $state('')
  let filterProfile = $state('')
  let expandedId = $state(null)

  let shotList = $derived($shots)
  let loading = $derived($shotsLoading)

  // Aggregate stats
  let totalShots = $derived(shotList.length)
  let avgDose = $derived(
    shotList.length > 0
      ? (shotList.reduce((sum, s) => sum + (s.dose ?? s.annotations?.dose ?? 0), 0) / shotList.length).toFixed(1)
      : '—'
  )
  let avgEnjoyment = $derived(
    (() => {
      const rated = shotList.filter(s => s.annotations?.enjoyment != null)
      return rated.length > 0
        ? (rated.reduce((sum, s) => sum + s.annotations.enjoyment, 0) / rated.length).toFixed(1)
        : '—'
    })()
  )

  // Load on mount
  $effect(() => {
    loadShots()
  })

  function applyFilters() {
    const filters = {}
    if (filterCoffee) filters.coffeeName = filterCoffee
    if (filterProfile) filters.profileTitle = filterProfile
    loadShots(filters)
  }

  function handleFilterInput() {
    applyFilters()
  }

  function loadMore() {
    const filters = {}
    if (filterCoffee) filters.coffeeName = filterCoffee
    if (filterProfile) filters.profileTitle = filterProfile
    loadMoreShots(filters)
  }

  function toggleExpand(id) {
    expandedId = expandedId === id ? null : id
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  function formatTime(seconds) {
    if (seconds == null) return '—'
    const s = Number(seconds)
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  function renderStars(score) {
    if (score == null) return '—'
    const n = Math.round(Number(score))
    return '\u2605'.repeat(n) + '\u2606'.repeat(Math.max(0, 5 - n))
  }
</script>

<!-- Header -->
<div class="px-6 pt-6 pb-2">
  <h1 class="font-headline text-3xl font-bold text-primary">Extraction Archive</h1>
  <p class="font-body text-sm text-on-surface-variant mt-1">Your shot history</p>
</div>

<!-- Filter bar -->
<div class="px-6 flex gap-4 mb-4">
  <input
    type="text"
    bind:value={filterCoffee}
    oninput={handleFilterInput}
    placeholder="Filter by coffee name..."
    class="flex-1 bg-surface-container-low text-on-surface font-label text-sm px-4 py-3 rounded-xl border-0 outline-none focus:ring-2 focus:ring-primary placeholder:text-outline"
  />
  <input
    type="text"
    bind:value={filterProfile}
    oninput={handleFilterInput}
    placeholder="Filter by profile..."
    class="flex-1 bg-surface-container-low text-on-surface font-label text-sm px-4 py-3 rounded-xl border-0 outline-none focus:ring-2 focus:ring-primary placeholder:text-outline"
  />
</div>

<!-- Shots table -->
<div class="px-6">
  <!-- Header row -->
  <div class="grid grid-cols-12 gap-2 px-4 py-2">
    <span class="col-span-3 font-label text-xs tracking-widest uppercase text-on-surface-variant">Date</span>
    <span class="col-span-2 font-label text-xs tracking-widest uppercase text-on-surface-variant">Bean</span>
    <span class="col-span-1 font-label text-xs tracking-widest uppercase text-on-surface-variant text-right">Dose</span>
    <span class="col-span-1 font-label text-xs tracking-widest uppercase text-on-surface-variant text-right">Yield</span>
    <span class="col-span-1 font-label text-xs tracking-widest uppercase text-on-surface-variant text-right">Time</span>
    <span class="col-span-2 font-label text-xs tracking-widest uppercase text-on-surface-variant">Profile</span>
    <span class="col-span-2 font-label text-xs tracking-widest uppercase text-on-surface-variant text-center">Rating</span>
  </div>

  {#if shotList.length === 0 && !loading}
    <div class="flex items-center justify-center py-16">
      <span class="font-body text-sm text-outline">No shots found. Brew your first espresso!</span>
    </div>
  {/if}

  {#each shotList as shot, i}
    {@const bg = i % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low'}
    {@const id = shot.id ?? shot.timestamp ?? i}
    <button
      class="grid grid-cols-12 gap-2 px-4 py-3 rounded-lg w-full text-left cursor-pointer transition-colors hover:bg-surface-container-highest {bg}"
      onclick={() => toggleExpand(id)}
    >
      <span class="col-span-3 font-label text-sm text-on-surface truncate">{formatDate(shot.timestamp ?? shot.date)}</span>
      <span class="col-span-2 font-label text-sm text-on-surface truncate">{shot.coffeeName ?? shot.annotations?.coffeeName ?? '—'}</span>
      <span class="col-span-1 font-label text-sm text-on-surface text-right tabular-nums">{shot.dose ?? shot.annotations?.dose ?? '—'}</span>
      <span class="col-span-1 font-label text-sm text-on-surface text-right tabular-nums">{shot.yield ?? shot.annotations?.actualYield ?? '—'}</span>
      <span class="col-span-1 font-label text-sm text-on-surface text-right tabular-nums">{formatTime(shot.duration ?? shot.totalTime)}</span>
      <span class="col-span-2 font-label text-sm text-on-surface-variant truncate">{shot.profileTitle ?? '—'}</span>
      <span class="col-span-2 font-label text-sm text-primary text-center">{renderStars(shot.annotations?.enjoyment)}</span>
    </button>

    {#if expandedId === id}
      <div class="bg-surface-container-lowest px-6 py-4 rounded-b-lg mb-1 ml-4 mr-4">
        {#if shot.shotNotes || shot.annotations?.espressoNotes}
          <p class="font-body text-sm text-on-surface-variant leading-relaxed mb-2">
            {shot.annotations?.espressoNotes ?? shot.shotNotes}
          </p>
        {/if}
        {#if shot.annotations}
          <div class="flex flex-wrap gap-4 text-xs font-label text-on-surface-variant">
            {#if shot.annotations.grindSetting}
              <span>Grind: {shot.annotations.grindSetting}</span>
            {/if}
            {#if shot.annotations.beanWeight}
              <span>Bean: {shot.annotations.beanWeight}g</span>
            {/if}
            {#if shot.annotations.drinkWeight}
              <span>Drink: {shot.annotations.drinkWeight}g</span>
            {/if}
          </div>
        {/if}
        {#if !shot.shotNotes && !shot.annotations?.espressoNotes && !shot.annotations}
          <span class="font-body text-sm text-outline">No additional details for this shot.</span>
        {/if}
      </div>
    {/if}
  {/each}

  <!-- Loading spinner -->
  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <span class="font-label text-sm text-on-surface-variant ml-3">Loading shots...</span>
    </div>
  {/if}

  <!-- Load more -->
  {#if shotList.length > 0 && !loading}
    <div class="flex justify-center py-6">
      <button
        class="px-8 py-3 rounded-lg bg-surface-container-highest text-on-surface font-label font-bold uppercase tracking-widest tactile-sink"
        onclick={loadMore}
      >Load More</button>
    </div>
  {/if}
</div>

<!-- Stats footer -->
<div class="px-6 grid grid-cols-3 gap-4 pb-6">
  <MetricCard label="Total Shots" value={totalShots} icon="" />
  <MetricCard label="Avg Dose" value={avgDose} unit="g" icon="" />
  <MetricCard label="Avg Enjoyment" value={avgEnjoyment} unit="/5" icon="" />
</div>
