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

async function ensureOk(res: Response, hadToken: boolean) {
  if (res.ok) return
  const error = await readError(res)
  if (res.status === 401 && hadToken && typeof window !== "undefined") {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.replace("/login?expired=1")
  }
  throw new Error(error)
}

function authToken(token?: string) {
  if (token) return token
  return typeof window !== "undefined" ? localStorage.getItem("token") ?? undefined : undefined
}

const inflightGets = new Map<string, Promise<any>>()

export async function apiGet(path: string, token?: string) {
  const currentToken = authToken(token)
  const cacheKey = `${path}|${currentToken ?? "guest"}`
  const pending = inflightGets.get(cacheKey)
  if (pending) return pending

  const promise = fetch(`${apiBase()}${path}`, {
    cache: "no-store",
    headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
  }).then(async (res) => {
    await ensureOk(res, !!currentToken)
    return res.json()
  }).finally(() => inflightGets.delete(cacheKey))

  inflightGets.set(cacheKey, promise)
  return promise
}

export async function apiPost(path: string, body: any, token?: string) {
  const currentToken = authToken(token)
  const res = await fetch(`${apiBase()}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}) }, body: JSON.stringify(body) })
  await ensureOk(res, !!currentToken)
  return res.json()
}

export async function apiPatch(path: string, body: any, token?: string) {
  const currentToken = authToken(token)
  const res = await fetch(`${apiBase()}${path}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}) }, body: JSON.stringify(body) })
  await ensureOk(res, !!currentToken)
  return res.json()
}

export async function apiDelete(path: string, token?: string) {
  const currentToken = authToken(token)
  const res = await fetch(`${apiBase()}${path}`, { method: "DELETE", headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {} })
  await ensureOk(res, !!currentToken)
  return res.json()
}
