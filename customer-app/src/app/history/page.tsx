"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import CustomerBottomNav from "@/components/layout/CustomerBottomNav"
import { apiGet } from "@/lib/api"
import { subscribeRealtime } from "@/lib/realtime"
import { useAuth } from "@/store/auth"
import { useCart } from "@/store/cart"

type OrderItem = {
  id: string
  quantity: number
  price: number
  item?: { name: string } | null
  combo?: { name: string } | null
}

type Order = {
  id: string
  orderNumber?: number | string | null
  status: string
  finalAmount: number
  totalAmount?: number
  discount?: number
  createdAt: string
  table?: { number?: string | null } | null
  items?: OrderItem[]
}

const money = (value: number) => Number(value || 0).toLocaleString("vi-VN") + "đ"

function orderCode(order: Order) {
  return order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(0, 6).toUpperCase()}`
}

function orderDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN")
}

function orderTime(value: string) {
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

function statusLabel(status: string) {
  if (status === "COMPLETED") return "Hoàn thành"
  if (status === "CANCELLED") return "Đã huỷ"
  if (status === "PAID") return "Đã thanh toán"
  if (status === "REQUESTING_BILL") return "Chờ thanh toán"
  return "Đang xử lý"
}

function statusClass(status: string) {
  if (status === "COMPLETED" || status === "PAID") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "CANCELLED") return "border-pink-200 bg-pink-50 text-pink-700"
  return "border-amber-200 bg-amber-50 text-amber-700"
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path d="M10 7V6C10 4.9 10.9 4 12 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H12C10.9 20 10 19.1 10 18V17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 12H4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7 9L4 12L7 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M7 3V7M17 3V7M4 9H20M6 5H18C19.1 5 20 5.9 20 7V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V7C4 5.9 4.9 5 6 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HistoryPage() {
  const tableId = useCart((s) => s.tableId)
  const hydrateCart = useCart((s) => s.hydrate)
  const hydrateAuth = useAuth((s) => s.hydrate)
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    hydrateAuth()
    hydrateCart()
  }, [hydrateAuth, hydrateCart])

  useEffect(() => {
    if (!tableId) {
      setOrders([])
      setLoading(false)
      return
    }

    const load = (force = false, silent = false) => {
      if (!silent) setLoading(true)
      setError("")
      apiGet(`/api/orders?tableId=${tableId}&status=ALL`, undefined, { force, timeoutMs: 60_000 })
        .then(setOrders)
        .catch((err) => {
          setOrders([])
          setError(err.message || "Không tải được lịch sử đặt món.")
        })
        .finally(() => setLoading(false))
    }

    load()
    const refresh = () => {
      if (document.visibilityState === "visible") load(false, true)
    }
    const unsubscribeRealtime = subscribeRealtime("customer", refresh)
    window.addEventListener("lemonde:orders-changed", refresh)

    return () => {
      unsubscribeRealtime()
      window.removeEventListener("lemonde:orders-changed", refresh)
    }
  }, [tableId])

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#FFF9EA] pb-24 text-[#211715] shadow-2xl shadow-black/10">
      <header className="sticky top-0 z-20 bg-[linear-gradient(100deg,#F34208,#F08A1A)] px-4 pb-4 pt-4 text-white shadow-lg shadow-[#F34208]/20">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black tracking-tight">Le Monde Steak</h1>
          {user ? (
            <button className="flex h-10 w-12 items-center justify-center rounded-xl bg-white text-[#F34208] shadow-sm" onClick={logout} aria-label="Đăng xuất">
              <LogoutIcon />
            </button>
          ) : (
            <Link className="rounded-xl bg-white px-3 py-2 text-sm font-black text-[#F34208] shadow-sm" href="/login">
              Đăng nhập
            </Link>
          )}
        </div>
      </header>

      <section className="px-4 pb-5 pt-0">
        <h2 className="-mt-1 text-[22px] font-black leading-tight text-[#181818]">Lịch sử đặt món</h2>

        <div className="mt-4 space-y-4">
          {loading && (
            <div className="rounded-2xl border border-[#F0D7B0] bg-white p-6 text-center text-sm font-semibold text-[#6F625C] shadow-sm">
              Đang tải lịch sử...
            </div>
          )}

          {!loading && !tableId && (
            <div className="rounded-2xl border border-[#F0D7B0] bg-white p-6 text-center text-sm font-semibold text-[#6F625C] shadow-sm">
              Bạn cần quét mã QR tại bàn để xem lịch sử đặt món.
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {!loading && tableId && !error && orders.length === 0 && (
            <div className="rounded-2xl border border-[#F0D7B0] bg-white p-6 text-center text-sm font-semibold text-[#6F625C] shadow-sm">
              Chưa có lịch sử đặt món.
            </div>
          )}

          {!loading && orders.map((order) => (
            <button
              key={order.id}
              className="w-full rounded-2xl border border-[#F0D7B0] bg-white px-4 py-4 text-left shadow-sm transition active:scale-[0.99]"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-base font-black text-[#1B1D2B]">Đơn {orderCode(order)}</p>
                <p className="shrink-0 text-lg font-black text-[#D93612] underline decoration-[#D93612]/40 underline-offset-2">
                  {money(order.finalAmount)}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-3 text-xs font-semibold text-[#7A7F88]">
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon />
                    {orderDate(order.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon />
                    {orderTime(order.createdAt)}
                  </span>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${statusClass(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {selectedOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-5 backdrop-blur-[3px]" onClick={() => setSelectedOrder(null)}>
          <section className="w-full max-w-[340px] rounded-[18px] bg-[#FFFDF8] px-5 pb-5 pt-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-black text-[#161B2D]">Chi tiết đơn {orderCode(selectedOrder)}</h3>
              <button className="-mt-1 text-2xl leading-none text-[#A3A5AC]" onClick={() => setSelectedOrder(null)} aria-label="Đóng">
                ×
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm font-semibold text-[#6F737B]">
              <CalendarIcon />
              <span>{orderTime(selectedOrder.createdAt)} {orderDate(selectedOrder.createdAt)}</span>
            </div>

            <div className="mt-5 rounded-xl border border-[#F0D7B0] bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#6F625C]">Tổng tiền:</span>
                <span className="text-lg font-black text-[#D93612]">{money(selectedOrder.finalAmount)}</span>
              </div>
              {Number(selectedOrder.discount || 0) > 0 && (
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-[#6F625C]">Giảm giá:</span>
                  <span className="font-black text-[#D93612]">-{money(Number(selectedOrder.discount))}</span>
                </div>
              )}
            </div>

            {!!selectedOrder.items?.length && (
              <div className="mt-3 max-h-40 space-y-2 overflow-auto rounded-xl border border-[#F4E5CF] bg-white p-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#211715]">{item.item?.name || item.combo?.name || "Món ăn"}</p>
                      <p className="text-xs font-semibold text-[#7A7F88]">Số lượng: {item.quantity}</p>
                    </div>
                    <p className="shrink-0 font-black text-[#D93612]">{money(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            )}

            <button className="mt-4 h-12 w-full rounded-xl bg-[#F34208] text-sm font-black text-white shadow-lg shadow-[#F34208]/20 transition active:scale-[0.99]" onClick={() => setSelectedOrder(null)}>
              Đóng
            </button>
          </section>
        </div>
      )}

      <CustomerBottomNav active="history" />
    </main>
  )
}
