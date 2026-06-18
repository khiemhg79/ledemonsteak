import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }
export async function GET() {
  const [totalOrders, revenue, orderDetails, orders] = await Promise.all([
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.aggregate({ where: { status: "COMPLETED" }, _sum: { finalAmount: true } }),
    prisma.orderDetail.findMany({ include: { item: true, combo: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "asc" } }),
  ])

  const itemMap = new Map<string, { name: string; quantity: number }>()
  let comboItems = 0
  let dishItems = 0
  for (const item of orderDetails) {
    if (item.comboId) comboItems += item.quantity
    if (item.itemId) dishItems += item.quantity
    const name = item.item?.name ?? item.combo?.name ?? "Khác"
    const current = itemMap.get(name) ?? { name, quantity: 0 }
    current.quantity += item.quantity
    itemMap.set(name, current)
  }

  const monthlyMap = new Map<string, { month: string; revenue: number; orders: number }>()
  for (const order of orders) {
    const month = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`
    const current = monthlyMap.get(month) ?? { month, revenue: 0, orders: 0 }
    current.revenue += order.finalAmount
    current.orders += 1
    monthlyMap.set(month, current)
  }

  return NextResponse.json({
    totalOrders,
    totalRevenue: revenue._sum.finalAmount ?? 0,
    topDishes: Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    comboRatio: { comboItems, dishItems },
    monthly: Array.from(monthlyMap.values()),
  }, { headers: corsHeaders() })
}
