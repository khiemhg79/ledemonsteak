"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import PaymentModal from "@/components/payments/PaymentModal"
import { apiGet } from "@/lib/api"
import { useAuth } from "@/store/auth"

const money = (value: number) => Number(value || 0).toLocaleString("vi-VN") + "đ"

export default function InvoicePage() {
  const router = useRouter()
  const logout = useAuth((state) => state.logout)
  const user = useAuth((state) => state.user)
  const [orders, setOrders] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [view, setView] = useState<"pending" | "paid">("pending")
  const [error, setError] = useState("")
  const loadingRef = useRef(false)
  const requesting = useMemo(() => orders.filter((order) => order.table?.status === "REQUESTING_BILL"), [orders])

  async function loadOrders() {
    if (loadingRef.current) return
    loadingRef.current = true
    setError("")
    try {
      const [orderList, invoiceList] = await Promise.all([apiGet("/api/orders?view=staff"), apiGet("/api/invoices")])
      setOrders(orderList)
      setInvoices(invoiceList)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được hóa đơn.")
    } finally {
      loadingRef.current = false
    }
  }
  function completed() { setSelected(null); loadOrders() }
  function printInvoice(invoice: any) {
    const payment = invoice.payments?.[0]
    const methodLabels: Record<string, string> = { CASH: "Tiền mặt", BANK_TRANSFER: "Chuyển khoản", CARD: "Thẻ ngân hàng", E_WALLET: "Ví điện tử / MoMo" }
    const items = invoice.order.items.map((item: any) => `<div class="item"><div class="row"><strong>${item.item?.name ?? item.combo?.name} x ${item.quantity}</strong><strong>${money(item.price * item.quantity)}</strong></div><small>${item.combo ? "Combo" : "Món lẻ"} • ${money(item.price)} / phần</small></div>`).join("")
    const popup = window.open("", "_blank", "width=520,height=760")
    if (!popup) { setError("Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup rồi thử lại."); return }
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${invoice.invoiceCode}</title><style>body{font-family:Arial,sans-serif;color:#171717;padding:28px;max-width:420px;margin:auto}.center{text-align:center}.row{display:flex;justify-content:space-between;gap:16px}.line{border-top:1px dashed #777;margin:14px 0}.item{margin:10px 0;font-size:14px}.total{font-size:20px;font-weight:700}h1,p{margin:6px 0}small{color:#666}</style></head><body><div class="center"><h1>Le Monde Steak</h1><p>HÓA ĐƠN THANH TOÁN</p><strong>${invoice.invoiceCode}</strong></div><div class="line"></div><div class="row"><span>Đơn hàng #${invoice.order.orderNumber}</span><span>Bàn ${String(invoice.table?.number ?? "").replace(/^T/i, "")}</span></div><p>${new Date(invoice.paidAt).toLocaleString("vi-VN")}</p><div class="line"></div>${items}<div class="line"></div><div class="row"><span>Tạm tính</span><span>${money(invoice.subtotal)}</span></div><div class="row"><span>Giảm giá</span><span>-${money(invoice.discount)}</span></div><div class="row total"><span>Tổng cộng</span><span>${money(invoice.total)}</span></div><div class="row"><span>Tiền nhận</span><span>${money(payment?.amount)}</span></div><div class="row"><span>Tiền thừa</span><span>${money(Math.max((payment?.amount ?? invoice.total) - invoice.total, 0))}</span></div><div class="row"><span>Phương thức</span><span>${methodLabels[payment?.method] ?? "-"}</span></div><div class="line"></div><p class="center">Cảm ơn quý khách và hẹn gặp lại!</p><script>window.onload=()=>window.print()</script></body></html>`)
    popup.document.close()
  }
  useEffect(() => {
    loadOrders()
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") loadOrders()
    }, 5000)
    return () => window.clearInterval(timer)
  }, [])

  return <main className="min-h-screen bg-[#F7F7F7]">
    <header className="mx-6 mt-2 h-16 bg-[linear-gradient(90deg,#FF7A2A,#FF3D00)] px-16 text-white shadow-md"><div className="flex h-full items-center justify-between"><h1 className="text-xl font-black">Le Monde Steak</h1><div className="flex items-center gap-4"><span className="text-sm font-semibold">Xin chào, {user?.name ?? "staff"}</span><button className="rounded-lg bg-white px-5 py-2 text-sm font-black text-[#E94713]" onClick={() => { logout(); router.push("/login") }}>Đăng xuất</button></div></div></header>
    <section className="mx-auto max-w-[1180px] px-8 py-6">
      <div className="mb-6 flex gap-2"><Link href="/tables" className="rounded-md bg-[#E8ECEF] px-4 py-3 text-sm font-bold text-[#57606A]">Quản lý Bàn</Link><Link href="/orders" className="rounded-md bg-[#E8ECEF] px-4 py-3 text-sm font-bold text-[#57606A]">Theo dõi Đơn hàng</Link><Link href="/invoice" className="rounded-md bg-[#FF4A12] px-4 py-3 text-sm font-bold text-white">Thanh toán</Link></div>
      <div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-black text-[#111]">Thanh toán</h2><p className="text-sm text-[#667085]">Danh sách bàn đang yêu cầu thanh toán.</p></div><button className="rounded-md bg-[#FF4A12] px-5 py-3 text-sm font-bold text-white" onClick={loadOrders}>Làm mới</button></div>
      <div className="mb-5 flex gap-2"><button className={`rounded-md px-4 py-2 text-sm font-bold ${view === "pending" ? "bg-[#FF4A12] text-white" : "bg-[#E8ECEF] text-[#57606A]"}`} onClick={() => setView("pending")}>Chờ thanh toán ({requesting.length})</button><button className={`rounded-md px-4 py-2 text-sm font-bold ${view === "paid" ? "bg-[#FF4A12] text-white" : "bg-[#E8ECEF] text-[#57606A]"}`} onClick={() => setView("paid")}>Đã thanh toán ({invoices.length})</button></div>
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {view === "pending" && <><div className="grid gap-4 lg:grid-cols-3">{requesting.map((order) => <article key={order.id} className="rounded-md border border-[#D9DEE6] bg-white p-4 shadow-md"><div className="flex justify-between"><div><h3 className="text-xl font-black text-[#111827]">Bàn {String(order.table?.number ?? "").replace(/^T/i, "")}</h3><p className="text-sm text-[#667085]">Đơn hàng #{order.orderNumber}</p></div><p className="text-xl font-black text-[#B51F18]">{money(order.finalAmount)}</p></div><div className="mt-4 space-y-2">{order.items.map((item: any) => <div key={item.id} className="flex justify-between border-t border-[#D0D5DD] pt-2 text-sm"><span className="font-semibold text-[#111827]">{item.item?.name ?? item.combo?.name} x {item.quantity}</span><span className="font-bold text-[#475467]">{money(item.price * item.quantity)}</span></div>)}</div><button className="mt-4 w-full rounded-md bg-[#12B76A] py-3 text-sm font-black text-white" onClick={() => setSelected(order)}>Xác nhận thanh toán</button></article>)}</div>{!error && requesting.length === 0 && <div className="rounded-md bg-white p-6 text-center text-sm text-gray-500">Chưa có bàn yêu cầu thanh toán.</div>}</>}
      {view === "paid" && <><div className="grid gap-4 lg:grid-cols-3">{invoices.map((invoice) => <article key={invoice.id} className="rounded-md border border-[#D9DEE6] bg-white p-4 shadow-md"><div className="flex justify-between gap-4"><div><h3 className="font-black text-[#111827]">{invoice.invoiceCode}</h3><p className="text-sm text-[#667085]">Đơn hàng #{invoice.order.orderNumber} • Bàn {String(invoice.table?.number ?? "").replace(/^T/i, "")}</p><p className="mt-1 text-xs text-[#667085]">{new Date(invoice.paidAt).toLocaleString("vi-VN")}</p></div><p className="text-xl font-black text-[#B51F18]">{money(invoice.total)}</p></div><div className="mt-4 space-y-2">{invoice.order.items.map((item: any) => <div key={item.id} className="flex justify-between border-t border-[#D0D5DD] pt-2 text-sm"><span className="font-semibold">{item.item?.name ?? item.combo?.name} x {item.quantity}</span><span>{money(item.price * item.quantity)}</span></div>)}</div><button className="mt-4 w-full rounded-md bg-[#FF4A12] py-3 text-sm font-black text-white" onClick={() => printInvoice(invoice)}>In hóa đơn</button></article>)}</div>{!error && invoices.length === 0 && <div className="rounded-md bg-white p-6 text-center text-sm text-gray-500">Chưa có hóa đơn đã thanh toán.</div>}</>}
    </section>
    <PaymentModal order={selected} onClose={() => setSelected(null)} onComplete={completed} />
  </main>
}
