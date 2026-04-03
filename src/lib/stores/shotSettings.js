import { derived } from 'svelte/store'
import { createSocket } from '../api/websocket.js'
import { WS_BASE } from '../api/index.js'

const { store: shotSettingsRaw, cleanup: cleanupShotSettings } = createSocket(WS_BASE, '/machine/shotSettings')

export { shotSettingsRaw, cleanupShotSettings }

export const shotSettings = derived(shotSettingsRaw, ($raw) => {
  if (!$raw) {
    return {
      steamSetting: 1,
      targetSteamTemp: 160,
      targetSteamDuration: 120,
      targetHotWaterTemp: 85,
      targetHotWaterVolume: 250,
      targetHotWaterDuration: 60,
      targetShotVolume: 0,
      groupTemp: 93,
    }
  }
  return $raw
})
