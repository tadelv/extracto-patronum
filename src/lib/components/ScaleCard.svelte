<script>
  import { scaleState } from '../stores/scale.js'
  import { devices, scanDevices, connectDevice, disconnectDevice } from '../stores/devices.js'
  import { api } from '../api/index.js'

  let sc = $derived($scaleState)
  let devs = $derived($devices)

  let tareLoading = $state(false)

  async function handleScan() {
    scanDevices()
    try {
      await api.get('/devices/scan?connect=true')
    } catch (e) {
      console.error('Failed to scan for devices:', e)
    }
  }

  async function handleTare() {
    tareLoading = true
    try {
      await api.put('/scale/tare')
    } catch (e) {
      console.error('Failed to tare scale:', e)
    } finally {
      tareLoading = false
    }
  }

  function handleConnect(deviceId) {
    connectDevice(deviceId)
  }

  function handleDisconnect(deviceId) {
    disconnectDevice(deviceId)
  }

  let connectedScale = $derived(devs.scales.find((s) => s.connected))
</script>

<div class="glass-panel rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
  {#if sc.connected}
    <!-- Connected state: weight hero + battery + tare + disconnect -->
    <div class="flex items-center gap-4">
      <div class="flex items-baseline gap-1">
        <span class="font-label text-2xl font-bold text-on-surface tabular-nums">{sc.weight.toFixed(1)}</span>
        <span class="font-label text-xs text-outline">g</span>
      </div>
      {#if sc.batteryLevel != null}
        <span class="font-label text-xs text-on-surface-variant">{sc.batteryLevel}%</span>
      {/if}
    </div>
    <div class="flex items-center gap-3">
      <button
        class="px-4 py-2 rounded-sm ghost-border font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors tactile-sink"
        class:opacity-50={tareLoading}
        disabled={tareLoading}
        onclick={handleTare}
      >Tare</button>
      {#if connectedScale}
        <button
          class="font-label text-xs text-outline hover:text-on-surface-variant transition-colors"
          onclick={() => handleDisconnect(connectedScale.id)}
        >disconnect</button>
      {/if}
    </div>
  {:else if devs.scanning}
    <!-- Scanning state -->
    <div class="flex items-center gap-3">
      <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <span class="font-label text-sm tracking-wider uppercase text-on-surface-variant">Scanning...</span>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
      {#each devs.scales as scale}
        <button
          class="px-3 py-1.5 rounded-sm ghost-border font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors tactile-sink"
          onclick={() => handleConnect(scale.id)}
        >{scale.name ?? 'Scale'}</button>
      {/each}
    </div>
  {:else}
    <!-- No scale connected -->
    <span class="font-label text-sm tracking-wider uppercase text-outline">No Scale</span>
    <button
      class="px-5 py-2 gradient-cta text-on-primary-fixed font-label text-xs font-bold uppercase tracking-widest rounded-sm tactile-sink"
      onclick={handleScan}
    >Scan</button>
  {/if}
</div>
