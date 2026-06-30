export function apiBase() {
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

const REQUEST_TIMEOUT_MS = 20_000

async function request(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Hệ thống phản hồi quá lâu. Vui lòng thử lại.")
    }
    throw new Error("Không thể kết nối hệ thống. Vui lòng kiểm tra Internet và thử lại.")
  } finally {
    window.clearTimeout(timeout)
  }
}

function authToken(token?: string) {
  if (token) return token
  return typeof window !== "undefined" ? localStorage.getItem("token") ?? undefined : undefined
}

const responseCache = new Map<string, { expiresAt: number; data: any }>()
const inflightGets = new Map<string, Promise<any>>()

function cacheDuration(path: string) {
  if (path === "/api/admin/reports") return 10_000
  if (path === "/api/menu") return 5_000
  if (path === "/api/admin/users") return 5_000
  if (path === "/api/promotions") return 5_000
  if (path === "/api/tables") return 5_000
  return 0
}

function clearCache() {
  responseCache.clear()
}

export async function apiGet(path: string, token?: string, options?: { force?: boolean }) {
  const currentToken = authToken(token)
  const cacheKey = `${path}|${currentToken ?? "guest"}`
  const maxAge = cacheDuration(path)
  const cached = responseCache.get(cacheKey)
  if (!options?.force && cached && cached.expiresAt > Date.now()) return cached.data

  const pending = inflightGets.get(cacheKey)
  if (pending) return pending

  const promise = request(`${apiBase()}${path}`, {
    cache: maxAge ? "default" : "no-store",
    headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
  }).then(async (res) => {
    await ensureOk(res, !!currentToken)
    const data = await res.json()
    if (maxAge) responseCache.set(cacheKey, { expiresAt: Date.now() + maxAge, data })
    return data
  }).finally(() => inflightGets.delete(cacheKey))

  inflightGets.set(cacheKey, promise)
  return promise
}

export async function apiPost(path: string, body: any, token?: string) {
  const currentToken = authToken(token)
  const res = await request(`${apiBase()}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}) }, body: JSON.stringify(body) })
  await ensureOk(res, !!currentToken)
  clearCache()
  return res.json()
}

export async function apiPatch(path: string, body: any, token?: string) {
  const currentToken = authToken(token)
  const res = await request(`${apiBase()}${path}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}) }, body: JSON.stringify(body) })
  await ensureOk(res, !!currentToken)
  clearCache()
  return res.json()
}

export async function apiDelete(path: string, token?: string) {
  const currentToken = authToken(token)
  const res = await request(`${apiBase()}${path}`, { method: "DELETE", headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {} })
  await ensureOk(res, !!currentToken)
  clearCache()
  return res.json()
}
