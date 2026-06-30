import { apiBase } from "@/lib/api"

export function subscribeRealtime(scope: string, onUpdate: () => void) {
  if (typeof window === "undefined" || typeof EventSource === "undefined") return () => {}

  const source = new EventSource(`${apiBase()}/api/realtime?scope=${encodeURIComponent(scope)}`)
  let debounceTimer: number | undefined

  source.addEventListener("update", () => {
    if (debounceTimer) window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(onUpdate, 120)
  })

  return () => {
    if (debounceTimer) window.clearTimeout(debounceTimer)
    source.close()
  }
}
