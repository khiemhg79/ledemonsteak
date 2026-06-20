import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { authorize } from "@/lib/apiAuth"

export async function OPTIONS() { return optionsResponse() }
export async function GET(req: NextRequest) {
  const auth = authorize(req, ["CUSTOMER", "ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
  const promos = await prisma.promotion.findMany({ orderBy: { startDate: "desc" } })
  if (auth.user.role === "ADMIN") return NextResponse.json(promos, { headers: corsHeaders() })
  const now = new Date()
  const available = promos
    .filter((promo) => promo.isActive && promo.endDate >= now && (promo.usageLimit == null || promo.usageCount < promo.usageLimit))
    .map((promo) => ({ ...promo, availabilityStatus: promo.startDate > now ? "UPCOMING" : "ACTIVE" }))
  return NextResponse.json(available, { headers: corsHeaders() })
}
export async function POST(req: NextRequest) {
  const auth = authorize(req, ["ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
  const body = await req.json()
  const normalizedCode = String(body.code ?? "").trim().toUpperCase()
  if (!normalizedCode) return NextResponse.json({ error: "Vui lòng nhập mã giảm giá" }, { status: 400, headers: corsHeaders() })
  const id = `promo_${normalizedCode.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`
  const promo = await prisma.promotion.create({ data: { ...body, id, code: normalizedCode } })
  return NextResponse.json(promo, { status: 201, headers: corsHeaders() })
}
