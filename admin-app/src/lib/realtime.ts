import { createClient } from "@supabase/supabase-js"
import { apiBase } from "@/lib/api"

const tableScopes: Record<string, string[]> = {
  customer: ["categories", "items", "combos", "comboitems", "orders", "orderdetails", "invoices", "payments", "promotions", "customerpromotions", "tables"],
  staff: ["tables", "orders", "orderdetails", "invoices", "payments"],
  admin: ["categories", "items", "combos", "comboitems", "orders", "orderdetails", "invoices", "payments", "promotions", "customerpromotions", "tables", "users", "customers", "roles"],
}

const REALTIME_REFRESH_DEBOUNCE_MS = 700

function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  return Boolean(url && key && !url.includes("YOUR_PROJECT_REF") && !key.includes("YOUR_SUPABASE_ANON_KEY"))
}

function subscribeSse(scope: string, onUpdate: () => void) {
  if (typeof window === "undefined" || typeof EventSource === "undefined") return () => {}

  const source = new EventSource(`${apiBase()}/api/realtime?scope=${encodeURIComponent(scope)}`)
  let debounceTimer: number | undefined

  source.addEventListener("update", () => {
    if (debounceTimer) window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => {
      debounceTimer = undefined
      onUpdate()
    }, REALTIME_REFRESH_DEBOUNCE_MS)
  })

  return () => {
    if (debounceTimer) window.clearTimeout(debounceTimer)
    source.close()
  }
}

export function subscribeRealtime(scope: string, onUpdate: () => void) {
  if (typeof window === "undefined") return () => {}
  if (!hasSupabaseEnv()) return subscribeSse(scope, onUpdate)

  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const channel = client.channel(`le-monde-${scope}`)
  const tables = tableScopes[scope] ?? tableScopes.admin
  let debounceTimer: number | undefined

  const notify = () => {
    if (debounceTimer) window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => {
      debounceTimer = undefined
      onUpdate()
    }, REALTIME_REFRESH_DEBOUNCE_MS)
  }

  tables.forEach((table) => {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, notify)
  })

  channel.subscribe((status) => {
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      console.warn("Supabase realtime unavailable. Check env and table replication.")
    }
  })

  return () => {
    if (debounceTimer) window.clearTimeout(debounceTimer)
    client.removeChannel(channel)
  }
}
