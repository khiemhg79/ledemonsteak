import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { authorize } from "@/lib/apiAuth"
import { calculatePromotion, PromotionError } from "@/lib/promotion"
import { attachOrderItems } from "@/lib/orderLines"

export async function OPTIONS() { return optionsResponse() }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { promoCode, complete, paymentMethod, receivedAmount } = await req.json()
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { invoice: true } })
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404, headers: corsHeaders() })

  if (complete) {
    const auth = authorize(req, ["STAFF", "ADMIN"])
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
    if (order.status === "COMPLETED") return NextResponse.json({ error: "Đơn hàng đã được thanh toán." }, { status: 409, headers: corsHeaders() })
    const allowedMethods = ["CASH", "BANK_TRANSFER", "CARD", "E_WALLET"] as const
    const selectedMethod = allowedMethods.includes(paymentMethod) ? paymentMethod : "CASH"
    const paidAmount = receivedAmount == null ? order.finalAmount : Number(receivedAmount)
    if (!Number.isFinite(paidAmount) || paidAmount < order.finalAmount) {
      return NextResponse.json({ error: "Số tiền nhận phải lớn hơn hoặc bằng tổng tiền hóa đơn" }, { status: 400, headers: corsHeaders() })
    }
    const paidAt = new Date()
    const result = await prisma.$transaction(async (tx) => {
      const invoice = order.invoice ?? await tx.invoice.create({
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
      const paidInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID", paidAt, paymentMethod: selectedMethod },
      })
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          orderId: order.id,
          method: selectedMethod,
          amount: paidAmount,
          paidAmount,
          changeAmount: paidAmount - order.finalAmount,
          status: "SUCCESS",
          paidAt,
        },
      })
      await tx.table.update({ where: { id: order.tableId }, data: { status: "EMPTY" } })
      await tx.order.update({ where: { id: params.id }, data: { status: "COMPLETED" } })
      if (order.promoCode) await tx.promotion.update({ where: { code: order.promoCode }, data: { usageCount: { increment: 1 } } })
      const completedOrder = await tx.order.findUnique({
        where: { id: params.id },
        include: { table: true, customer: { include: { user: true } } },
      })
      return {
        invoice: paidInvoice,
        payment,
        order: completedOrder ? attachOrderItems(completedOrder) : null,
      }
    })
    return NextResponse.json({
      ...result,
      receivedAmount: paidAmount,
      changeAmount: paidAmount - order.finalAmount,
    }, { headers: corsHeaders() })
  }

  const requestedPromoCode = promoCode || order.promoCode
  let discount = 0
  let finalAmount = order.totalAmount
  let appliedPromoCode: string | null = null
  if (requestedPromoCode) {
    const auth = authorize(req, ["CUSTOMER"])
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
    try {
      const calculation = await calculatePromotion(requestedPromoCode, order.totalAmount)
      discount = calculation.discount
      finalAmount = calculation.finalAmount
      appliedPromoCode = calculation.promo.code
    } catch (error) {
      if (error instanceof PromotionError) return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders() })
      throw error
    }
  }

  await prisma.table.update({ where: { id: order.tableId }, data: { status: "REQUESTING_BILL" } })
  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { discount, finalAmount, promoCode: appliedPromoCode },
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
