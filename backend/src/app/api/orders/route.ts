import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }

export async function POST(req: NextRequest) {
  const { tableId, userId, items } = await req.json()
  const totalAmount = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)
  const customer = userId ? await prisma.customer.findUnique({ where: { userId } }) : null
  const order = await prisma.order.create({
    data: {
      tableId,
      userId: userId ?? null,
      customerId: customer?.id ?? null,
      totalAmount,
      finalAmount: totalAmount,
      details: { create: items.map((i: any) => ({ itemId: i.itemId ?? null, comboId: i.comboId ?? null, quantity: i.quantity, price: i.price, status: "WAITING" })) },
    },
    include: { details: true },
  })
  await prisma.table.update({ where: { id: tableId }, data: { status: "OCCUPIED" } })
  return NextResponse.json({ ...order, items: order.details }, { status: 201, headers: corsHeaders() })
}

export async function GET(req: NextRequest) {
  const tableId = req.nextUrl.searchParams.get("tableId")
  const status  = req.nextUrl.searchParams.get("status")
  const where: any = {}
  if (tableId) where.tableId = tableId
  if (status) where.status = status
  else where.status = { in: ["PENDING", "CONFIRMED"] }
  const orders = await prisma.order.findMany({
    where,
    include: { details: { include: { item: true, combo: true } }, table: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(orders.map((order) => ({ ...order, items: order.details })), { headers: corsHeaders() })
}
