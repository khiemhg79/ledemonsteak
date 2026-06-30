"use client"

import { useEffect, useState } from "react"
import VoucherList, { Voucher } from "@/components/promotions/VoucherList"
import { apiGet, apiPost } from "@/lib/api"
import { subscribeRealtime } from "@/lib/realtime"
import { useAuth } from "@/store/auth"
import { useCart } from "@/store/cart"

const money = (value: number) => value.toLocaleString("vi-VN") + "đ"

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
  const [applyingCode, setApplyingCode] = useState("")
  const { items, tableId, qrToken, updateQty, removeItem, clearCart, total } = useCart()
  const user = useAuth((s) => s.user)
  const subtotal = total()

  useEffect(() => {
    if (!open || !user) { setPromos([]); return }
    const load = (force = false) => apiGet("/api/promotions", undefined, { force }).then(setPromos).catch(() => setPromos([]))
    load()
    const refresh = () => {
      if (document.visibilityState === "visible") load(true)
    }
    const unsubscribe = subscribeRealtime("customer", refresh)
    const timer = window.setInterval(refresh, 5000)
    return () => {
      unsubscribe()
      window.clearInterval(timer)
    }
  }, [open, user?.id])

  useEffect(() => {
    if (!promoCode || !user || subtotal <= 0) { setDiscount(0); setFinalAmount(null); return }
    apiPost("/api/promotions/apply", { code: promoCode, orderAmount: subtotal })
      .then((result) => { setDiscount(result.discount ?? 0); setFinalAmount(result.finalAmount ?? subtotal) })
      .catch((error) => { setPromoCode(""); setDiscount(0); setFinalAmount(null); setMessage(error.message || "Mã giảm giá không còn phù hợp với giỏ hàng.") })
  }, [subtotal, promoCode, user?.id])

  async function applyPromotion(code: string) {
    setMessage("")
    setApplyingCode(code)
    try {
      const result = await apiPost("/api/promotions/apply", { code, orderAmount: subtotal })
      setPromoCode(code)
      setDiscount(result.discount ?? 0)
      setFinalAmount(result.finalAmount ?? subtotal)
      setMessage(`Đã áp dụng mã ${code}.`)
    } catch (error: any) {
      setMessage(error.message || "Không áp dụng được mã giảm giá.")
    } finally {
      setApplyingCode("")
    }
  }

  function clearAll() {
    clearCart()
    setPromoCode("")
    setDiscount(0)
    setFinalAmount(null)
  }

  async function submitOrder() {
    setMessage("")
    setSuccessOrder(null)
    if (!items.length) {
      setMessage("Giỏ hàng đang trống.")
      return
    }

    setLoading(true)
    try {
      if (!tableId || !qrToken) throw new Error("Bạn cần quét mã QR còn hiệu lực tại bàn trước khi đặt món.")

      const order = await apiPost("/api/orders", {
        tableId,
        qrToken,
        userId: user?.id,
        promoCode: promoCode || undefined,
        items: items.map((item) => ({
          itemId: item.type === "dish" ? item.id : undefined,
          comboId: item.type === "combo" ? item.id : undefined,
          quantity: item.quantity,
          price: item.price,
        })),
      })
      clearAll()
      setSuccessOrder(order)
    } catch (error: any) {
      setMessage(error.message || "Không thể tạo đơn.")
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
          <aside className="relative flex h-[78vh] w-full max-w-md flex-col overflow-hidden rounded-t-[18px] bg-[#F7F7F7]" onClick={(e) => e.stopPropagation()}>
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
              {items.length > 0 && <div className="rounded-xl border border-dashed border-[#F08A1A] bg-[#FFF8EE]">
                <button className="flex w-full items-center justify-between px-4 py-3" onClick={() => setPromoOpen((value) => !value)}>
                  <span className="text-sm font-bold text-[#6F625C]">◇ Chọn mã giảm giá</span>
                  <span className="text-xs font-black text-[#D9491E]">{promoOpen ? "Đóng" : "Mở"}</span>
                </button>
                {promoOpen && <div className="space-y-2 border-t border-[#F0D7B0] p-3">
                  {!user ? <div className="rounded-xl bg-white p-3 text-sm text-[#8A7A70]">Vui lòng đăng nhập để xem và sử dụng mã giảm giá.</div> : <VoucherList vouchers={promos} amount={subtotal} selectedCode={promoCode} onApply={applyPromotion} busyCode={applyingCode} />}
                </div>}
              </div>}
            </div>

            <div className="border-t border-[#EEE0CB] bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#6F625C]">Tạm tính</span>
                <span className="font-black text-[#211715]">{money(subtotal)}</span>
              </div>
              {promoCode && <><div className="mt-1 flex items-center justify-between text-sm"><span className="text-[#6F625C]">Giảm giá</span><span className="font-black text-[#D9491E]">-{money(discount)}</span></div><p className="text-right text-xs font-bold text-emerald-700">1 mã đã áp dụng</p></>}
              <div className="mb-3 mt-2 flex items-center justify-between border-t border-[#F0D7B0] pt-2"><span className="font-black text-[#211715]">Tổng cộng</span><span className="text-xl font-black text-[#B51F18]">{money(finalAmount ?? subtotal)}</span></div>
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
