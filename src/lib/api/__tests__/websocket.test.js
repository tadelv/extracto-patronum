import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSocket } from '../websocket.js'
import { get } from 'svelte/store'

class MockWebSocket {
  static instances = []
  constructor(url) {
    this.url = url
    this.readyState = 0
    MockWebSocket.instances.push(this)
  }
  close() { this.readyState = 3 }
  send(data) { this._lastSent = data }
  _receive(data) {
    this.onmessage?.({ data: JSON.stringify(data) })
  }
  _open() {
    this.readyState = 1
    this.onopen?.()
  }
  _close() {
    this.readyState = 3
    this.onclose?.({ code: 1000 })
  }
}

describe('WebSocket manager', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('connects to the correct URL', () => {
    const { cleanup } = createSocket('ws://localhost:8080/ws/v1', '/machine/snapshot')
    expect(MockWebSocket.instances[0].url).toBe('ws://localhost:8080/ws/v1/machine/snapshot')
    cleanup()
  })

  it('store updates on message', () => {
    const { store, cleanup } = createSocket('ws://localhost:8080/ws/v1', '/machine/snapshot')
    const ws = MockWebSocket.instances[0]
    ws._open()
    ws._receive({ pressure: 9.1, flow: 2.5 })
    expect(get(store)).toEqual({ pressure: 9.1, flow: 2.5 })
    cleanup()
  })

  it('store holds latest message only', () => {
    const { store, cleanup } = createSocket('ws://localhost:8080/ws/v1', '/machine/snapshot')
    const ws = MockWebSocket.instances[0]
    ws._open()
    ws._receive({ pressure: 9.0 })
    ws._receive({ pressure: 9.1 })
    expect(get(store)).toEqual({ pressure: 9.1 })
    cleanup()
  })

  it('cleanup closes the socket', () => {
    const { cleanup } = createSocket('ws://localhost:8080/ws/v1', '/machine/snapshot')
    const ws = MockWebSocket.instances[0]
    cleanup()
    expect(ws.readyState).toBe(3)
  })
})
