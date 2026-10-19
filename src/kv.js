const BASE = import.meta.env.VITE_KV_URL

// This browser's id; the kv server requires one on every request.
const cid = localStorage.getItem('client-id') || crypto.randomUUID().replace(/-/g, '').slice(0, 16)
localStorage.setItem('client-id', cid)

const req = async (path, { headers, ...init } = {}) => {
  if (!BASE) throw new Error('VITE_KV_URL is not set, see .env.example')
  const r = await fetch(BASE + path, { ...init, headers: { 'X-Client-Id': cid, ...headers } })
  if (!r.ok) throw new Error(`kv ${path}: ${r.status}`)
  return r
}

export const kvGet = async key => (await req(`/k/${encodeURIComponent(key)}`)).json()

// PATCH the key we hold a token for, else POST a new one. Returns { key, token }.
export const kvSave = async (data, kv) => {
  const body = JSON.stringify(data)
  const headers = { 'Content-Type': 'application/json' }
  if (kv?.token) {
    await req(`/k/${encodeURIComponent(kv.key)}`, { method: 'PATCH', body, headers: { ...headers, Authorization: `Bearer ${kv.token}` } })
    return kv
  }
  const { key, token } = await (await req('/create', { method: 'POST', body, headers })).json()
  return { key, token }
}
