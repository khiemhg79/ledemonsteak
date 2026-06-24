"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import OrderCard from "@/components/orders/OrderCard"
import { apiGet, apiPatch } from "@/lib/api"
import { useAuth } from "@/store/auth"

type ViewMode = "orders" | "items"
type ItemFilter = "all" | "waiting" | "preparing" | "done"

const money = (value: number) => value.toLocaleString("vi-VN") + "đ"
const nextStatus: Record<string, string> = { WAITING: "PREPARING", PREPARING: "DONE", DONE: "SERVED" }
const actionLabel: Record<string, string> = { WAITING: "▶ Bắt đầu", PREPARING: "✓ Xong món", DONE: "✓ Đã phục vụ" }
const statusLabel: Record<string, string> = { WAITING: "Chờ bắt đầu", PREPARING: "Đang chế biến", DONE: "Đã xong món", SERVED: "Đã phục vụ" }
const itemCardStyle: Record<string, string> = {
  WAITING: "border-[#F7C838] bg-[#FFF8C9]",
  PREPARING: "border-[#78AEEF] bg-[#DCEBFF]",
  DONE: "border-[#65D89A] bg-[#D9F8E7]",
  SERVED: "border-[#65D89A] bg-[#D9F8E7]",
}
const itemButtonStyle: Record<string, string> = {
  WAITING: "bg-[#2F80ED] text-white",
  PREPARING: "bg-[#12B76A] text-white",
  DONE: "bg-[#667085] text-white",
}

