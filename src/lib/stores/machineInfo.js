import { writable } from 'svelte/store'
import { api } from '../api/index.js'

export const machineInfo = writable(null)

export async function loadMachineInfo() {
  try {
    const info = await api.get('/machine/info')
    machineInfo.set(info)
  } catch (e) {
    console.error('Failed to load machine info:', e)
  }
}
