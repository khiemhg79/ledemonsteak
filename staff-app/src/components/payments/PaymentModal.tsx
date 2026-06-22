"use client"

import { useEffect, useRef, useState } from "react"
import { apiPost } from "@/lib/api"

type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD" | "E_WALLET"
const labels: Record<PaymentMethod, string> = { CASH: "Tiền mặt", BANK_TRANSFER: "Chuyển khoản", CARD: "Thẻ ngân hàng", E_WALLET: "Ví điện tử / MoMo" }
const money = (value: number) => Number(value || 0).toLocaleString("vi-VN") + "đ"

export default function PaymentModal({ order, onClose, onComplete }: { order: any | null; onClose: () => void; onComplete: () => void }) {
  const [received, setReceived] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("CASH")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [receipt, setReceipt] = useState<any | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!order) return
    setReceived(String(Math.round(order.finalAmount)))
    setMethod("CASH")
    setError("")
    setReceipt(null)
  }, [order])

  if (!order) return null
  const receivedNumber = Number(received || 0)
  const isShort = received !== "" && receivedNumber < order.finalAmount
  const change = Math.max(receivedNumber - order.finalAmount, 0)

  async function confirm() {
    if (receivedNumber < order.finalAmount) { setError(`Số tiền nhận phải lớn hơn hoặc bằng tổng tiền hóa đơn ${money(order.finalAmount)}.`); return }
    setBusy(true); setError("")
    try {
      const result = await apiPost(`/api/orders/${order.id}/checkout`, { complete: true, paymentMethod: method, receivedAmount: Number(received) })
      setReceipt(result)
    } catch (err) { setError(err instanceof Error ? err.message : "Không xác nhận được thanh toán.") } finally { setBusy(false) }
  }

  function finish() {
    setReceipt(null)
    onComplete()
  }

  function printReceipt() {
    if (!receiptRef.current) return
    const popup = window.open("", "_blank", "width=520,height=760")
    if (!popup) { setError("Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup rồi thử lại."); return }
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${receipt.invoice.invoiceCode}</title><style>body{font-family:Arial,sans-serif;color:#171717;padding:28px;max-width:420px;margin:auto}h1,h2,p{margin:6px 0}.center{text-align:center}.row{display:flex;justify-content:space-between;gap:16px}.line{border-top:1px dashed #777;margin:14px 0}.item{margin:10px 0;font-size:14px}.total{font-size:20px;font-weight:700}@media print{button{display:none}}</style></head><body>${receiptRef.current.innerHTML}</body></html>`)
    popup.document.close()
    popup.onload = () => popup.print()
  }

  if (receipt) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
    <section className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
      <div ref={receiptRef}>
        <div className="center text-center"><h1 className="text-2xl font-black">Le Monde Steak</h1><p className="text-sm text-[#667085]">HÓA ĐƠN THANH TOÁN</p><p className="font-bold">{receipt.invoice.invoiceCode}</p></div>
        <div className="line my-4 border-t border-dashed border-gray-400" />
        <div className="row flex justify-between text-sm"><span>Đơn hàng #{receipt.order.orderNumber}</span><span>Bàn {String(receipt.order.table?.number ?? "").replace(/^T/i, "")}</span></div>
        <p className="mt-1 text-sm text-[#667085]">{new Date(receipt.invoice.paidAt).toLocaleString("vi-VN")}</p>
        <div className="line my-4 border-t border-dashed border-gray-400" />
        {receipt.order.items.map((item: any) => <div className="item mb-3 text-sm" key={item.id}><div className="row flex justify-between gap-4"><strong>{item.item?.name ?? item.combo?.name} x {item.quantity}</strong><strong>{money(item.price * item.quantity)}</strong></div><p className="text-xs text-[#667085]">{item.combo ? "Combo" : "Món lẻ"} • {money(item.price)} / phần</p></div>)}
        <div className="line my-4 border-t border-dashed border-gray-400" />
        <div className="space-y-2 text-sm"><div className="row flex justify-between"><span>Tạm tính</span><span>{money(receipt.invoice.subtotal)}</span></div><div className="row flex justify-between"><span>Giảm giá</span><span>-{money(receipt.invoice.discount)}</span></div><div className="row total flex justify-between text-xl font-black"><span>Tổng cộng</span><span>{money(receipt.invoice.total)}</span></div><div className="row flex justify-between"><span>Tiền nhận</span><span>{money(receipt.receivedAmount)}</span></div><div className="row flex justify-between font-bold text-emerald-700"><span>Tiền thừa</span><span>{money(receipt.changeAmount)}</span></div><div className="row flex justify-between"><span>Phương thức</span><span>{labels[receipt.payment.method as PaymentMethod]}</span></div></div>
        <div className="line my-4 border-t border-dashed border-gray-400" /><p className="center text-center text-sm">Cảm ơn quý khách và hẹn gặp lại!</p>
      </div>
      {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 grid grid-cols-2 gap-3"><button className="h-12 rounded-md bg-[#E4E7EC] font-black text-[#344054]" onClick={finish}>Đóng</button><button className="h-12 rounded-md bg-[#FF4A12] font-black text-white" onClick={printReceipt}>In hóa đơn</button></div>
    </section>
  </div>

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
    <section className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between"><div><h2 className="text-lg font-black text-[#111827]">Xác nhận Thanh toán</h2><p className="mt-2 text-sm text-[#475467]">Đơn hàng #{order.orderNumber} • Bàn {String(order.table?.number ?? "").replace(/^T/i, "")}</p><p className="text-3xl font-black text-[#111827]">{money(order.finalAmount)}</p></div><button className="text-2xl text-[#667085]" onClick={onClose}>×</button></div>
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
