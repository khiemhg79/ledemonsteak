import { NextRequest, NextResponse } from "next/server"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { prisma } from "@/lib/prisma"

export async function OPTIONS() { return optionsResponse() }

export async function GET(req: NextRequest) {
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
          details: {
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
    order: { ...invoice.order, items: invoice.order.details },
  })), { headers: corsHeaders() })
}
