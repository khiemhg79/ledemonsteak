import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { promoCode, complete, paymentMethod, receivedAmount } = await req.json()
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { invoice: true } })
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404, headers: corsHeaders() })

  if (complete) {
    const paidAmount = receivedAmount == null ? order.finalAmount : Number(receivedAmount)
    if (!Number.isFinite(paidAmount) || paidAmount < order.finalAmount) {
      return NextResponse.json({ error: "Số tiền nhận phải lớn hơn hoặc bằng tổng tiền hóa đơn" }, { status: 400, headers: corsHeaders() })
    }
    const invoice = order.invoice ?? await prisma.invoice.create({
      data: {
        invoiceCode: `INV-${order.id.slice(-8).toUpperCase()}`,
        orderId: order.id,
        customerId: order.customerId,
        tableId: order.tableId,
        subtotal: order.totalAmount,
        discount: order.discount,
        total: order.finalAmount,
      },
    })

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paidAt: new Date() },
    })
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        orderId: order.id,
        method: paymentMethod ?? "CASH",
        amount: paidAmount,
        status: "SUCCESS",
        paidAt: new Date(),
      },
    })
    await prisma.table.update({ where: { id: order.tableId }, data: { status: "EMPTY" } })
    const completed = await prisma.order.update({
      where: { id: params.id },
      data: { status: "COMPLETED" },
    })
    return NextResponse.json(completed, { headers: corsHeaders() })
  }

  let discount = 0
  if (promoCode) {
    const promo = await prisma.promotion.findFirst({
      where: { code: promoCode, isActive: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
    })
    if (promo && order.totalAmount >= promo.minOrder) {
      discount = promo.discountType === "PERCENTAGE"
        ? (order.totalAmount * promo.discountValue) / 100
        : promo.discountValue
      if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount)
    }
  }

  await prisma.table.update({ where: { id: order.tableId }, data: { status: "REQUESTING_BILL" } })
  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { discount, finalAmount: order.totalAmount - discount, promoCode: promoCode ?? null },
  })

  await prisma.invoice.upsert({
    where: { orderId: order.id },
    update: {
      customerId: order.customerId,
      tableId: order.tableId,
      subtotal: updated.totalAmount,
      discount: updated.discount,
      total: updated.finalAmount,
      status: "UNPAID",
    },
    create: {
      invoiceCode: `INV-${order.id.slice(-8).toUpperCase()}`,
      orderId: order.id,
      customerId: order.customerId,
      tableId: order.tableId,
      subtotal: updated.totalAmount,
      discount: updated.discount,
      total: updated.finalAmount,
      status: "UNPAID",
    },
  })

  return NextResponse.json(updated, { headers: corsHeaders() })
}
