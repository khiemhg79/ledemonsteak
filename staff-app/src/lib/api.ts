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

async function request(input: RequestInfo | URL, init?: RequestInit) {
  try { return await fetch(input, init) }
  catch { throw new Error("Không thể kết nối hệ thống. Vui lòng kiểm tra Internet và thử lại.") }
}

const inflightGets = new Map<string, Promise<any>>()

function handleUnauthorized(res: Response, path: string) {
  if (res.status !== 401 || path === "/api/auth/login" || typeof window === "undefined") return
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.assign("/login")
}

export async function apiGet(path: string, token?: string) {
  const currentToken = authToken(token)
  const cacheKey = `${path}|${currentToken ?? "guest"}`
  const pending = inflightGets.get(cacheKey)
  if (pending) return pending

  const promise = request(`${apiBase()}${path}`, {
    cache: "no-store",
    headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
  }).then(async (res) => {
    handleUnauthorized(res, path)
    if (!res.ok) throw new Error(await readError(res))
    return res.json()
  }).finally(() => inflightGets.delete(cacheKey))

  inflightGets.set(cacheKey, promise)
  return promise
}

export async function apiPost(path: string, body: any, token?: string) {
  const currentToken = authToken(token)
  const res = await request(`${apiBase()}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}) }, body: JSON.stringify(body) })
  handleUnauthorized(res, path)
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function apiPatch(path: string, body: any, token?: string) {
  const currentToken = authToken(token)
  const res = await request(`${apiBase()}${path}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}) }, body: JSON.stringify(body) })
  handleUnauthorized(res, path)
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function apiDelete(path: string, token?: string) {
  const currentToken = authToken(token)
  const res = await request(`${apiBase()}${path}`, { method: "DELETE", headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {} })
  handleUnauthorized(res, path)
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}
