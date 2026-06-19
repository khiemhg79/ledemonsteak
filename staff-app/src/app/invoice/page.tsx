"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import PaymentModal from "@/components/payments/PaymentModal"
import { apiGet } from "@/lib/api"
import { useAuth } from "@/store/auth"

const money = (value: number) => Number(value || 0).toLocaleString("vi-VN") + "đ"
function orderNo(id?: string) { if (!id) return "..."; const digits = id.replace(/\D/g, ""); return digits ? digits.slice(-2).padStart(2, "0") : id.slice(-4).toUpperCase() }

export default function InvoicePage() {
  const router = useRouter()
  const logout = useAuth((state) => state.logout)
  const [orders, setOrders] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [error, setError] = useState("")
  const requesting = useMemo(() => orders.filter((order) => order.table?.status === "REQUESTING_BILL"), [orders])

  async function loadOrders() { setError(""); try { setOrders(await apiGet("/api/orders")) } catch (err) { setError(err instanceof Error ? err.message : "Không tải được hóa đơn.") } }
  function completed() { setSelected(null); loadOrders() }
  useEffect(() => { loadOrders(); const timer = window.setInterval(loadOrders, 5000); return () => window.clearInterval(timer) }, [])

  return <main className="min-h-screen bg-[#F7F7F7]">
    <header className="mx-6 mt-2 h-16 bg-[linear-gradient(90deg,#FF7A2A,#FF3D00)] px-16 text-white shadow-md"><div className="flex h-full items-center justify-between"><h1 className="text-xl font-black">Le Monde Steak</h1><div className="flex items-center gap-4"><span className="text-sm font-semibold">Xin chào, staff</span><button className="rounded-lg bg-white px-5 py-2 text-sm font-black text-[#E94713]" onClick={() => { logout(); router.push("/login") }}>Đăng xuất</button></div></div></header>
    <section className="mx-auto max-w-[1180px] px-8 py-6">
      <div className="mb-6 flex gap-2"><Link href="/tables" className="rounded-md bg-[#E8ECEF] px-4 py-3 text-sm font-bold text-[#57606A]">Quản lý Bàn</Link><Link href="/orders" className="rounded-md bg-[#E8ECEF] px-4 py-3 text-sm font-bold text-[#57606A]">Theo dõi Đơn hàng</Link><Link href="/invoice" className="rounded-md bg-[#FF4A12] px-4 py-3 text-sm font-bold text-white">Thanh toán</Link></div>
      <div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-black text-[#111]">Thanh toán</h2><p className="text-sm text-[#667085]">Danh sách bàn đang yêu cầu thanh toán.</p></div><button className="rounded-md bg-[#FF4A12] px-5 py-3 text-sm font-bold text-white" onClick={loadOrders}>Làm mới</button></div>
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <div className="grid gap-4 lg:grid-cols-3">{requesting.map((order) => <article key={order.id} className="rounded-md border border-[#D9DEE6] bg-white p-4 shadow-md"><div className="flex justify-between"><div><h3 className="text-xl font-black text-[#111827]">Bàn {String(order.table?.number ?? "").replace(/^T/i, "")}</h3><p className="text-sm text-[#667085]">Đơn hàng #{orderNo(order.id)}</p></div><p className="text-xl font-black text-[#B51F18]">{money(order.finalAmount)}</p></div><div className="mt-4 space-y-2">{order.items.map((item: any) => <div key={item.id} className="flex justify-between border-t border-[#D0D5DD] pt-2 text-sm"><span className="font-semibold text-[#111827]">{item.item?.name ?? item.combo?.name} x {item.quantity}</span><span className="font-bold text-[#475467]">{money(item.price * item.quantity)}</span></div>)}</div><button className="mt-4 w-full rounded-md bg-[#12B76A] py-3 text-sm font-black text-white" onClick={() => setSelected(order)}>Xác nhận thanh toán</button></article>)}</div>
      {!error && requesting.length === 0 && <div className="rounded-md bg-white p-6 text-center text-sm text-gray-500">Chưa có bàn yêu cầu thanh toán.</div>}
    </section>
    <PaymentModal order={selected} onClose={() => setSelected(null)} onComplete={completed} />
  </main>
}
