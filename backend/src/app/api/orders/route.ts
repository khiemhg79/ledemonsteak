import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { attachOrderItems, packOrderLines, StoredOrderLine } from "@/lib/orderLines"
import { prisma } from "@/lib/prisma"
import { calculatePromotion, PromotionError } from "@/lib/promotion"
import { qrTokenError, verifyTableQrToken } from "@/lib/qrToken"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function OPTIONS() { return optionsResponse() }

const orderDetailSelect = {
  id: true,
  itemId: true,
  comboId: true,
  quantity: true,
  price: true,
  status: true,
  item: { select: { id: true, name: true } },
  combo: { select: { id: true, name: true } },
} as const

export async function POST(req: NextRequest) {
  try {
    const { tableId, userId, items, promoCode, qrToken } = await req.json()
    if (!tableId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Ban va danh sach mon la bat buoc." }, { status: 400, headers: corsHeaders() })
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
      return NextResponse.json({ error: "Du lieu mon an khong hop le." }, { status: 400, headers: corsHeaders() })
    }

    const [table, menuItems, combos, customer] = await Promise.all([
      prisma.table.findUnique({ where: { id: tableId } }),
      prisma.item.findMany({ where: { id: { in: normalizedItems.flatMap((item: any) => item.itemId ? [item.itemId] : []) }, isActive: true } }),
      prisma.combo.findMany({ where: { id: { in: normalizedItems.flatMap((item: any) => item.comboId ? [item.comboId] : []) }, isActive: true } }),
      userId ? prisma.customer.findUnique({ where: { userId } }) : Promise.resolve(null),
    ])
    if (!table || !table.isActive) {
      return NextResponse.json({ error: "Ban khong ton tai hoac da ngung hoat dong." }, { status: 404, headers: corsHeaders() })
    }
    if (table.status === "REQUESTING_BILL") {
      return NextResponse.json({ error: "Ban dang yeu cau thanh toan, khong the tao them don." }, { status: 409, headers: corsHeaders() })
    }

    const itemMap = new Map(menuItems.map((item) => [item.id, item]))
    const comboMap = new Map(combos.map((combo) => [combo.id, combo]))
    const orderLines: StoredOrderLine[] = normalizedItems.map((item: any) => {
      const menuItem = item.itemId ? itemMap.get(item.itemId) : null
      const combo = item.comboId ? comboMap.get(item.comboId) : null
      return {
        id: randomUUID(),
        itemId: item.itemId,
        comboId: item.comboId,
        quantity: item.quantity,
        price: item.itemId ? Number(menuItem?.price) : Number(combo?.price),
        status: "WAITING",
        item: menuItem ? { id: menuItem.id, name: menuItem.name } : null,
        combo: combo ? { id: combo.id, name: combo.name } : null,
      }
    })
    if (orderLines.some((detail) => !Number.isFinite(detail.price))) {
      return NextResponse.json({ error: "Co mon khong ton tai hoac da ngung ban." }, { status: 400, headers: corsHeaders() })
    }

    const totalAmount = orderLines.reduce((sum, detail) => sum + detail.price * detail.quantity, 0)
    let discount = 0
    let finalAmount = totalAmount
    let appliedPromoCode: string | null = null
    if (promoCode) {
      const auth = authorize(req, ["CUSTOMER"])
      if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
      if (userId && auth.user.id !== userId) return NextResponse.json({ error: "Tai khoan khong khop voi nguoi dat mon." }, { status: 403, headers: corsHeaders() })
      const calculation = await calculatePromotion(promoCode, totalAmount, customer?.id)
      discount = calculation.discount
      finalAmount = calculation.finalAmount
      appliedPromoCode = calculation.promo.id
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
          customerNotes: packOrderLines(orderLines),
          orderDetails: {
            create: orderLines.map((line) => ({
              itemId: line.itemId,
              comboId: line.comboId,
              quantity: line.quantity,
              price: line.price,
              status: line.status,
            })),
          },
        },
        select: {
          id: true,
          orderNumber: true,
          tableId: true,
          userId: true,
          customerId: true,
          status: true,
          totalAmount: true,
          taxAmount: true,
          serviceCharge: true,
          discount: true,
          finalAmount: true,
          promoCode: true,
          customerNotes: true,
          createdAt: true,
          updatedAt: true,
          orderDetails: {
            select: orderDetailSelect,
          },
        },
      })
      await tx.table.update({ where: { id: tableId }, data: { status: "OCCUPIED" } })
      return created
    })
    return NextResponse.json(attachOrderItems(order), { status: 201, headers: corsHeaders() })
  } catch (error) {
    if (error instanceof PromotionError) return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders() })
    console.error("Create order failed", error)
    return NextResponse.json({ error: "Dat mon that bai. Vui long thu lai sau." }, { status: 500, headers: corsHeaders() })
  }
}

export async function GET(req: NextRequest) {
  try {
    const tableId = req.nextUrl.searchParams.get("tableId")
    const status = req.nextUrl.searchParams.get("status")
    const staffView = req.nextUrl.searchParams.get("view") === "staff"
    if (staffView) {
      const auth = authorize(req, ["STAFF", "ADMIN"])
      if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
    } else if (!tableId) {
      return NextResponse.json({ error: "Ma ban la bat buoc." }, { status: 400, headers: corsHeaders() })
    }

    const where: any = {}
    if (tableId) where.tableId = tableId
    if (status && status !== "ALL") where.status = status
    else if (!status) where.status = { in: ["PENDING", "CONFIRMED"] }

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        tableId: true,
        userId: true,
        customerId: true,
        status: true,
        totalAmount: true,
        taxAmount: true,
        serviceCharge: true,
        discount: true,
        finalAmount: true,
        promoCode: true,
        customerNotes: true,
        createdAt: true,
        updatedAt: true,
        table: { select: { id: true, number: true, status: true } },
        orderDetails: {
          select: orderDetailSelect,
        },
      },
      orderBy: { createdAt: staffView ? "asc" : "desc" },
      take: staffView ? 120 : 30,
    })
    return NextResponse.json(orders.map(attachOrderItems), { headers: corsHeaders() })
  } catch (error) {
    console.error("Load orders failed", error)
    return NextResponse.json({ error: "Khong tai duoc danh sach don hang." }, { status: 500, headers: corsHeaders() })
  }
}
