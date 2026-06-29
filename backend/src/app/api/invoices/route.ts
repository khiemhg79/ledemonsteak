import { NextRequest, NextResponse } from "next/server"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { prisma } from "@/lib/prisma"
import { attachOrderItems } from "@/lib/orderLines"

export async function OPTIONS() { return optionsResponse() }

export async function GET(req: NextRequest) {
  try {
    const auth = authorize(req, ["STAFF", "ADMIN"])
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
    const invoices = await prisma.invoice.findMany({
      where: { status: "PAID" },
      orderBy: { paidAt: "desc" },
      include: {
        table: true,
        customer: { include: { user: true } },
        payments: { where: { status: "SUCCESS" }, orderBy: { paidAt: "desc" }, take: 1 },
        order: {
          include: {
            orderDetails: {
              include: {
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
