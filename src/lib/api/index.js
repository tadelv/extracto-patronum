import { createClient } from './client.js'

const host = import.meta.env.VITE_API_HOST || window.location.hostname
const baseUrl = `http://${host}:8080`

export const api = createClient(baseUrl)
export const API_HOST = host
export const API_BASE = baseUrl
export const WS_BASE = `ws://${host}:8080/ws/v1`
