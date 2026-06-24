import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { authorize } from "@/lib/apiAuth"
import { calculatePromotion, PromotionError } from "@/lib/promotion"
import { qrTokenError, verifyTableQrToken } from "@/lib/qrToken"

export async function OPTIONS() { return optionsResponse() }

export async function POST(req: NextRequest) {
  try {
    const { tableId, userId, items, promoCode, qrToken } = await req.json()
    if (!tableId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Bàn và danh sách món là bắt buộc." }, { status: 400, headers: corsHeaders() })
    }

    try {
      verifyTableQrToken(String(qrToken ?? ""), String(tableId))
    } catch (error) {
      return NextResponse.json({ error: qrTokenError(error) }, { status: 401, headers: corsHeaders() })
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
    let discount = 0
    let finalAmount = totalAmount
    let appliedPromoCode: string | null = null
    if (promoCode) {
      const auth = authorize(req, ["CUSTOMER"])
      if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
      if (userId && auth.user.id !== userId) return NextResponse.json({ error: "Tài khoản không khớp với người đặt món." }, { status: 403, headers: corsHeaders() })
      const calculation = await calculatePromotion(promoCode, totalAmount)
      discount = calculation.discount
      finalAmount = calculation.finalAmount
      appliedPromoCode = calculation.promo.code
    }
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          tableId,
          userId: userId ?? null,
          customerId: customer?.id ?? null,
          totalAmount,
          discount,
          finalAmount,
          promoCode: appliedPromoCode,
          details: { create: pricedDetails },
        },
        include: { details: true },
      })
      await tx.table.update({ where: { id: tableId }, data: { status: "OCCUPIED" } })
      return created
    })
    return NextResponse.json({ ...order, items: order.details }, { status: 201, headers: corsHeaders() })
  } catch (error) {
    if (error instanceof PromotionError) return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders() })
    console.error("Create order failed", error)
    return NextResponse.json({ error: "Đặt món thất bại. Vui lòng thử lại sau." }, { status: 500, headers: corsHeaders() })
  }
}

export async function GET(req: NextRequest) {
  const tableId = req.nextUrl.searchParams.get("tableId")
  const status  = req.nextUrl.searchParams.get("status")
  const staffView = req.nextUrl.searchParams.get("view") === "staff"
  if (staffView) {
    const auth = authorize(req, ["STAFF", "ADMIN"])
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
  } else if (!tableId) {
    return NextResponse.json({ error: "Mã bàn là bắt buộc." }, { status: 400, headers: corsHeaders() })
  }
  const where: any = {}
  if (tableId) where.tableId = tableId
  if (status && status !== "ALL") where.status = status
  else if (!status) where.status = { in: ["PENDING", "CONFIRMED"] }
  const orders = await prisma.order.findMany({
    where,
    include: {
      details: {
        include: {
          item: { select: { id: true, name: true } },
          combo: { select: { id: true, name: true } },
        },
      },
      table: { select: { id: true, number: true, status: true } },
    },
    orderBy: { createdAt: staffView ? "asc" : "desc" },
  })
  return NextResponse.json(orders.map((order) => ({ ...order, items: order.details })), { headers: corsHeaders() })
}
