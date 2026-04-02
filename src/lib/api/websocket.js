import { writable } from 'svelte/store'

export function createSocket(wsBase, path) {
  const store = writable(null)
  let ws = null
  let reconnectTimer = null
  let stopped = false

  function connect() {
    if (stopped) return
    ws = new WebSocket(`${wsBase}${path}`)

    ws.onmessage = (event) => {
      try {
        store.set(JSON.parse(event.data))
      } catch {
        // ignore non-JSON messages
      }
    }

    ws.onclose = () => {
      if (!stopped) {
        reconnectTimer = setTimeout(connect, 2000)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }

  function send(data) {
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify(data))
    }
  }

  function cleanup() {
    stopped = true
    clearTimeout(reconnectTimer)
    ws?.close()
  }

  connect()

  return { store, send, cleanup }
}
