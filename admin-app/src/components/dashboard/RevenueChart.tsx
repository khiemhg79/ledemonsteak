"use client"

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type RevenueChartProps = {
  monthly: { month: string; revenue: number; orders: number }[]
  topDishes: { name: string; quantity: number }[]
  comboRatio: { comboItems: number; dishItems: number }
}

function chartData(monthly: RevenueChartProps["monthly"]) {
  return monthly.length ? monthly : [{ month: "Dec", revenue: 50, orders: 44 }]
}

export default function RevenueChart({ monthly, topDishes, comboRatio }: RevenueChartProps) {
  const top = topDishes.length ? topDishes : [
    { name: "Pepsi", quantity: 34 }, { name: "Nước lọc Dasani", quantity: 24 }, { name: "Coca", quantity: 17 }, { name: "Aging Sirloin Wagyu A5", quantity: 8 },
  ]
  const ratio = [
    { name: "Combo", value: comboRatio.comboItems || 35 },
    { name: "Lẻ", value: comboRatio.dishItems || 65 },
  ]
  const monthlyData = chartData(monthly)

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Doanh thu theo tháng">
        <ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyData}><CartesianGrid stroke="#17243A" /><XAxis dataKey="month" stroke="#D9E4F6" /><YAxis stroke="#D9E4F6" /><Tooltip /><Legend /><Line type="monotone" dataKey="revenue" name="value" stroke="#5DA8FF" strokeWidth={2} dot={{ r: 4 }} /></LineChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Món bán chạy">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={top}><XAxis dataKey="name" stroke="#D9E4F6" tick={{ fontSize: 12 }} /><YAxis stroke="#D9E4F6" /><Tooltip /><Bar dataKey="quantity" fill="#36D19B" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Tỷ lệ combo (%)">
        <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={ratio} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}><Cell fill="#5DA8FF" /><Cell fill="#9C7CF4" /></Pie><Legend /><Tooltip /></PieChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Doanh thu & số đơn">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData}><XAxis dataKey="month" stroke="#D9E4F6" /><YAxis stroke="#D9E4F6" /><Tooltip /><Legend /><Bar dataKey="revenue" name="Doanh thu" fill="#5DA8FF" radius={[8, 8, 0, 0]} /><Bar dataKey="orders" name="Số đơn" fill="#FFC928" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="h-[320px] rounded-2xl border border-[#1D2B46] bg-[#050918] p-5"><h2 className="font-black text-white">{title}</h2><div className="mt-4 h-[250px]">{children}</div></section>
}
