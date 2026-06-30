import { NextRequest, NextResponse } from "next/server"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { prisma } from "@/lib/prisma"
import { attachOrderItems } from "@/lib/orderLines"

export const dynamic = "force-dynamic"
export const revalidate = 0

function adminOnly(req: NextRequest) {
  const auth = authorize(req, ["ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
  return null
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(key: string) {
  const [, month] = key.split("-")
  return `T${Number(month)}`
}

export async function OPTIONS() {
  return optionsResponse()
}

export async function GET(req: NextRequest) {
  try {
    const denied = adminOnly(req)
    if (denied) return denied

    const completedOrders = await prisma.order.findMany({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "asc" },
      take: 300,
      select: {
        id: true,
        finalAmount: true,
        createdAt: true,
        customerNotes: true,
        orderDetails: {
          include: {
            item: { select: { id: true, name: true } },
            combo: { select: { id: true, name: true } },
          },
        },
      },
    })

    const monthlyMap = new Map<string, { month: string; label: string; revenue: number; orders: number }>()
    for (const order of completedOrders) {
      const key = monthKey(order.createdAt)
      const current = monthlyMap.get(key) ?? { month: key, label: monthLabel(key), revenue: 0, orders: 0 }
      current.revenue += order.finalAmount
      current.orders += 1
      monthlyMap.set(key, current)
    }

    const topMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    let comboItems = 0
    let dishItems = 0
    for (const order of completedOrders) {
      for (const detail of attachOrderItems(order).items) {
        if (detail.comboId) comboItems += detail.quantity
        else dishItems += detail.quantity

        const name = detail.combo?.name ?? detail.item?.name ?? "Khac"
        const current = topMap.get(name) ?? { name, quantity: 0, revenue: 0 }
        current.quantity += detail.quantity
        current.revenue += detail.price * detail.quantity
        topMap.set(name, current)
      }
    }

    const monthly = Array.from(monthlyMap.values())
    const totalOrders = completedOrders.length
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.finalAmount, 0)
    const currentMonth = monthly.at(-1)
    const previousMonth = monthly.at(-2)
    const mom = previousMonth && previousMonth.revenue > 0
      ? ((currentMonth?.revenue ?? 0) - previousMonth.revenue) / previousMonth.revenue * 100
      : null

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
      mom,
      topDishes: Array.from(topMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 10),
      comboRatio: { comboItems, dishItems },
      monthly,
    }, { headers: corsHeaders() })
  } catch (error) {
    console.error("Load admin reports failed", error)
    return NextResponse.json({ error: "Khong tai duoc bao cao." }, { status: 500, headers: corsHeaders() })
  }
}
