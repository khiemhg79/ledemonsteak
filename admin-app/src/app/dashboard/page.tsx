"use client"

import { useEffect, useState } from "react"
import RevenueChart, { ReportData } from "@/components/dashboard/RevenueChart"
import { apiGet } from "@/lib/api"

const emptyReport: ReportData = {
  monthly: [],
  topDishes: [],
  comboRatio: { comboItems: 0, dishItems: 0 },
  totalOrders: 0,
  totalRevenue: 0,
  averageOrderValue: 0,
  mom: null,
}

function money(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")}đ`
}

function formatMom(value: number | null) {
  if (value === null) return "Chưa đủ dữ liệu"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

export default function DashboardPage() {
  const [report, setReport] = useState<ReportData>(emptyReport)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  async function loadReport(force = false) {
    setLoading(true)
    setMessage("")
    try {
      setReport(await apiGet("/api/admin/reports", undefined, { force }))
    } catch (error: any) {
      setMessage(error.message || "Lỗi tải dữ liệu, không thể tạo báo cáo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black">Tổng quan kinh doanh</h1>
        <button className="admin-primary" disabled={loading} onClick={() => loadReport(true)}>{loading ? "Đang tải..." : "Làm mới dữ liệu"}</button>
      </div>

      {message && <p className="mb-5 rounded-lg border border-[#7F1D1D] bg-[#2A0E13] px-4 py-3 text-sm text-[#FFB4B4]">{message}</p>}

      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Doanh thu" value={money(report.totalRevenue)} />
        <StatCard label="Số đơn bán" value={report.totalOrders.toLocaleString("vi-VN")} />
        <StatCard label="Giá trị đơn trung bình" value={money(report.averageOrderValue)} />
        <StatCard label="MoM" value={formatMom(report.mom)} muted={report.mom === null} />
      </div>

      <RevenueChart {...report} />
    </div>
  )
}

function StatCard({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <section className="rounded-2xl border border-[#1D2B46] bg-[#050918] p-5">
      <p className="text-sm font-semibold text-[#9AA8BF]">{label}</p>
      <p className={`mt-3 text-2xl font-black ${muted ? "text-[#9AA8BF]" : "text-white"}`}>{value}</p>
    </section>
  )
}
