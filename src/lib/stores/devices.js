import { derived } from 'svelte/store'
import { createSocket } from '../api/websocket.js'
import { WS_BASE } from '../api/index.js'

const { store: devicesRaw, send: sendDeviceCommand, cleanup: cleanupDevices } = createSocket(WS_BASE, '/devices')

export { devicesRaw, cleanupDevices }

export const devices = derived(devicesRaw, ($raw) => {
  if (!$raw) return { machines: [], scales: [], scanning: false }
  const list = Array.isArray($raw) ? $raw : ($raw.devices ?? [])
  return {
    machines: list.filter((d) => d.type === 'machine' || d.type === 'de1'),
    scales: list.filter((d) => d.type === 'scale'),
    scanning: $raw.scanning ?? false,
    all: list,
  }
})

export function scanDevices() {
  sendDeviceCommand({ command: 'scan' })
}

export function connectDevice(deviceId) {
  sendDeviceCommand({ command: 'connect', deviceId })
}

export function disconnectDevice(deviceId) {
  sendDeviceCommand({ command: 'disconnect', deviceId })
}
