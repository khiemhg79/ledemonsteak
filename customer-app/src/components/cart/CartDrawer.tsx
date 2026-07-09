"use client"

import { useEffect, useMemo, useState } from "react"
import VoucherList, { Voucher } from "@/components/promotions/VoucherList"
import { ApiError, apiGet, apiPost } from "@/lib/api"
import { subscribeRealtime } from "@/lib/realtime"
import { useAuth } from "@/store/auth"
import { useCart } from "@/store/cart"

const money = (value: number) => Number(value || 0).toLocaleString("vi-VN") + "đ"

function calculateVoucher(voucher: Voucher, amount: number) {
  const now = Date.now()
  const startAt = new Date(voucher.startDate).getTime()
  const endAt = new Date(voucher.endDate).getTime()
  const minOrder = Number(voucher.minOrder ?? 0)
  const discountValue = Number(voucher.discountValue ?? 0)
  const maxDiscount = voucher.maxDiscount == null ? null : Number(voucher.maxDiscount)

  if (Number.isFinite(startAt) && startAt > now) return null
  if (Number.isFinite(endAt) && endAt < now) return null
  if (amount < minOrder) return null

  const rawDiscount = voucher.discountType === "PERCENTAGE"
    ? amount * discountValue / 100
    : discountValue
  const cappedDiscount = maxDiscount == null || !Number.isFinite(maxDiscount)
    ? rawDiscount
    : Math.min(rawDiscount, maxDiscount)
  const discount = Math.max(0, Math.min(amount, Math.floor(cappedDiscount)))

  return { discount, finalAmount: amount - discount }
}

