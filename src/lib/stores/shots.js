import { writable } from 'svelte/store'
import { api } from '../api/index.js'

export const shots = writable([])
export const shotsLoading = writable(false)
export const shotsTotal = writable(0)
export const latestShot = writable(null)

let currentOffset = 0
const PAGE_SIZE = 20

export async function loadShots(filters = {}) {
  shotsLoading.set(true)
  currentOffset = 0
  try {
    const params = new URLSearchParams({ limit: PAGE_SIZE, offset: 0, order: 'desc' })
    for (const [key, val] of Object.entries(filters)) {
      if (val) params.set(key, val)
    }
    const result = await api.get(`/shots?${params}`)
    const list = Array.isArray(result) ? result : (result.items ?? [])
    if (!Array.isArray(result) && result.total != null) {
      shotsTotal.set(result.total)
    }
    shots.set(list)
    currentOffset = list.length
  } catch (e) {
    console.error('Failed to load shots:', e)
  } finally {
    shotsLoading.set(false)
  }
}

export async function loadMoreShots(filters = {}) {
  shotsLoading.set(true)
  try {
    const params = new URLSearchParams({ limit: PAGE_SIZE, offset: currentOffset, order: 'desc' })
    for (const [key, val] of Object.entries(filters)) {
      if (val) params.set(key, val)
    }
    const result = await api.get(`/shots?${params}`)
    const list = Array.isArray(result) ? result : (result.items ?? [])
    if (!Array.isArray(result) && result.total != null) {
      shotsTotal.set(result.total)
    }
    shots.update((current) => [...current, ...list])
    currentOffset += list.length
  } catch (e) {
    console.error('Failed to load more shots:', e)
  } finally {
    shotsLoading.set(false)
  }
}

export async function loadLatestShot() {
  try {
    const shot = await api.get('/shots/latest')
    latestShot.set(shot)
  } catch (e) {
    console.error('Failed to load latest shot:', e)
  }
}
