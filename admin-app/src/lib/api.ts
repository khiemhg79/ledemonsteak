function apiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")
  if (configured && (typeof window === "undefined" || window.location.protocol === "https:")) return configured
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:4000`
  }
  return configured || "http://localhost:4000"
}

async function readError(res: Response) {
  const text = await res.text()
  if (!text) return `HTTP ${res.status} ${res.statusText}`
  try { return JSON.parse(text).error || text } catch { return text }
}

function authToken(token?: string) {
  if (token) return token
  return typeof window !== "undefined" ? localStorage.getItem("token") ?? undefined : undefined
}

export async function apiGet(path: string, token?: string) {
  const currentToken = authToken(token)
  const res = await fetch(`${apiBase()}${path}`, { headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {} })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function apiPost(path: string, body: any, token?: string) {
  const currentToken = authToken(token)
  const res = await fetch(`${apiBase()}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}) }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function apiPatch(path: string, body: any, token?: string) {
  const currentToken = authToken(token)
  const res = await fetch(`${apiBase()}${path}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}) }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function apiDelete(path: string, token?: string) {
  const currentToken = authToken(token)
  const res = await fetch(`${apiBase()}${path}`, { method: "DELETE", headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {} })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}
