"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import CartDrawer from "@/components/cart/CartDrawer"
import OrderStatus from "@/components/order/OrderStatus"
import { apiGet, apiPost } from "@/lib/api"
import { useAuth } from "@/store/auth"
import { useCart } from "@/store/cart"

const money = (value: number) => value.toLocaleString("vi-VN") + "đ"

type Promo = {
  id: string
  name: string
  code: string
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
  minOrder: number
  maxDiscount?: number | null
  description?: string | null
  isActive: boolean
  startDate: string
  endDate: string
  usageLimit?: number | null
  usageCount?: number
}

function discountLabel(promo: Promo) {
  return promo.discountType === "PERCENTAGE" ? `Giảm ${promo.discountValue}%` : `Giảm ${money(promo.discountValue)}`
}

export default function OrderPage() {
  const tableId = useCart((s) => s.tableId)
  const hydrateCart = useCart((s) => s.hydrate)
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const hydrateAuth = useAuth((s) => s.hydrate)
  const [orders, setOrders] = useState<any[]>([])
  const [promos, setPromos] = useState<Promo[]>([])
  const [promoOpen, setPromoOpen] = useState(true)
  const [promoCode, setPromoCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [previewTotal, setPreviewTotal] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [successOpen, setSuccessOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)

  async function loadOrders(clearMessage = true) {
    setLoading(true)
    if (clearMessage) setMessage("")
    try {
      const query = tableId ? `?tableId=${tableId}` : ""
      setOrders(await apiGet(`/api/orders${query}`))
    } catch (error: any) {
      setMessage(error.message || "Không tải được đơn hiện tại.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    hydrateAuth()
    hydrateCart()
  }, [hydrateAuth, hydrateCart])

  useEffect(() => {
    loadOrders()
    apiGet("/api/promotions").then(setPromos).catch(() => setPromos([]))
  }, [tableId])

  const order = orders[0]
  const activePromos = useMemo(() => {
    const now = Date.now()
    return promos.filter((promo) =>
      promo.isActive &&
      new Date(promo.startDate).getTime() <= now &&
      new Date(promo.endDate).getTime() >= now &&
      (!promo.usageLimit || (promo.usageCount ?? 0) < promo.usageLimit)
    ).slice(0, 5)
  }, [promos])
  const allDone = !!order?.items?.length && order.items.every((item: any) => item.status === "DONE" || item.status === "SERVED")
  const totalAfterDiscount = previewTotal ?? order?.finalAmount ?? order?.totalAmount ?? 0
  const isPaymentRequested = order?.table?.status === "REQUESTING_BILL"

  async function applyPromotion(code: string) {
    if (!order) return
    setMessage("")
    try {
      const result = await apiPost("/api/promotions/apply", { code, orderAmount: order.totalAmount })
      setPromoCode(code)
      setDiscount(result.discount ?? 0)
      setPreviewTotal(result.finalAmount ?? order.totalAmount)
      setMessage(`Đã áp dụng mã ${code}.`)
    } catch (error: any) {
      setMessage(error.message || "Không áp dụng được mã giảm giá.")
    }
  }

  async function checkout() {
    if (!order || paying) return
    setMessage("")
    setPaying(true)
    try {
      const updated = await apiPost(`/api/orders/${order.id}/checkout`, { promoCode: promoCode || undefined })
      setDiscount(updated.discount ?? discount)
      setPreviewTotal(updated.finalAmount)
      setMessage(`Đã gửi yêu cầu thanh toán. Nhân viên sẽ tới xác nhận đơn ${money(updated.finalAmount)}.`)
      setSuccessOpen(true)
      await loadOrders(false)
    } catch (error: any) {
      setMessage(error.message || "Không gửi được yêu cầu thanh toán.")
    } finally {
      setPaying(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#FFF8EE] pb-28 text-[#211715] shadow-2xl shadow-black/10">
      <header className="sticky top-0 z-20 bg-[linear-gradient(100deg,#9B1C1C,#D9491E,#F08A1A)] px-4 py-5 text-white shadow-lg shadow-[#9B1C1C]/20">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black tracking-tight">Le Monde Steak</h1>
          <div className="flex items-center gap-3">
            <p className="max-w-[140px] truncate text-sm font-bold">{user ? `Chào, ${user.name}` : "Khách QR"}</p>
            {user ? (
              <button className="rounded-xl bg-white/95 px-3 py-2 text-sm font-bold text-[#D9491E] shadow-sm" onClick={logout}>-&gt;</button>
            ) : (
              <Link className="rounded-xl bg-white/95 px-3 py-2 text-sm font-bold text-[#D9491E] shadow-sm" href="/login">Đăng nhập</Link>
            )}
          </div>
        </div>
      </header>

      <section className="px-4 py-4">
        {loading && <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#8A7A70] shadow-sm">Đang tải đơn...</div>}
        {!loading && !order && <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#8A7A70] shadow-sm">Chưa có đơn hàng đang hoạt động.</div>}

        {order && (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#F0D7B0]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-black text-[#211715]">Đơn hàng #{order.orderNumber}</h2>
              <span className="text-xs font-semibold text-[#8A7A70]">Bàn {String(order.table?.number ?? "").replace(/^T/i, "")}</span>
            </div>
            {isPaymentRequested && (
              <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                Đã gửi yêu cầu thanh toán. Nhân viên đang xử lý hóa đơn.
              </div>
            )}

            <div className="max-h-[310px] space-y-3 overflow-auto pr-1">
              {order.items.map((item: any) => (
                <article key={item.id} className="rounded-2xl border border-[#F0D7B0] bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="line-clamp-2 text-sm font-black uppercase leading-5 text-[#2A2A2A]">{item.item?.name ?? item.combo?.name}</h2>
                        {item.combo && <span className="rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700">Combo</span>}
                        <OrderStatus status={item.status} />
                      </div>
                      <p className="mt-1 text-sm text-[#6F625C]">{item.quantity}x {money(item.price)}</p>
                    </div>
                    <p className="whitespace-nowrap text-base font-black text-[#211715]">{money(item.price * item.quantity)}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="my-4 border-t border-[#2A2A2A]/40" />

            <div className="rounded-2xl border border-dashed border-[#F08A1A] bg-[#FFF8EE]">
              <button className="flex w-full items-center justify-between px-4 py-3" onClick={() => setPromoOpen((value) => !value)}>
                <span className="text-sm font-bold text-[#6F625C]">◇ Chọn mã giảm giá</span>
                <span className="text-xs font-black text-[#D9491E]">{promoOpen ? "Đóng" : "Mở"}</span>
              </button>
            </div>

            {promoOpen && (
              <div className="mt-3 space-y-2">
                {activePromos.map((promo) => (
                  <article key={promo.id} className={`rounded-2xl border bg-white p-3 shadow-sm ${promoCode === promo.code ? "border-[#D9491E]" : "border-[#F0D7B0]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-[#D9491E]">{promo.name}</h3>
                          <span className="rounded-md bg-[#FBE7C9] px-2 py-1 text-xs font-bold text-[#B95A22]">{discountLabel(promo)}</span>
                        </div>
                        <div className="mt-2 inline-flex items-center rounded-md border border-dashed border-[#F08A1A] bg-[#FFF8EE] px-2 py-1 font-mono text-xs font-black tracking-wide text-[#B93A16]">Mã: {promo.code}</div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6F625C]">{promo.description || `Áp dụng cho đơn từ ${money(promo.minOrder)}.`}</p>
                        {(order?.totalAmount ?? 0) < promo.minOrder && (
                          <p className="mt-1 text-xs font-bold text-amber-600">Cần thêm {money(promo.minOrder - (order?.totalAmount ?? 0))} để sử dụng</p>
                        )}
                      </div>
                      <button className="shrink-0 text-sm font-black text-[#D9491E] disabled:text-[#B7A79E]" disabled={(order?.totalAmount ?? 0) < promo.minOrder} onClick={() => applyPromotion(promo.code)}>
                        {promoCode === promo.code ? "Đã áp dụng" : (order?.totalAmount ?? 0) < promo.minOrder ? "Chưa đủ" : "Áp dụng"}
                      </button>
                    </div>
                  </article>
                ))}
                {activePromos.length === 0 && <div className="rounded-2xl border border-[#F0D7B0] bg-white p-3 text-sm text-[#8A7A70]">Hiện chưa có mã giảm giá đang hoạt động.</div>}
              </div>
            )}

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-[#6F625C]"><span>Tạm tính</span><span className="font-black text-[#211715]">{money(order.totalAmount)}</span></div>
              <div className="flex justify-between text-sm text-[#6F625C]"><span>Giảm giá</span><span className="font-black text-[#D9491E]">-{money(discount || order.discount || 0)}</span></div>
              <div className="border-t border-[#F0D7B0] pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-[#211715]">Tổng cộng</span>
                  <span className="text-2xl font-black text-[#D9491E]">{money(totalAfterDiscount)}</span>
                </div>
              </div>
              <p className="text-sm text-[#8A7A70]">{allDone ? "◷ Tất cả món đã hoàn thành" : "◷ Bếp đang xử lý món của bạn"}</p>
            </div>

            {message && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">{message}</p>}
            <button
              className="mt-4 h-12 w-full rounded-xl bg-[#F34208] font-black text-white shadow-lg shadow-[#F34208]/20 disabled:bg-[#D9A38F]"
              onClick={checkout}
              disabled={paying || isPaymentRequested}
            >
              {paying ? "Đang gửi yêu cầu..." : isPaymentRequested ? "Đã yêu cầu thanh toán" : "Thanh toán"}
            </button>
          </div>
        )}
      </section>

      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-black text-[#211715]">Đã gửi yêu cầu thanh toán</h2>
            <p className="mt-2 text-sm leading-6 text-[#6F625C]">Nhân viên sẽ kiểm tra hóa đơn và xác nhận thanh toán tại bàn của bạn.</p>
            <button className="mt-5 h-11 w-full rounded-xl bg-[#F34208] font-black text-white" onClick={() => setSuccessOpen(false)}>Đóng</button>
          </div>
        </div>
      )}

      <CartDrawer />
      <nav className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-md -translate-x-1/2 grid-cols-5 items-center border-t border-[#F0D7B0] bg-white px-3 pb-3 pt-2 shadow-2xl shadow-black/10">
        <Link className="text-center text-[11px] font-semibold text-[#6F625C]" href="/">Món ăn</Link>
        <Link className="text-center text-[11px] font-bold text-[#D9491E]" href="/order">Đơn hiện tại</Link>
        <Link className="text-center text-[11px] font-semibold text-[#6F625C]" href="/history">Lịch sử</Link>
        <Link className="text-center text-[11px] font-semibold text-[#6F625C]" href="/account">Người dùng</Link>
        <button className="pointer-events-none rounded-2xl bg-[#D9491E] px-2 py-3 text-center text-[11px] font-black text-white shadow-lg shadow-[#D9491E]/30">0đ</button>
      </nav>
    </main>
  )
}
