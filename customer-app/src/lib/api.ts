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

async function request(input: RequestInfo | URL, init?: RequestInit) {
  try { return await fetch(input, init) }
  catch { throw new Error("Không thể kết nối hệ thống. Vui lòng kiểm tra Internet và thử lại.") }
}

export async function apiGet(path: string, token?: string) {
  const res = await request(`${apiBase()}${path}`, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function apiPost(path: string, body: any, token?: string) {
  const res = await request(`${apiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function apiPatch(path: string, body: any, token?: string) {
  const res = await request(`${apiBase()}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function apiDelete(path: string, token?: string) {
  const res = await request(`${apiBase()}${path}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}
