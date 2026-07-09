import { NextRequest, NextResponse } from "next/server"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { attachOrderItems } from "@/lib/orderLines"
import { prisma } from "@/lib/prisma"
import { calculatePromotion, PromotionError } from "@/lib/promotion"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function OPTIONS() { return optionsResponse() }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { promoCode, complete, paymentMethod, receivedAmount } = await req.json()
    const order = await prisma.order.findUnique({
      where: { id: params.id },
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
      },
    })
    if (!order) return NextResponse.json({ error: "Khong tim thay don." }, { status: 404, headers: corsHeaders() })
    if (!order.tableId) return NextResponse.json({ error: "Don hang chua gan ban, khong the thanh toan." }, { status: 400, headers: corsHeaders() })

    if (complete) {
      const auth = authorize(req, ["STAFF", "ADMIN"])
      if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
      if (order.status === "COMPLETED") return NextResponse.json({ error: "Don hang da duoc thanh toan." }, { status: 409, headers: corsHeaders() })

      const allowedMethods = ["CASH", "BANK_TRANSFER", "CARD", "E_WALLET"] as const
      const selectedMethod = allowedMethods.includes(paymentMethod) ? paymentMethod : "CASH"
      const payableTotal = Number(order.finalAmount || order.totalAmount || 0)
      const paidAmount = receivedAmount == null ? payableTotal : Number(receivedAmount)
      if (!Number.isFinite(paidAmount) || paidAmount < payableTotal) {
        return NextResponse.json({ error: "So tien nhan phai lon hon hoac bang tong tien hoa don." }, { status: 400, headers: corsHeaders() })
      }

      const paidAt = new Date()
      const completedOrder = await prisma.$transaction(async (tx) => {
        await tx.table.update({ where: { id: order.tableId! }, data: { status: "EMPTY" } })
        await tx.orderDetail.updateMany({ where: { orderId: params.id }, data: { status: "SERVED" } })
        await tx.order.update({ where: { id: params.id }, data: { status: "COMPLETED" } })

        if (order.promoCode) {
          const promotion = await tx.promotion.findFirst({
            where: { OR: [{ id: order.promoCode }, { name: order.promoCode }] },
            select: { id: true },
          })
          if (promotion) {
            await tx.promotion.update({ where: { id: promotion.id }, data: { usageCount: { increment: 1 } } })
          }
          if (promotion && order.customerId) {
            const existingCustomerPromotion = await tx.customerPromotion.findFirst({
              where: { customerId: order.customerId, promotionId: promotion.id },
              select: { id: true },
            })
            if (existingCustomerPromotion) {
              await tx.customerPromotion.update({
                where: { id: existingCustomerPromotion.id },
                data: { isUsed: true, usedAt: paidAt },
              })
            } else {
              await tx.customerPromotion.create({
                data: { customerId: order.customerId, promotionId: promotion.id, isUsed: true, usedAt: paidAt },
              })
            }
          }
        }

        const completedOrder = await tx.order.findUnique({
          where: { id: params.id },
          include: {
            table: { select: { id: true, number: true, status: true } },
            customer: {
              select: {
                id: true,
                name: true,
                user: { select: { id: true, name: true, phone: true } },
              },
            },
            orderDetails: {
              include: {
                item: { select: { id: true, name: true } },
                combo: { select: { id: true, name: true } },
              },
            },
          },
        })
        return completedOrder
      }, { maxWait: 10000, timeout: 20000 })

      let invoice: any = {
        id: `local-${order.id}`,
        invoiceCode: `INV-${order.orderNumber}`,
        subtotal: order.totalAmount,
        taxAmount: order.taxAmount,
        total: payableTotal,
        paymentMethod: selectedMethod,
        status: "PAID",
        paidAt,
        issuedAt: paidAt,
        updatedAt: paidAt,
      }
      try {
        const existingInvoice = await prisma.invoice.findFirst({ where: { orderId: order.id }, select: { id: true } })
        invoice = existingInvoice
          ? await prisma.invoice.update({
            where: { id: existingInvoice.id },
            data: {
              customerId: order.customerId,
              tableId: order.tableId,
              subtotal: order.totalAmount,
              taxAmount: order.taxAmount,
              total: payableTotal,
              status: "PAID",
              paidAt,
              paymentMethod: selectedMethod,
            },
          })
          : await prisma.invoice.create({
            data: {
              invoiceCode: `INV-${order.orderNumber}-${Date.now().toString().slice(-5)}`,
              orderId: order.id,
              customerId: order.customerId,
              tableId: order.tableId,
              subtotal: order.totalAmount,
              taxAmount: order.taxAmount,
              total: payableTotal,
              paymentMethod: selectedMethod,
              status: "PAID",
              paidAt,
            },
          })
      } catch (error) {
        console.warn("Invoice write skipped", error)
      }

      let payment: any = {
        id: `local-${order.id}`,
        invoiceId: invoice.id,
        orderId: order.id,
        method: selectedMethod,
        amount: payableTotal,
        paidAmount,
        changeAmount: paidAmount - payableTotal,
        status: "SUCCESS",
        paidAt,
        createdAt: paidAt,
        updatedAt: paidAt,
      }
      try {
        payment = await prisma.payment.create({
          data: {
            invoiceId: invoice.id?.startsWith?.("local-") ? null : invoice.id,
            orderId: order.id,
            method: selectedMethod,
            amount: payableTotal,
            paidAmount,
            changeAmount: paidAmount - payableTotal,
            status: "SUCCESS",
            paidAt,
          },
        })
      } catch (error) {
        console.warn("Payment write skipped", error)
      }

      return NextResponse.json({
        invoice: { ...invoice, discount: order.discount },
        payment,
        order: completedOrder ? attachOrderItems(completedOrder) : null,
        receivedAmount: paidAmount,
        changeAmount: paidAmount - payableTotal,
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
        const calculation = await calculatePromotion(requestedPromoCode, order.totalAmount, order.customerId)
        discount = calculation.discount
        finalAmount = calculation.finalAmount
        appliedPromoCode = calculation.promo.id
      } catch (error) {
        if (error instanceof PromotionError) return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders() })
        throw error
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.table.update({ where: { id: order.tableId! }, data: { status: "REQUESTING_BILL" } })
      const updated = await tx.order.update({
        where: { id: params.id },
        data: { status: "REQUESTING_BILL", discount, finalAmount, promoCode: appliedPromoCode },
      })
      return updated
    }, { maxWait: 10000, timeout: 20000 })

    try {
      const existingInvoice = await prisma.invoice.findFirst({ where: { orderId: order.id }, select: { id: true } })
      if (existingInvoice) {
        await prisma.invoice.update({
          where: { id: existingInvoice.id },
          data: {
            customerId: order.customerId,
            tableId: order.tableId,
            subtotal: updated.totalAmount,
            taxAmount: updated.taxAmount,
            total: updated.finalAmount,
            status: "UNPAID",
          },
          select: { id: true },
        })
      } else {
        await prisma.invoice.create({
          data: {
            invoiceCode: `INV-${order.orderNumber}-${Date.now().toString().slice(-5)}`,
            orderId: order.id,
            customerId: order.customerId,
            tableId: order.tableId,
            subtotal: updated.totalAmount,
            taxAmount: updated.taxAmount,
            total: updated.finalAmount,
            status: "UNPAID",
          },
          select: { id: true },
        })
      }
    } catch (error) {
      console.warn("Pending invoice write skipped", error)
    }

    return NextResponse.json(attachOrderItems({ ...updated, orderDetails: [] }), { headers: corsHeaders() })
  } catch (error) {
    console.error("Checkout failed", error)
    return NextResponse.json({ error: "Xu ly thanh toan that bai." }, { status: 500, headers: corsHeaders() })
  }
}
