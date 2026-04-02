import { writable, get } from 'svelte/store'
import { api } from '../api/index.js'

const SKIN_NS = 'extracto-patronum'

const defaultState = {
  completed: false,
  currentStep: 0,
  roast: null,
  profile: null,
  targets: null,
}

export const onboarding = writable(defaultState)
export const onboardingLoading = writable(true)

export async function loadOnboarding() {
  onboardingLoading.set(true)
  try {
    const stored = await api.get(`/store/${SKIN_NS}/onboarding`).catch(() => null)
    if (stored?.value) {
      const parsed = typeof stored.value === 'string' ? JSON.parse(stored.value) : stored.value
      onboarding.set({ ...defaultState, ...parsed })
    }
  } catch (e) {
    console.error('Failed to load onboarding state:', e)
  } finally {
    onboardingLoading.set(false)
  }
}

export async function saveOnboarding(updates) {
  const current = get(onboarding)
  const updated = { ...current, ...updates }
  onboarding.set(updated)
  try {
    await api.post(`/store/${SKIN_NS}/onboarding`, { value: JSON.stringify(updated) })
  } catch (e) {
    console.error('Failed to save onboarding state:', e)
  }
}

export async function resetOnboarding() {
  onboarding.set(defaultState)
  try {
    await api.post(`/store/${SKIN_NS}/onboarding`, { value: JSON.stringify(defaultState) })
  } catch (e) {
    console.error('Failed to reset onboarding state:', e)
  }
}
