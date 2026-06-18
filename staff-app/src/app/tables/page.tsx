"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import QRModal from "@/components/tables/QRModal"
import TableGrid from "@/components/tables/TableGrid"
import { apiGet, apiPatch } from "@/lib/api"

type TableStatus = "EMPTY" | "OCCUPIED" | "REQUESTING_BILL"

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function loadTables() {
    setLoading(true)
    setError("")
    try {
      setTables(await apiGet("/api/tables"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách bàn.")
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(tableId: string, status: TableStatus) {
    setError("")
    setTables((current) => current.map((table) => table.id === tableId ? { ...table, status } : table))
    try {
      await apiPatch(`/api/tables/${tableId}`, { status })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được trạng thái bàn.")
      loadTables()
    }
  }

  useEffect(() => { loadTables() }, [])

  return (
    <main className="min-h-screen bg-[#F7F7F7]">
      <header className="mx-6 mt-2 h-16 bg-[linear-gradient(90deg,#FF7A2A,#FF3D00)] px-16 text-white shadow-md">
        <div className="flex h-full items-center justify-between">
          <h1 className="text-xl font-black">Le Monde Steak</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold">Xin chào, staff</span>
            <button className="rounded-lg bg-white px-5 py-2 text-sm font-black text-[#E94713]">Đăng xuất</button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-8 py-6">
        <div className="mb-6 flex gap-2">
          <Link href="/tables" className="rounded-md bg-[#FF4A12] px-4 py-3 text-sm font-bold text-white shadow-sm">Quản lý Bàn</Link>
          <Link href="/orders" className="rounded-md bg-[#E8ECEF] px-4 py-3 text-sm font-bold text-[#57606A] shadow-sm">Theo dõi Đơn hàng</Link>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#111]">Quản lý Bàn</h2>
          <button className="rounded-md bg-[#FF4A12] px-5 py-3 text-sm font-bold text-white shadow-sm" onClick={loadTables}>Làm mới</button>
        </div>

        <div className="mb-5 rounded-md bg-[#F0F2F5] px-4 py-3">
          <div className="flex flex-wrap gap-5 text-sm text-[#222]">
            <span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-[#72E7A7]" /> Trống</span>
            <span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-[#FFE36B]" /> Đang dùng bữa</span>
            <span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-[#FF9A9A]" /> Yêu cầu thanh toán</span>
          </div>
        </div>

        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {loading && <div className="rounded-md bg-white p-6 text-center text-sm text-gray-500">Đang tải danh sách bàn...</div>}
        <TableGrid tables={tables} onSelect={setSelected} onStatusChange={updateStatus} />
        {!loading && !error && tables.length === 0 && <div className="rounded-md bg-white p-6 text-center text-sm text-gray-500">Chưa có bàn. Hãy chạy file SQL seed trong Supabase trước.</div>}
      </section>

      <QRModal table={selected} onClose={() => setSelected(null)} />
    </main>
  )
}
