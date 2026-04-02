import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '../client.js'

describe('REST client', () => {
  let client
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    client = createClient('http://localhost:8080')
  })

  it('GET request to correct URL', async () => {
    await client.get('/workflow')
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/workflow',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('PUT request with JSON body', async () => {
    const body = { targetDoseWeight: 18 }
    await client.put('/workflow', body)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/workflow',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    )
  })

  it('POST request with JSON body', async () => {
    await client.post('/beans', { roaster: 'Test', name: 'Test' })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/beans',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('DELETE request', async () => {
    await client.del('/shots/123')
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/shots/123',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('throws on non-OK response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
    await expect(client.get('/nope')).rejects.toThrow('404')
  })

  it('returns parsed JSON', async () => {
    const result = await client.get('/workflow')
    expect(result).toEqual({ data: 'test' })
  })
})
