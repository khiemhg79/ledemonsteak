import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }
export async function GET() {
  const promos = await prisma.promotion.findMany({ orderBy: { startDate: "desc" } })
  return NextResponse.json(promos, { headers: corsHeaders() })
}
export async function POST(req: NextRequest) {
  const body = await req.json()
  const normalizedCode = String(body.code ?? "").trim().toUpperCase()
  if (!normalizedCode) return NextResponse.json({ error: "Vui lòng nhập mã giảm giá" }, { status: 400, headers: corsHeaders() })
  const id = `promo_${normalizedCode.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`
  const promo = await prisma.promotion.create({ data: { ...body, id, code: normalizedCode } })
  return NextResponse.json(promo, { status: 201, headers: corsHeaders() })
}
