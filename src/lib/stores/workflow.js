import { writable, get } from 'svelte/store'
import { api } from '../api/index.js'

const SKIN_NS = 'extracto-patronum'

export const workflow = writable(null)
export const workflowLoading = writable(true)

export async function loadWorkflow() {
  workflowLoading.set(true)
  try {
    const skinWorkflow = await api.get(`/store/${SKIN_NS}/workflow`).catch(() => null)
    if (skinWorkflow?.value) {
      const parsed = typeof skinWorkflow.value === 'string'
        ? JSON.parse(skinWorkflow.value) : skinWorkflow.value
      workflow.set(parsed)
      await api.put('/workflow', parsed).catch(() => {})
    } else {
      const bridgeWorkflow = await api.get('/workflow')
      workflow.set(bridgeWorkflow)
      await persistToSkinStore(bridgeWorkflow)
    }
  } catch (e) {
    console.error('Failed to load workflow:', e)
    workflow.set(null)
  } finally {
    workflowLoading.set(false)
  }
}

async function persistToSkinStore(data) {
  try {
    await api.post(`/store/${SKIN_NS}/workflow`, { value: JSON.stringify(data) })
  } catch (e) {
    console.error('Failed to persist workflow to skin store:', e)
  }
}

export async function updateWorkflow(updates) {
  const current = get(workflow)
  const updated = { ...current, ...updates }
  workflow.set(updated)
  await Promise.all([
    api.put('/workflow', updated),
    persistToSkinStore(updated),
  ])
}
