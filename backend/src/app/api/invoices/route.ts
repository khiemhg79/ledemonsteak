import { NextRequest, NextResponse } from "next/server"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { prisma } from "@/lib/prisma"
import { attachOrderItems } from "@/lib/orderLines"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function OPTIONS() { return optionsResponse() }

export async function GET(req: NextRequest) {
  try {
    const auth = authorize(req, ["STAFF", "ADMIN"])
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
    const invoices = await prisma.invoice.findMany({
      where: { status: "PAID" },
      orderBy: { paidAt: "desc" },
      take: 100,
      select: {
        id: true,
        invoiceCode: true,
        orderId: true,
        customerId: true,
        tableId: true,
        subtotal: true,
        customerName: true,
        customerTaxCode: true,
        taxAmount: true,
        total: true,
        paymentMethod: true,
        status: true,
        issuedAt: true,
        updatedAt: true,
        paidAt: true,
        note: true,
        table: { select: { id: true, number: true, capacity: true, status: true } },
        customer: {
          select: {
            id: true,
            name: true,
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        payments: { where: { status: "SUCCESS" }, orderBy: { paidAt: "desc" }, take: 1 },
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerNotes: true,
            orderDetails: {
              select: {
                id: true,
                itemId: true,
                comboId: true,
                quantity: true,
                price: true,
                status: true,
                item: { select: { id: true, name: true } },
                combo: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    })
    return NextResponse.json(invoices.map((invoice) => ({
      ...invoice,
      order: invoice.order ? attachOrderItems(invoice.order) : null,
    })), { headers: corsHeaders() })
  } catch (error) {
    console.error("Load invoices failed", error)
    return NextResponse.json({ error: "Khong tai duoc danh sach hoa don." }, { status: 500, headers: corsHeaders() })
  }
}
