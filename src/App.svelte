<script>
  import Router, { replace } from 'svelte-spa-router'
  import { onMount } from 'svelte'
  import { onboarding, loadOnboarding } from './lib/stores/onboarding.js'
  import { loadWorkflow } from './lib/stores/workflow.js'
  import { loadMachineInfo } from './lib/stores/machineInfo.js'
  import TopBar from './lib/components/TopBar.svelte'
  import BottomNav from './lib/components/BottomNav.svelte'

  import Dashboard from './pages/Dashboard.svelte'
  import ExtractionLab from './pages/ExtractionLab.svelte'
  import History from './pages/History.svelte'
  import Maintenance from './pages/Maintenance.svelte'
  import Settings from './pages/Settings.svelte'
  import Onboarding from './pages/Onboarding/Onboarding.svelte'

  const routes = {
    '/onboarding': Onboarding,
    '/dashboard': Dashboard,
    '/lab': ExtractionLab,
    '/history': History,
    '/maintenance': Maintenance,
    '/settings': Settings,
    '*': Dashboard,
  }

  let loading = $state(true)
  let mainEl = $state(null)
  let showScrollFade = $state(false)

  let rafId = 0

  function checkScroll() {
    if (!mainEl) return
    const { scrollTop, scrollHeight, clientHeight } = mainEl
    showScrollFade = scrollHeight - scrollTop - clientHeight > 20
  }

  function scheduleScrollCheck() {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      checkScroll()
      rafId = 0
    })
  }

  $effect(() => {
    if (!mainEl) return
    checkScroll()
    const observer = new ResizeObserver(checkScroll)
    observer.observe(mainEl)
    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  })

  onMount(async () => {
    try {
      await Promise.race([
        Promise.all([loadOnboarding(), loadWorkflow(), loadMachineInfo()]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ])
    } catch (e) {
      console.warn('Failed to load initial state:', e)
    }
    loading = false

    const hash = window.location.hash
    if (!hash || hash === '#/' || hash === '#') {
      if ($onboarding.completed) {
        replace('/dashboard')
      } else {
        replace('/onboarding')
      }
    }
  })
</script>

{#if loading}
  <div class="h-dvh bg-background flex items-center justify-center">
    <div class="text-primary font-label text-sm tracking-widest uppercase animate-pulse">
      Initializing Console...
    </div>
  </div>
{:else}
  <div class="h-dvh bg-background flex flex-col overflow-hidden relative">
    <TopBar />
    <main class="flex-1 overflow-y-auto" bind:this={mainEl} onscroll={scheduleScrollCheck}>
      <Router {routes} />
    </main>
    <BottomNav />
    <div
      class="absolute bottom-0 left-0 right-0 h-12 pointer-events-none transition-opacity duration-300 bg-gradient-to-t from-background to-transparent"
      class:opacity-0={!showScrollFade}
      aria-hidden="true"
    ></div>
  </div>
{/if}
