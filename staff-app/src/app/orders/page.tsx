"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import OrderCard from "@/components/orders/OrderCard"
import { apiGet, apiPatch } from "@/lib/api"
import { useAuth } from "@/store/auth"

type ViewMode = "orders" | "items"

const money = (value: number) => value.toLocaleString("vi-VN") + "đ"

export default function OrdersPage() {
  const router = useRouter()
  const logout = useAuth((state) => state.logout)
  const [orders, setOrders] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("orders")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function loadOrders() {
    setLoading(true)
    setError("")
    try {
      setOrders(await apiGet("/api/orders"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được đơn hàng.")
    } finally {
      setLoading(false)
    }
  }

  async function updateItem(orderId: string, itemId: string, status: string) {
    await apiPatch(`/api/orders/${orderId}/items`, { itemId, status })
    loadOrders()
  }

  useEffect(() => { loadOrders() }, [])

  const flatItems = useMemo(() => orders.flatMap((order) => order.items.map((item: any) => ({ ...item, order }))), [orders])

  return (
    <main className="min-h-screen bg-white">
      <header className="mx-6 mt-2 h-16 bg-[linear-gradient(90deg,#FF7A2A,#FF3D00)] px-16 text-white shadow-md">
        <div className="flex h-full items-center justify-between">
          <h1 className="text-xl font-black">Le Monde Steak</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold">Xin chào, staff</span>
            <button className="rounded-lg bg-white px-5 py-2 text-sm font-black text-[#E94713]" onClick={() => { logout(); router.push("/login") }}>Đăng xuất</button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-8 py-6">
        <div className="mb-5 flex gap-2">
          <Link href="/tables" className="rounded-md bg-[#E8ECEF] px-4 py-3 text-sm font-bold text-[#57606A] shadow-sm">Quản lý Bàn</Link>
          <Link href="/orders" className="rounded-md bg-[#FF4A12] px-4 py-3 text-sm font-bold text-white shadow-sm">Theo dõi Đơn hàng</Link>
        </div>

        <div className="mb-6 flex gap-2">
          <button className={`rounded-md px-4 py-3 text-sm font-black shadow-sm ${viewMode === "orders" ? "bg-[#A855F7] text-white" : "bg-[#E8ECEF] text-[#57606A]"}`} onClick={() => setViewMode("orders")}>Xem theo Đơn hàng</button>
          <button className={`rounded-md px-4 py-3 text-sm font-black shadow-sm ${viewMode === "items" ? "bg-[#A855F7] text-white" : "bg-[#E8ECEF] text-[#57606A]"}`} onClick={() => setViewMode("items")}>Xem theo Món ăn</button>
        </div>

        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {loading && <div className="rounded-md bg-white p-6 text-center text-sm text-gray-500">Đang tải đơn...</div>}

        {viewMode === "orders" ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {orders.map((order) => <OrderCard key={order.id} order={order} onChanged={loadOrders} />)}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-4">
            {flatItems.map((item: any) => {
              const label = item.item?.name ?? item.combo?.name
              const next = item.status === "WAITING" ? "PREPARING" : item.status === "PREPARING" ? "DONE" : item.status === "DONE" ? "SERVED" : null
              return (
                <article key={item.id} className="rounded-md border border-[#D9DEE6] bg-white p-4 shadow-md shadow-black/5">
                  <p className="text-sm font-bold text-[#536173]">Bàn {item.order.table?.number}</p>
                  <h3 className="mt-1 line-clamp-2 font-black text-[#111827]">{label}</h3>
                  <p className="mt-2 text-sm text-[#536173]">{money(item.price * item.quantity)}</p>
                  {next && <button className="mt-4 rounded-md bg-[#2F80ED] px-3 py-2 text-xs font-black text-white" onClick={() => updateItem(item.order.id, item.id, next)}>Cập nhật</button>}
                </article>
              )
            })}
          </div>
        )}

        {!loading && !error && orders.length === 0 && <div className="rounded-md bg-white p-6 text-center text-sm text-gray-500">Chưa có đơn cần xử lý.</div>}
      </section>
    </main>
  )
}
