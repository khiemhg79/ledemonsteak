"use client"

import { useState } from "react"
import { apiPost } from "@/lib/api"
import { useAuth } from "@/store/auth"
import { useCart } from "@/store/cart"

const money = (value: number) => value.toLocaleString("vi-VN") + "đ"

export default function CartDrawer() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [successOrder, setSuccessOrder] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const { items, tableId, updateQty, removeItem, clearCart, total } = useCart()
  const user = useAuth((s) => s.user)

  async function submitOrder() {
    setMessage("")
    setSuccessOrder(null)
    if (!items.length) {
      setMessage("Giỏ hàng đang trống.")
      return
    }

    setLoading(true)
    try {
      if (!tableId) throw new Error("Bạn cần quét mã QR tại bàn trước khi đặt món.")

      const order = await apiPost("/api/orders", {
        tableId,
        userId: user?.id,
        items: items.map((item) => ({
          itemId: item.type === "dish" ? item.id : undefined,
          comboId: item.type === "combo" ? item.id : undefined,
          quantity: item.quantity,
          price: item.price,
        })),
      })
      clearCart()
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
        className="fixed bottom-[18px] left-[calc(50%+132px)] z-30 flex h-[58px] w-[58px] -translate-x-1/2 flex-col items-center justify-center rounded-2xl bg-[#D9491E] text-[11px] font-black text-white shadow-xl shadow-[#D9491E]/30"
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
            </div>

            <div className="border-t border-[#EEE0CB] bg-white px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#6F625C]">Tạm tính</span>
                <span className="text-xl font-black text-[#B51F18]">{money(total())}</span>
              </div>
              {message && <p className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>}
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <button
                  className="h-12 rounded-xl bg-[#F34208] px-5 text-sm font-black text-white shadow-lg shadow-[#F34208]/20 disabled:opacity-70"
                  disabled={loading || !items.length}
                  onClick={submitOrder}
                >
                  {loading ? "Đang tạo đơn..." : "Tiến hành đặt món"}
                </button>
                <button className="h-12 rounded-xl border border-[#F1E2CD] bg-white px-4 text-sm font-black text-[#B95A22]" onClick={clearCart}>
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
