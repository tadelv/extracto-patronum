<script>
  import { link, router } from 'svelte-spa-router'
  import { machineState } from '../stores/machine.js'
  import { machineInfo } from '../stores/machineInfo.js'
  import { scaleState } from '../stores/scale.js'
  import { scanDevices } from '../stores/devices.js'

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/lab', label: 'Customizer' },
    // { path: '/maintenance', label: 'Maintenance' }, // TODO: deferred
    { path: '/history', label: 'History' },
  ]

  function handleDeviceClick() {
    scanDevices()
  }
</script>

<header class="h-14 bg-surface-container-low flex items-center justify-between px-6 shrink-0">
  <div class="flex items-center gap-4">
    <span class="font-headline font-extrabold text-sm text-primary tracking-tight uppercase">
      Extracto Patronum
    </span>

    <div class="flex items-center gap-3 ml-4">
      <button
        class="flex items-center gap-1.5 text-xs font-label tracking-wider uppercase transition-colors hover:text-primary"
        class:text-primary={$machineState.state !== 'disconnected'}
        class:text-outline={$machineState.state === 'disconnected'}
        onclick={handleDeviceClick}
      >
        <span
          class="w-2 h-2 rounded-full"
          class:bg-emerald-500={$machineState.state !== 'disconnected'}
          class:bg-outline={$machineState.state === 'disconnected'}
          class:animate-pulse={$machineState.state !== 'disconnected'}
        ></span>
        Machine
      </button>

      <button
        class="flex items-center gap-1.5 text-xs font-label tracking-wider uppercase transition-colors hover:text-primary"
        class:text-primary={$scaleState.connected}
        class:text-outline={!$scaleState.connected}
        onclick={handleDeviceClick}
      >
        <span
          class="w-2 h-2 rounded-full"
          class:bg-emerald-500={$scaleState.connected}
          class:bg-outline={!$scaleState.connected}
        ></span>
        Scale
      </button>
    </div>
  </div>

  <nav class="flex items-center gap-1">
    {#each navItems as item}
      <a
        href={item.path}
        use:link
        class="px-4 py-1.5 text-xs font-label tracking-widest uppercase transition-colors rounded-sm"
        class:text-primary={router.location === item.path}
        class:bg-surface-container={router.location === item.path}
        class:text-on-surface-variant={router.location !== item.path}
        class:hover:text-primary={router.location !== item.path}
      >
        {item.label}
      </a>
    {/each}

    <a
      href="/settings"
      use:link
      aria-label="Settings"
      class="ml-2 p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </a>
  </nav>
</header>
