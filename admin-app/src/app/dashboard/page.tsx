"use client"

import { useEffect, useState } from "react"
import RevenueChart from "@/components/dashboard/RevenueChart"
import { apiGet } from "@/lib/api"

export default function DashboardPage() {
  const [report, setReport] = useState<any>({ monthly: [], topDishes: [], comboRatio: { comboItems: 0, dishItems: 0 } })

  useEffect(() => { apiGet("/api/admin/reports").then(setReport).catch(() => {}) }, [])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black">Tổng quan kinh doanh</h1>
        <button className="rounded-2xl bg-[#111C34] px-5 py-3 text-sm font-black ring-1 ring-[#263756]">Làm mới dữ liệu</button>
      </div>
      <RevenueChart monthly={report.monthly ?? []} topDishes={report.topDishes ?? []} comboRatio={report.comboRatio ?? { comboItems: 0, dishItems: 0 }} />
    </div>
  )
}
