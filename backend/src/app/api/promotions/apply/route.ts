import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }
export async function POST(req: NextRequest) {
  const { code, orderAmount } = await req.json()
  const promo = await prisma.promotion.findFirst({
    where: { code, isActive: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
  })
  if (!promo) return NextResponse.json({ error: "Mã không hợp lệ" }, { status: 400, headers: corsHeaders() })
  if (orderAmount < promo.minOrder)
    return NextResponse.json({ error: `Đơn tối thiểu ${promo.minOrder.toLocaleString()}đ` }, { status: 400, headers: corsHeaders() })
  let discount = promo.discountType === "PERCENTAGE"
    ? (orderAmount * promo.discountValue) / 100 : promo.discountValue
  if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount)
  return NextResponse.json({ discount, finalAmount: orderAmount - discount, promo }, { headers: corsHeaders() })
}
