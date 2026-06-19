"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import QRModal from "@/components/tables/QRModal"
import TableGrid from "@/components/tables/TableGrid"
import PaymentModal from "@/components/payments/PaymentModal"
import OrderDetailModal from "@/components/orders/OrderDetailModal"
import { apiGet, apiPatch } from "@/lib/api"
import { useAuth } from "@/store/auth"

type TableStatus = "EMPTY" | "OCCUPIED" | "REQUESTING_BILL"

export default function TablesPage() {
  const router = useRouter()
  const logout = useAuth((state) => state.logout)
  const [tables, setTables] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [qrTable, setQrTable] = useState<any | null>(null)
  const [paymentOrder, setPaymentOrder] = useState<any | null>(null)
  const [detailOrder, setDetailOrder] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const dismissed = useRef(new Set<string>())

  async function loadData(silent = false) {
    if (!silent) setLoading(true)
    setError("")
    try {
      const [tableList, orderList] = await Promise.all([apiGet("/api/tables"), apiGet("/api/orders")])
      setTables(tableList); setOrders(orderList)
      const requesting = orderList.find((order: any) => order.table?.status === "REQUESTING_BILL" && !dismissed.current.has(order.id))
      if (requesting && !paymentOrder) setPaymentOrder(requesting)
      if (paymentOrder) {
        const refreshed = orderList.find((order: any) => order.id === paymentOrder.id)
        if (refreshed?.table?.status === "REQUESTING_BILL") setPaymentOrder(refreshed)
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Không tải được dữ liệu bàn.") } finally { if (!silent) setLoading(false) }
  }

  async function updateStatus(tableId: string, status: TableStatus) {
    setTables((current) => current.map((table) => table.id === tableId ? { ...table, status } : table))
    try { await apiPatch(`/api/tables/${tableId}`, { status }); loadData(true) } catch (err) { setError(err instanceof Error ? err.message : "Không cập nhật được trạng thái bàn."); loadData(true) }
  }

  function selectTable(table: any) {
    const order = orders.find((item) => item.tableId === table.id)
    if (table.status === "REQUESTING_BILL") {
      if (order) { dismissed.current.delete(order.id); setPaymentOrder(order); return }
      setError("TB02: Bàn yêu cầu thanh toán nhưng không tìm thấy đơn hiện tại.")
      return
    }
    if (table.status === "OCCUPIED") {
      if (order) { setDetailOrder(order); return }
      setError("TB02: Bàn đang dùng nhưng chưa có order món.")
      return
    }
    setQrTable(table)
  }

  function closePayment() { if (paymentOrder) dismissed.current.add(paymentOrder.id); setPaymentOrder(null) }
  function paymentCompleted() { setPaymentOrder(null); loadData() }

  useEffect(() => { loadData(); const timer = window.setInterval(() => loadData(true), 5000); return () => window.clearInterval(timer) }, [])
  const requestCount = tables.filter((table) => table.status === "REQUESTING_BILL").length

  return <main className="min-h-screen bg-[#F7F7F7]">
    <header className="mx-6 mt-2 h-16 bg-[linear-gradient(90deg,#FF7A2A,#FF3D00)] px-16 text-white shadow-md"><div className="flex h-full items-center justify-between"><h1 className="text-xl font-black">Le Monde Steak</h1><div className="flex items-center gap-4"><span className="text-sm font-semibold">Xin chào, staff</span><button className="rounded-lg bg-white px-5 py-2 text-sm font-black text-[#E94713]" onClick={() => { logout(); router.push("/login") }}>Đăng xuất</button></div></div></header>
    <section className="mx-auto max-w-[1280px] px-8 py-6">
      <div className="mb-6 flex gap-2"><Link href="/tables" className="rounded-md bg-[#FF4A12] px-4 py-3 text-sm font-bold text-white">Quản lý Bàn</Link><Link href="/orders" className="rounded-md bg-[#E8ECEF] px-4 py-3 text-sm font-bold text-[#57606A]">Theo dõi Đơn hàng</Link><Link href="/invoice" className="relative rounded-md bg-[#E8ECEF] px-4 py-3 text-sm font-bold text-[#57606A]">Thanh toán{requestCount > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{requestCount}</span>}</Link></div>
      <div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-black text-[#111]">Quản lý Bàn</h2><button className="rounded-md bg-[#FF4A12] px-5 py-3 text-sm font-bold text-white" onClick={() => loadData()}>Làm mới</button></div>
      <div className="mb-5 rounded-md bg-[#F0F2F5] px-4 py-3"><div className="flex flex-wrap gap-5 text-sm text-[#222]"><span className="inline-flex items-center gap-2"><i className="h-3 w-3 bg-[#72E7A7]" /> Trống</span><span className="inline-flex items-center gap-2"><i className="h-3 w-3 bg-[#FFE36B]" /> Đang dùng bữa</span><span className="inline-flex items-center gap-2"><i className="h-3 w-3 bg-[#FF9A9A]" /> Yêu cầu thanh toán</span></div></div>
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{loading && <div className="rounded-md bg-white p-6 text-center text-sm text-gray-500">Đang tải danh sách bàn...</div>}
      <TableGrid tables={tables} onSelect={selectTable} onStatusChange={updateStatus} />
    </section>
    <QRModal table={qrTable} onClose={() => setQrTable(null)} />
    <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
    <PaymentModal order={paymentOrder} onClose={closePayment} onComplete={paymentCompleted} />
  </main>
}
