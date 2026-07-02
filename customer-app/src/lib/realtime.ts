import { createClient } from "@supabase/supabase-js"

const tableScopes: Record<string, string[]> = {
  customer: ["categories", "items", "combos", "comboitems", "orders", "orderdetails", "invoices", "payments", "promotions", "customerpromotions", "tables"],
  staff: ["tables", "orders", "orderdetails", "invoices", "payments"],
  admin: ["categories", "items", "combos", "comboitems", "orders", "orderdetails", "invoices", "payments", "promotions", "customerpromotions", "tables", "users", "customers", "roles"],
}

const REALTIME_REFRESH_DEBOUNCE_MS = 40
const FAST_POLL_MS = 900

let sharedClient: ReturnType<typeof createClient> | null = null

function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  return Boolean(url && key && !url.includes("YOUR_PROJECT_REF") && !key.includes("YOUR_SUPABASE_ANON_KEY"))
}

function getClient() {
  if (!hasSupabaseEnv()) return null
  if (!sharedClient) {
    sharedClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    })
  }
  return sharedClient
}

export function subscribeRealtime(scope: string, onUpdate: () => void | Promise<void>, pollMs = FAST_POLL_MS) {
  if (typeof window === "undefined") return () => {}

  const client = getClient()
  const tables = tableScopes[scope] ?? tableScopes.customer
  let debounceTimer: number | undefined
  let pollTimer: number | undefined
  let channel: ReturnType<NonNullable<typeof client>["channel"]> | null = null
  let stopped = false

  const notify = () => {
    if (stopped) return
    if (debounceTimer) window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => {
      debounceTimer = undefined
      void onUpdate()
    }, REALTIME_REFRESH_DEBOUNCE_MS)
  }

  const onFocus = () => notify()
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") notify()
  }

  window.addEventListener("focus", onFocus)
  document.addEventListener("visibilitychange", onVisibilityChange)
  pollTimer = window.setInterval(notify, pollMs)

  if (client) {
    channel = client.channel(`le-monde-${scope}-${crypto.randomUUID()}`)

    tables.forEach((table) => {
      channel?.on("postgres_changes", { event: "*", schema: "public", table }, notify)
    })

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        console.warn("Supabase realtime unavailable. Fast polling fallback is active.")
      }
    })
  } else {
    console.warn("Missing Supabase realtime env. Fast polling fallback is active.")
  }

  return () => {
    stopped = true
    if (debounceTimer) window.clearTimeout(debounceTimer)
    if (pollTimer) window.clearInterval(pollTimer)
    window.removeEventListener("focus", onFocus)
    document.removeEventListener("visibilitychange", onVisibilityChange)
    if (client && channel) {
      void client.removeChannel(channel)
    }
  }
}
