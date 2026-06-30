"use client"

import { useEffect, useState } from "react"
import { apiGet } from "@/lib/api"
import { subscribeRealtime } from "@/lib/realtime"
import { useCart } from "@/store/cart"

const money = (value: number) => value.toLocaleString("vi-VN") + "đ"

export default function HistoryPage() {
  const tableId = useCart((s) => s.tableId)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    if (!tableId) { setOrders([]); return }
    const load = (force = false) => apiGet(`/api/orders?tableId=${tableId}&status=ALL`, undefined, { force }).then(setOrders).catch(() => setOrders([]))
    load()
    const refresh = () => {
      if (document.visibilityState === "visible") load(true)
    }
    const unsubscribe = subscribeRealtime("customer", refresh)
    return () => {
      unsubscribe()
    }
  }, [tableId])

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-xl font-bold text-gray-900">Lịch sử đặt món</h1>
      <div className="mt-4 space-y-3">
        {orders.length === 0 && <div className="rounded-lg bg-white p-6 text-center text-sm text-gray-500">Chưa có lịch sử đặt món.</div>}
        {orders.map((order) => (
          <div key={order.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex justify-between">
              <p className="font-semibold text-gray-900">Đơn #{order.orderNumber}</p>
              <p className="font-bold text-[#8B1A1A]">{money(order.finalAmount)}</p>
            </div>
            <p className="mt-1 text-sm text-gray-500">Bàn {order.table?.number} - {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
