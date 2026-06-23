"use client"

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export type ReportData = {
  monthly: { month: string; label?: string; revenue: number; orders: number }[]
  topDishes: { name: string; quantity: number; revenue?: number }[]
  comboRatio: { comboItems: number; dishItems: number }
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  mom: number | null
}

function million(value: number) {
  return Number((value / 1_000_000).toFixed(2))
}

function shortName(value: string) {
  return value.length > 16 ? `${value.slice(0, 15)}...` : value
}

export default function RevenueChart({ monthly, topDishes, comboRatio }: ReportData) {
  const monthlyData = monthly.map((item) => ({
    ...item,
    label: item.label ?? item.month,
    revenueMillion: million(item.revenue),
  }))
  const topData = topDishes.map((item) => ({ ...item, shortName: shortName(item.name) }))
  const ratioTotal = comboRatio.comboItems + comboRatio.dishItems
  const ratio = ratioTotal > 0 ? [
    { name: "Combo", value: comboRatio.comboItems },
    { name: "Lẻ", value: comboRatio.dishItems },
  ] : []

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Doanh thu theo tháng" empty={!monthlyData.length}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyData}>
            <CartesianGrid stroke="#17243A" />
            <XAxis dataKey="label" stroke="#D9E4F6" />
            <YAxis stroke="#D9E4F6" />
            <Tooltip formatter={(value: number) => [`${value} triệu`, "Doanh thu"]} />
            <Legend />
            <Line type="monotone" dataKey="revenueMillion" name="value" stroke="#5DA8FF" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Món bán chạy" empty={!topData.length}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topData}>
            <XAxis dataKey="shortName" stroke="#D9E4F6" tick={{ fontSize: 12 }} />
            <YAxis stroke="#D9E4F6" />
            <Tooltip formatter={(value: number, name) => [value, name === "quantity" ? "Số lượng" : name]} labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""} />
            <Bar dataKey="quantity" fill="#36D19B" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Tỷ lệ combo (%)" empty={!ratio.length}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={ratio} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
              <Cell fill="#5DA8FF" />
              <Cell fill="#9C7CF4" />
            </Pie>
            <Legend />
            <Tooltip formatter={(value: number) => [`${value} món`, "Số lượng"]} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Doanh thu & số đơn" empty={!monthlyData.length}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData}>
            <XAxis dataKey="label" stroke="#D9E4F6" />
            <YAxis yAxisId="left" stroke="#D9E4F6" />
            <YAxis yAxisId="right" orientation="right" stroke="#FBC02D" />
            <Tooltip formatter={(value: number, name) => name === "Doanh thu" ? [`${value} triệu`, name] : [value, name]} />
            <Legend />
            <Bar yAxisId="left" dataKey="revenueMillion" name="Doanh thu" fill="#5DA8FF" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="right" dataKey="orders" name="Số đơn" fill="#FFC928" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function ChartCard({ title, children, empty }: { title: string; children: React.ReactNode; empty: boolean }) {
  return (
    <section className="h-[320px] rounded-2xl border border-[#1D2B46] bg-[#050918] p-5">
      <h2 className="font-black text-white">{title}</h2>
      <div className="mt-4 h-[250px]">
        {empty ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#263756] text-sm text-[#9AA8BF]">
            Chưa có dữ liệu báo cáo.
          </div>
        ) : children}
      </div>
    </section>
  )
}
