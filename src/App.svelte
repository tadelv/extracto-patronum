<script>
  import Router, { replace, location } from 'svelte-spa-router'
  import { onMount } from 'svelte'
  import { onboarding, loadOnboarding } from './lib/stores/onboarding.js'
  import { loadWorkflow, workflowLoading } from './lib/stores/workflow.js'
  import TopBar from './lib/components/TopBar.svelte'

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
  }

  let loading = true

  onMount(async () => {
    await Promise.all([loadOnboarding(), loadWorkflow()])
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
  <div class="h-screen bg-background flex items-center justify-center">
    <div class="text-primary font-label text-sm tracking-widest uppercase animate-pulse">
      Initializing Console...
    </div>
  </div>
{:else}
  <div class="h-screen bg-background flex flex-col overflow-hidden">
    <TopBar />
    <main class="flex-1 overflow-y-auto">
      <Router {routes} />
    </main>
  </div>
{/if}
