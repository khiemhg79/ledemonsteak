import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }

export async function POST(req: NextRequest) {
  try {
    const { tableId, userId, items } = await req.json()
    if (!tableId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Bàn và danh sách món là bắt buộc." }, { status: 400, headers: corsHeaders() })
    }

    const normalizedItems = items.map((item: any) => ({
      itemId: item.itemId || null,
      comboId: item.comboId || null,
      quantity: Number(item.quantity),
    }))
    if (normalizedItems.some((item: any) =>
      !Number.isInteger(item.quantity) || item.quantity < 1 || (!!item.itemId === !!item.comboId)
    )) {
      return NextResponse.json({ error: "Dữ liệu món ăn không hợp lệ." }, { status: 400, headers: corsHeaders() })
    }

    const [table, menuItems, combos, customer] = await Promise.all([
      prisma.table.findUnique({ where: { id: tableId } }),
      prisma.item.findMany({ where: { id: { in: normalizedItems.flatMap((item: any) => item.itemId ? [item.itemId] : []) }, isActive: true } }),
      prisma.combo.findMany({ where: { id: { in: normalizedItems.flatMap((item: any) => item.comboId ? [item.comboId] : []) }, isActive: true } }),
      userId ? prisma.customer.findUnique({ where: { userId } }) : Promise.resolve(null),
    ])
    if (!table || !table.isActive) {
      return NextResponse.json({ error: "Bàn không tồn tại hoặc đã ngừng hoạt động." }, { status: 404, headers: corsHeaders() })
    }
    if (table.status === "REQUESTING_BILL") {
      return NextResponse.json({ error: "Bàn đang yêu cầu thanh toán, không thể tạo thêm đơn." }, { status: 409, headers: corsHeaders() })
    }

    const itemPrices = new Map(menuItems.map((item) => [item.id, item.price]))
    const comboPrices = new Map(combos.map((combo) => [combo.id, combo.price]))
    const details = normalizedItems.map((item: any) => ({
      itemId: item.itemId,
      comboId: item.comboId,
      quantity: item.quantity,
      price: item.itemId ? itemPrices.get(item.itemId) : comboPrices.get(item.comboId),
      status: "WAITING" as const,
    }))
    if (details.some((detail) => detail.price === undefined)) {
      return NextResponse.json({ error: "Có món không tồn tại hoặc đã ngừng bán." }, { status: 400, headers: corsHeaders() })
    }

    const pricedDetails = details.map((detail) => ({ ...detail, price: Number(detail.price) }))
    const totalAmount = pricedDetails.reduce((sum, detail) => sum + detail.price * detail.quantity, 0)
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          tableId,
          userId: userId ?? null,
          customerId: customer?.id ?? null,
          totalAmount,
          finalAmount: totalAmount,
          details: { create: pricedDetails },
        },
        include: { details: true },
      })
      await tx.table.update({ where: { id: tableId }, data: { status: "OCCUPIED" } })
      return created
    })
    return NextResponse.json({ ...order, items: order.details }, { status: 201, headers: corsHeaders() })
  } catch (error) {
    console.error("Create order failed", error)
    return NextResponse.json({ error: "Đặt món thất bại. Vui lòng thử lại sau." }, { status: 500, headers: corsHeaders() })
  }
}

export async function GET(req: NextRequest) {
  const tableId = req.nextUrl.searchParams.get("tableId")
  const status  = req.nextUrl.searchParams.get("status")
  const where: any = {}
  if (tableId) where.tableId = tableId
  if (status && status !== "ALL") where.status = status
  else if (!status) where.status = { in: ["PENDING", "CONFIRMED"] }
  const orders = await prisma.order.findMany({
    where,
    include: { details: { include: { item: true, combo: true } }, table: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(orders.map((order) => ({ ...order, items: order.details })), { headers: corsHeaders() })
}