export default function CartDrawer() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [successOrder, setSuccessOrder] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [promoOpen, setPromoOpen] = useState(false)
  const [promos, setPromos] = useState<Voucher[]>([])
  const [promoCode, setPromoCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [finalAmount, setFinalAmount] = useState<number | null>(null)
  const { items, tableId, qrToken, updateQty, removeItem, clearCart, total } = useCart()
  const user = useAuth((s) => s.user)
  const token = useAuth((s) => s.token)
  const subtotal = total()

  const cartTotal = useMemo(() => finalAmount ?? subtotal, [finalAmount, subtotal])

  useEffect(() => {
    if (!open || !user) {
      setPromos([])
      return
    }

    const load = (force = false) => apiGet("/api/promotions", token ?? undefined, { force, timeoutMs: 60_000 })
      .then(setPromos)
      .catch(() => setPromos([]))

    load()
    const unsubscribe = subscribeRealtime("customer", () => {
      if (document.visibilityState === "visible") load(false)
    })

    return () => unsubscribe()
  }, [open, user?.id, token])

  useEffect(() => {
    if (!promoCode || subtotal <= 0) {
      setDiscount(0)
      setFinalAmount(null)
      return
    }

    const voucher = promos.find((promo) => promo.code === promoCode || promo.id === promoCode)
    const calculated = voucher ? calculateVoucher(voucher, subtotal) : null

    if (!voucher || !calculated) {
      setPromoCode("")
      setDiscount(0)
      setFinalAmount(null)
      return
    }

    setDiscount(calculated.discount)
    setFinalAmount(calculated.finalAmount)
  }, [promos, promoCode, subtotal])

  function applyPromotion(code: string) {
    setMessage("")
    const voucher = promos.find((promo) => promo.code === code || promo.id === code)
    const calculated = voucher ? calculateVoucher(voucher, subtotal) : null

    if (!voucher || !calculated) {
      setMessage("Mã giảm giá không phù hợp với giỏ hàng hiện tại.")
      return
    }

    setPromoCode(voucher.code)
    setDiscount(calculated.discount)
    setFinalAmount(calculated.finalAmount)
    setMessage(`Đã áp dụng mã ${voucher.code}.`)
  }

  function clearAll() {
    clearCart()
    setPromoCode("")
    setDiscount(0)
    setFinalAmount(null)
    setMessage("")
  }

  function orderPayload(code?: string) {
    return {
      tableId,
      qrToken,
      userId: user?.id,
      promoCode: code || undefined,
      items: items.map((item) => ({
        itemId: item.type === "dish" ? item.id : undefined,
        comboId: item.type === "combo" ? item.id : undefined,
        quantity: item.quantity,
        price: item.price,
      })),
    }
  }

  async function submitOrder() {
    setMessage("")
    setSuccessOrder(null)

    if (!items.length) {
      setMessage("Giỏ hàng đang trống.")
      return
    }
    if (!tableId || !qrToken) {
      setMessage("Bạn cần quét mã QR còn hiệu lực tại bàn trước khi đặt món.")
      return
    }

    setLoading(true)
    setMessage("Đang gửi đơn...")

    try {
      let order: any
      let notice = ""

      try {
        order = await apiPost("/api/orders", orderPayload(promoCode), token ?? undefined, { timeoutMs: 60_000 })
      } catch (error) {
        const promoRejected = promoCode && error instanceof ApiError && [400, 401, 403].includes(error.status)
        if (!promoRejected) throw error

        order = await apiPost("/api/orders", orderPayload(), token ?? undefined, { timeoutMs: 60_000 })
        notice = "Đã tạo đơn. Mã giảm giá không được áp dụng."
      }

      clearAll()
      setPromoOpen(false)
      setMessage(notice)
      setSuccessOrder(order)
      window.dispatchEvent(new CustomEvent("lemonde:orders-changed", { detail: order }))
      window.dispatchEvent(new CustomEvent("lemonde:tables-changed", { detail: { tableId, status: "OCCUPIED", order } }))
    } catch (error: any) {
      setMessage(error.message || "Đặt món thất bại. Vui lòng thử lại sau.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        className="relative z-30 flex h-[58px] min-w-0 w-full flex-col items-center justify-center rounded-2xl bg-[#D9491E] px-1 text-[10px] font-black text-white shadow-xl shadow-[#D9491E]/30"
        onClick={() => setOpen(true)}
        aria-label="Mở giỏ hàng"
      >
        <span className="text-lg leading-none">🛒</span>
        <span>{money(total())}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <aside className="relative flex h-[78vh] w-full max-w-md flex-col overflow-hidden rounded-t-[18px] bg-[#F7F7F7]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#F3E5D3] bg-white px-4 py-5">
              <h2 className="text-lg font-black text-[#211715]">Giỏ hàng ({items.length})</h2>
              <button className="text-2xl leading-none text-[#6F625C]" onClick={() => setOpen(false)} aria-label="Đóng giỏ hàng">×</button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-auto px-3 py-3">
              {items.length === 0 ? (
                <div className="rounded-xl bg-white p-6 text-center text-sm text-[#8A7A70] shadow-sm">Chưa có món trong giỏ.</div>
              ) : items.map((item) => (
                <div key={item.id} className="grid grid-cols-[52px_1fr_auto_auto] items-center gap-3 rounded-xl border border-[#F1E2CD] bg-white p-3 shadow-sm">
                  <div className="h-[52px] w-[52px] overflow-hidden rounded-lg bg-[linear-gradient(135deg,#281511,#8B1A1A)]">
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] font-black text-[#F6D690]">LM</div>}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold leading-5 text-[#2A2A2A]">{item.name}</p>
                    <p className="mt-1 text-xs text-[#6F625C]">{money(item.price)} / món</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="h-7 w-7 rounded-lg bg-[#F6EFE7] text-sm font-bold text-[#5E514A]" onClick={() => updateQty(item.id, item.quantity - 1)}>-</button>
                    <span className="w-5 text-center text-sm font-black text-[#211715]">{item.quantity}</span>
                    <button className="h-7 w-7 rounded-lg bg-[#F6EFE7] text-sm font-bold text-[#5E514A]" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className="px-1 text-xl leading-none text-[#8A7A70]" onClick={() => removeItem(item.id)} aria-label={`Xóa ${item.name}`}>×</button>
                  <p className="col-span-2 col-start-3 text-right text-xs font-bold text-[#5E514A]">{money(item.price * item.quantity)}</p>
                </div>
              ))}

              {items.length > 0 && (
                <div className="rounded-xl border border-dashed border-[#F08A1A] bg-[#FFF8EE]">
                  <button className="flex w-full items-center justify-between px-4 py-3" onClick={() => setPromoOpen((value) => !value)}>
                    <span className="text-sm font-bold text-[#6F625C]">◇ Chọn mã giảm giá</span>
                    <span className="text-xs font-black text-[#D9491E]">{promoOpen ? "Đóng" : "Mở"}</span>
                  </button>
                  {promoOpen && (
                    <div className="space-y-2 border-t border-[#F0D7B0] p-3">
                      {!user
                        ? <div className="rounded-xl bg-white p-3 text-sm text-[#8A7A70]">Vui lòng đăng nhập để xem và sử dụng mã giảm giá.</div>
                        : <VoucherList vouchers={promos} amount={subtotal} selectedCode={promoCode} onApply={applyPromotion} busyCode="" />}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-[#EEE0CB] bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#6F625C]">Tạm tính</span>
                <span className="font-black text-[#211715]">{money(subtotal)}</span>
              </div>
              {promoCode && (
                <>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-[#6F625C]">Giảm giá</span>
                    <span className="font-black text-[#D9491E]">-{money(discount)}</span>
                  </div>
                  <p className="text-right text-xs font-bold text-emerald-700">1 mã đã áp dụng</p>
                </>
              )}
              <div className="mb-3 mt-2 flex items-center justify-between border-t border-[#F0D7B0] pt-2">
                <span className="font-black text-[#211715]">Tổng cộng</span>
                <span className="text-xl font-black text-[#B51F18]">{money(cartTotal)}</span>
              </div>
              {message && <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">{message}</p>}
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <button
                  className="h-12 rounded-xl bg-[#F34208] px-5 text-sm font-black text-white shadow-lg shadow-[#F34208]/20 disabled:opacity-70"
                  disabled={loading || !items.length}
                  onClick={submitOrder}
                >
                  {loading ? "Đang tạo đơn..." : "Tiến hành đặt món"}
                </button>
                <button className="h-12 rounded-xl border border-[#F1E2CD] bg-white px-4 text-sm font-black text-[#B95A22]" onClick={clearAll}>
                  Xóa giỏ
                </button>
              </div>
            </div>

            {successOrder && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 px-7">
                <div className="w-full rounded-xl bg-[#F8F7FF] p-5 shadow-2xl">
                  <p className="text-base font-semibold text-[#211715]">Đã tạo đơn #{successOrder.orderNumber}. Cảm ơn bạn!</p>
                  <div className="mt-5 flex justify-end">
                    <button className="px-3 py-2 text-sm font-bold text-[#2F6DF6]" onClick={() => setSuccessOrder(null)}>Đóng</button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  )
}
