import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"

type PromotionPayload = {
  id: string
  name: string
  discountType: string
  discountValue: number
  minOrder: number
  maxDiscount: number | null
  usageLimit: number | null
  startDate: Date
  endDate: Date
  description: string | null
  isActive: boolean
}

function cleanText(value: unknown, max = 50) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max)
}

function cleanCode(value: unknown) {
  return String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30)
}

function toNumber(value: unknown, fallback = 0) {
  if (value === "" || value == null) return fallback
  const number = Number(value)
  return Number.isFinite(number) ? number : NaN
}

function toDate(value: unknown) {
  const date = new Date(String(value ?? ""))
  return Number.isNaN(date.getTime()) ? null : date
}

function exposePromotion<T extends { id: string }>(promo: T) {
  return { ...promo, code: promo.id }
}

function buildPayload(body: any): { data?: PromotionPayload; error?: string } {
  const name = cleanText(body.name, 50)
  const id = cleanCode(body.code || body.id)
  const discountType = body.discountType === "FIXED" ? "FIXED" : "PERCENTAGE"
  const discountValue = toNumber(body.discountValue)
  const minOrder = toNumber(body.minOrder, 0)
  const maxDiscount = body.maxDiscount === "" || body.maxDiscount == null ? null : toNumber(body.maxDiscount)
  const usageLimit = body.usageLimit === "" || body.usageLimit == null ? null : Math.trunc(toNumber(body.usageLimit))
  const startDate = toDate(body.startDate)
  const endDate = toDate(body.endDate)
  const description = cleanText(body.description, 255) || null
  const isActive = body.isActive !== false

  if (!name) return { error: "Vui long nhap ten chuong trinh khuyen mai." }
  if (!id) return { error: "Vui long nhap ma khuyen mai." }
  if (!Number.isFinite(discountValue) || discountValue <= 0) return { error: "Gia tri khuyen mai khong hop le." }
  if (discountType === "PERCENTAGE" && discountValue > 100) return { error: "Gia tri phan tram khong duoc lon hon 100%." }
  if (discountType === "FIXED" && discountValue > 999999) return { error: "Gia tri giam theo so tien toi da la 999.999d." }
  if (!Number.isFinite(minOrder) || minOrder < 0) return { error: "Don toi thieu khong hop le." }
  if (maxDiscount != null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) return { error: "Giam toi da khong hop le." }
  if (usageLimit != null && (!Number.isFinite(usageLimit) || usageLimit <= 0)) return { error: "Gioi han su dung khong hop le." }
  if (!startDate || !endDate) return { error: "Ngay bat dau hoac ngay ket thuc khong hop le." }
  if (endDate < startDate) return { error: "Ngay ket thuc phai sau hoac bang ngay bat dau." }

  return {
    data: {
      id,
      name,
      discountType,
      discountValue,
      minOrder,
      maxDiscount,
      usageLimit,
      startDate,
      endDate,
      description,
      isActive,
    },
  }
}

export async function OPTIONS() {
  return optionsResponse()
}

export async function GET(req: NextRequest) {
  const auth = authorize(req, ["CUSTOMER", "ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })

  const promos = await prisma.promotion.findMany({ orderBy: [{ isActive: "desc" }, { startDate: "desc" }] })
  if (auth.user.role === "ADMIN") return NextResponse.json(promos.map(exposePromotion), { headers: corsHeaders() })

  const now = new Date()
  const available = promos
    .filter((promo) => promo.isActive && (promo.usageLimit == null || promo.usageCount < promo.usageLimit))
    .map((promo) => exposePromotion({
      ...promo,
      availabilityStatus: promo.startDate > now ? "UPCOMING" : "ACTIVE",
    }))
  return NextResponse.json(available, { headers: corsHeaders() })
}

export async function POST(req: NextRequest) {
  const auth = authorize(req, ["ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })

  const parsed = buildPayload(await req.json())
  if (parsed.error || !parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400, headers: corsHeaders() })

  const exists = await prisma.promotion.findUnique({ where: { id: parsed.data.id }, select: { id: true } })
  if (exists) return NextResponse.json({ error: "Ma khuyen mai da ton tai." }, { status: 409, headers: corsHeaders() })

  const promo = await prisma.promotion.create({ data: parsed.data })
  return NextResponse.json(exposePromotion(promo), { status: 201, headers: corsHeaders() })
}
