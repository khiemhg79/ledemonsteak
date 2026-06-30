import { NextRequest, NextResponse } from "next/server"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 0

function adminOnly(req: NextRequest) {
  const auth = authorize(req, ["ADMIN"])
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status, headers: corsHeaders() }
    )
  }
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
      where: {
        status: "COMPLETED",
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 300,
      include: {
        orderDetails: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
              },
            },
            combo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    const monthlyMap = new Map<
      string,
      { month: string; label: string; revenue: number; orders: number }
    >()

    const topMap = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >()

    let comboItems = 0
    let dishItems = 0

    for (const order of completedOrders) {
      const key = monthKey(order.createdAt)

      const currentMonth = monthlyMap.get(key) ?? {
        month: key,
        label: monthLabel(key),
        revenue: 0,
        orders: 0,
      }

      currentMonth.revenue += Number(order.finalAmount || 0)
      currentMonth.orders += 1
      monthlyMap.set(key, currentMonth)

      for (const detail of order.orderDetails ?? []) {
        const quantity = Number(detail.quantity || 0)
        const price = Number(detail.price || 0)

        if (detail.comboId) comboItems += quantity
        else dishItems += quantity

        const name = detail.combo?.name ?? detail.item?.name ?? "Khác"

        const currentDish = topMap.get(name) ?? {
          name,
          quantity: 0,
          revenue: 0,
        }

        currentDish.quantity += quantity
        currentDish.revenue += price * quantity
        topMap.set(name, currentDish)
      }
    }

    const monthly = Array.from(monthlyMap.values())
    const totalOrders = completedOrders.length
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + Number(order.finalAmount || 0),
      0
    )

    const currentMonth = monthly.at(-1)
    const previousMonth = monthly.at(-2)

    const mom =
      previousMonth && previousMonth.revenue > 0
        ? (((currentMonth?.revenue ?? 0) - previousMonth.revenue) /
          previousMonth.revenue) *
        100
        : null

    return NextResponse.json(
      {
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders
          ? Math.round(totalRevenue / totalOrders)
          : 0,
        mom,
        topDishes: Array.from(topMap.values())
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10),
        comboRatio: {
          comboItems,
          dishItems,
        },
        monthly,
      },
      { headers: corsHeaders() }
    )
  } catch (error) {
    console.error("Load admin reports failed", error)

    return NextResponse.json(
      { error: "Khong tai duoc bao cao." },
      { status: 500, headers: corsHeaders() }
    )
  }
}