import { derived } from 'svelte/store'
import { createSocket } from '../api/websocket.js'
import { WS_BASE } from '../api/index.js'

const { store: machineSnapshot, cleanup: cleanupMachine } = createSocket(WS_BASE, '/machine/snapshot')

export { machineSnapshot, cleanupMachine }

export const machineState = derived(machineSnapshot, ($snap) => {
  if (!$snap) {
    return {
      state: 'disconnected', substate: 'idle',
      isIdle: false, isBrewing: false, isSteaming: false,
      isSteamRinsing: false, isHeating: false, isFlushing: false, isSleeping: false,
      pressure: 0, flow: 0, mixTemperature: 0, groupTemperature: 0,
      steamTemperature: 0, targetPressure: 0, targetFlow: 0,
      targetMixTemperature: 0, targetGroupTemperature: 0, profileFrame: 0,
    }
  }
  const state = $snap.state?.state ?? 'idle'
  const substate = $snap.state?.substate ?? 'idle'
  return {
    state, substate,
    isIdle: state === 'idle',
    isBrewing: state === 'espresso',
    isSteaming: state === 'steam',
    isSteamRinsing: state === 'steamRinse',
    isHeating: state === 'heating' || state === 'preheating',
    isFlushing: state === 'flush',
    isSleeping: state === 'sleeping',
    pressure: $snap.pressure ?? 0,
    flow: $snap.flow ?? 0,
    mixTemperature: $snap.mixTemperature ?? 0,
    groupTemperature: $snap.groupTemperature ?? 0,
    steamTemperature: $snap.steamTemperature ?? 0,
    targetPressure: $snap.targetPressure ?? 0,
    targetFlow: $snap.targetFlow ?? 0,
    targetMixTemperature: $snap.targetMixTemperature ?? 0,
    targetGroupTemperature: $snap.targetGroupTemperature ?? 0,
    profileFrame: $snap.profileFrame ?? 0,
  }
})
