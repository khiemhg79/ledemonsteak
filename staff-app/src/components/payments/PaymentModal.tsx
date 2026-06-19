"use client"

import { useEffect, useState } from "react"
import { apiPost } from "@/lib/api"

type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD" | "E_WALLET"
const labels: Record<PaymentMethod, string> = { CASH: "Tiền mặt", BANK_TRANSFER: "Chuyển khoản", CARD: "Thẻ ngân hàng", E_WALLET: "Ví điện tử / MoMo" }
const money = (value: number) => Number(value || 0).toLocaleString("vi-VN") + "đ"

function orderNo(id?: string) {
  if (!id) return "..."
  const digits = id.replace(/\D/g, "")
  return digits ? digits.slice(-2).padStart(2, "0") : id.slice(-4).toUpperCase()
}

export default function PaymentModal({ order, onClose, onComplete }: { order: any | null; onClose: () => void; onComplete: () => void }) {
  const [received, setReceived] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("CASH")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!order) return
    setReceived(String(Math.round(order.finalAmount)))
    setMethod("CASH")
    setError("")
  }, [order])

  if (!order) return null
  const receivedNumber = Number(received || 0)
  const isShort = received !== "" && receivedNumber < order.finalAmount
  const change = Math.max(receivedNumber - order.finalAmount, 0)

  async function confirm() {
    if (receivedNumber < order.finalAmount) { setError(`Số tiền nhận phải lớn hơn hoặc bằng tổng tiền hóa đơn ${money(order.finalAmount)}.`); return }
    setBusy(true); setError("")
    try {
      await apiPost(`/api/orders/${order.id}/checkout`, { complete: true, paymentMethod: method, receivedAmount: Number(received) })
      onComplete()
    } catch (err) { setError(err instanceof Error ? err.message : "Không xác nhận được thanh toán.") } finally { setBusy(false) }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
    <section className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between"><div><h2 className="text-lg font-black text-[#111827]">Xác nhận Thanh toán</h2><p className="mt-2 text-sm text-[#475467]">Đơn hàng #{orderNo(order.id)} • Bàn {String(order.table?.number ?? "").replace(/^T/i, "")}</p><p className="text-3xl font-black text-[#111827]">{money(order.finalAmount)}</p></div><button className="text-2xl text-[#667085]" onClick={onClose}>×</button></div>
      <div className="my-4 border-t border-[#D0D5DD]" />
      <h3 className="text-sm font-black text-[#111827]">Chi tiết món đã gọi</h3>
      <div className="mt-2 divide-y divide-[#D0D5DD]">{order.items?.map((item: any) => <div key={item.id} className="flex justify-between gap-4 py-2"><div><p className="text-sm font-bold text-[#111827]">{item.item?.name ?? item.combo?.name}</p><p className="text-xs text-[#667085]">{item.combo ? "Combo" : "Món lẻ"} • SL: {item.quantity}</p></div><div className="text-right"><p className="text-sm font-black text-[#111827]">{money(item.price * item.quantity)}</p><p className="text-xs text-[#98A2B3]">({money(item.price)} / phần)</p></div></div>)}</div>
      <label className="mt-4 block text-sm font-semibold text-[#344054]">Số tiền nhận (đ) <span className="text-red-500">*</span><input type="number" min="0" required className={`mt-2 h-11 w-full rounded-md border px-3 outline-none ${isShort ? "border-red-400 focus:border-red-500" : "border-[#D0D5DD] focus:border-[#12B76A]"}`} value={received} onChange={(e) => { setReceived(e.target.value); setError("") }} /><span className={`mt-1 block text-xs font-normal ${isShort ? "text-red-600" : "text-[#667085]"}`}>{isShort ? `Số tiền nhận phải lớn hơn hoặc bằng tổng tiền hóa đơn ${money(order.finalAmount)}.` : money(receivedNumber)}</span></label>
      <label className="mt-4 block text-sm font-semibold text-[#344054]">Phương thức thanh toán<select className="mt-2 h-11 w-full rounded-md border border-[#D0D5DD] bg-white px-3" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {change > 0 && <div className="mt-3 flex justify-between rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm"><span className="text-emerald-700">Tiền thừa</span><span className="text-lg font-black text-emerald-700">{money(change)}</span></div>}
      {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 grid grid-cols-2 gap-3"><button className="h-12 rounded-md bg-[#E4E7EC] font-black text-[#344054]" onClick={onClose}>Hủy</button><button className="h-12 rounded-md bg-[#12B76A] font-black text-white disabled:opacity-60" disabled={busy} onClick={confirm}>{busy ? "Đang xử lý..." : "Xác nhận"}</button></div>
    </section>
  </div>
}
