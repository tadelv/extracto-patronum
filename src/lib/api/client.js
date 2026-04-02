export function createClient(baseUrl) {
  const base = `${baseUrl}/api/v1`

  async function request(method, path, body) {
    const options = { method }
    if (body !== undefined) {
      options.headers = { 'Content-Type': 'application/json' }
      options.body = JSON.stringify(body)
    }
    const res = await fetch(`${base}${path}`, options)
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`)
    }
    return res.json()
  }

  return {
    get: (path) => request('GET', path),
    put: (path, body) => request('PUT', path, body),
    post: (path, body) => request('POST', path, body),
    del: (path) => request('DELETE', path),
  }
}