export default function OrdersPage() {
  const router = useRouter()
  const logout = useAuth((state) => state.logout)
  const user = useAuth((state) => state.user)
  const [orders, setOrders] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("orders")
  const [itemFilter, setItemFilter] = useState<ItemFilter>("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const loadingRef = useRef(false)

  async function loadOrders(silent = false) {
    if (loadingRef.current) return
    loadingRef.current = true
    if (!silent) setLoading(true)
    setError("")
    try {
      setOrders(await apiGet("/api/orders?view=staff"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được đơn hàng.")
    } finally {
      loadingRef.current = false
      if (!silent) setLoading(false)
    }
  }

  async function updateItem(orderId: string, itemId: string, status: string) {
    setError("")
    try {
      await apiPatch(`/api/orders/${orderId}/items`, { itemId, status })
      await loadOrders(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không cập nhật được trạng thái món ăn.")
    }
  }

  useEffect(() => {
    loadOrders()
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") loadOrders(true)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [])

  const flatItems = useMemo(() => orders.flatMap((order) => order.items.map((item: any) => ({ ...item, order }))), [orders])
  const filteredItems = useMemo(() => flatItems.filter((item: any) => {
    if (itemFilter === "waiting") return item.status === "WAITING"
    if (itemFilter === "preparing") return item.status === "PREPARING"
    if (itemFilter === "done") return item.status === "DONE" || item.status === "SERVED"
    return true
  }), [flatItems, itemFilter])

  return (
    <main className="min-h-screen bg-white">
      <header className="mx-6 mt-2 h-16 bg-[linear-gradient(90deg,#FF7A2A,#FF3D00)] px-16 text-white shadow-md">
        <div className="flex h-full items-center justify-between">
          <h1 className="text-xl font-black">Le Monde Steak</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold">Xin chào, {user?.name ?? "staff"}</span>
            <button className="rounded-lg bg-white px-5 py-2 text-sm font-black text-[#E94713]" onClick={() => { logout(); router.push("/login") }}>Đăng xuất</button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-8 py-6">
        <div className="mb-5 flex gap-2">
          <Link href="/tables" className="rounded-md bg-[#E8ECEF] px-4 py-3 text-sm font-bold text-[#57606A] shadow-sm">Quản lý Bàn</Link>
          <Link href="/orders" className="rounded-md bg-[#FF4A12] px-4 py-3 text-sm font-bold text-white shadow-sm">Theo dõi Đơn hàng</Link>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex gap-2"><button className={`rounded-md px-4 py-3 text-sm font-black shadow-sm ${viewMode === "orders" ? "bg-[#A855F7] text-white" : "bg-[#E8ECEF] text-[#57606A]"}`} onClick={() => setViewMode("orders")}>Xem theo Đơn hàng</button>
          <button className={`rounded-md px-4 py-3 text-sm font-black shadow-sm ${viewMode === "items" ? "bg-[#A855F7] text-white" : "bg-[#E8ECEF] text-[#57606A]"}`} onClick={() => setViewMode("items")}>Xem theo Món ăn</button></div>
          <button className="rounded-md bg-[#FF4A12] px-4 py-3 text-sm font-black text-white" onClick={() => loadOrders()}>Làm mới</button>
        </div>

        {viewMode === "items" && <div className="mb-5 flex flex-wrap gap-2">
          {([
            ["all", "Tất cả", flatItems.length],
            ["waiting", "Chờ làm", flatItems.filter((item: any) => item.status === "WAITING").length],
            ["preparing", "Đang làm", flatItems.filter((item: any) => item.status === "PREPARING").length],
            ["done", "Đã xong", flatItems.filter((item: any) => item.status === "DONE" || item.status === "SERVED").length],
          ] as [ItemFilter, string, number][]).map(([value, label, count]) => <button key={value} className={`rounded-md border px-4 py-2 text-sm font-black ${itemFilter === value ? "border-[#111827] bg-[#111827] text-white" : "border-[#D0D5DD] bg-white text-[#475467]"}`} onClick={() => setItemFilter(value)}>{label} ({count})</button>)}
        </div>}

        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {loading && <div className="rounded-md bg-white p-6 text-center text-sm text-gray-500">Đang tải đơn...</div>}

        {viewMode === "orders" ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {orders.map((order) => <OrderCard key={order.id} order={order} onChanged={() => loadOrders(true)} onError={setError} />)}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-4">
            {filteredItems.map((item: any) => {
              const label = item.item?.name ?? item.combo?.name
              const next = nextStatus[item.status]
              return (
                <article key={item.id} className={`rounded-md border-2 p-4 shadow-md shadow-black/5 ${itemCardStyle[item.status] ?? "border-[#D9DEE6] bg-white"}`}>
                  <p className="text-sm font-bold text-[#536173]">Bàn {item.order.table?.number}</p>
                  <p className="mt-1 text-xs text-[#667085]">{new Date(item.order.createdAt).toLocaleTimeString("vi-VN")} {new Date(item.order.createdAt).toLocaleDateString("vi-VN")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2"><h3 className="line-clamp-2 font-black text-[#111827]">{item.quantity}x {label}</h3>{item.combo && <span className="rounded-full bg-[#DDF3FF] px-2 py-1 text-[10px] font-bold text-[#1683B8]">Combo</span>}</div>
                  <p className="mt-2 text-sm font-bold text-[#536173]">{money(item.price * item.quantity)}</p>
                  <p className="mt-2 text-xs font-semibold text-[#667085]">Trạng thái: {statusLabel[item.status] ?? item.status}</p>
                  {next ? <button className={`mt-4 w-full rounded-md px-3 py-2 text-xs font-black ${itemButtonStyle[item.status] ?? "bg-[#2F80ED] text-white"}`} onClick={() => updateItem(item.order.id, item.id, next)}>{actionLabel[item.status]}</button> : <span className="mt-4 inline-block w-full rounded-md bg-[#667085] px-3 py-2 text-center text-xs font-black text-white">✓ Đã phục vụ</span>}
                </article>
              )
            })}
          </div>
        )}

        {!loading && !error && viewMode === "items" && filteredItems.length === 0 && <div className="rounded-md border border-[#EAECF0] bg-white p-6 text-center text-sm text-[#667085]">Chưa có món phù hợp với trạng thái đã chọn.</div>}

        {!loading && !error && viewMode === "orders" && orders.length === 0 && <div className="rounded-md bg-white p-6 text-center text-sm text-gray-500">Chưa có đơn cần xử lý.</div>}
      </section>
    </main>
  )
}
