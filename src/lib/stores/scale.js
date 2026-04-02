import { derived } from 'svelte/store'
import { createSocket } from '../api/websocket.js'
import { WS_BASE } from '../api/index.js'

const { store: scaleSnapshot, cleanup: cleanupScale } = createSocket(WS_BASE, '/scale/snapshot')

export { scaleSnapshot, cleanupScale }

export const scaleState = derived(scaleSnapshot, ($snap) => {
  if (!$snap) {
    return { weight: 0, batteryLevel: null, timerValue: null, connected: false }
  }
  return {
    weight: $snap.weight ?? 0,
    batteryLevel: $snap.batteryLevel ?? null,
    timerValue: $snap.timerValue ?? null,
    connected: true,
  }
})
