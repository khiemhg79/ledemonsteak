import { NextRequest, NextResponse } from "next/server"
import { DiscountType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"

type PromotionPayload = {
  name: string
  code: string
  discountType: DiscountType
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

function buildPayload(body: any): { data?: PromotionPayload; error?: string } {
  const name = cleanText(body.name, 50)
  const code = cleanCode(body.code)
  const discountType = body.discountType === DiscountType.FIXED ? DiscountType.FIXED : DiscountType.PERCENTAGE
  const discountValue = toNumber(body.discountValue)
  const minOrder = toNumber(body.minOrder, 0)
  const maxDiscount = body.maxDiscount === "" || body.maxDiscount == null ? null : toNumber(body.maxDiscount)
  const usageLimit = body.usageLimit === "" || body.usageLimit == null ? null : Math.trunc(toNumber(body.usageLimit))
  const startDate = toDate(body.startDate)
  const endDate = toDate(body.endDate)
  const description = cleanText(body.description, 255) || null
  const isActive = body.isActive !== false

  if (!name) return { error: "Vui lòng nhập tên chương trình khuyến mãi." }
  if (!code) return { error: "Vui lòng nhập mã khuyến mãi." }
  if (!Number.isFinite(discountValue) || discountValue <= 0) return { error: "Giá trị khuyến mãi không hợp lệ." }
  if (discountType === DiscountType.PERCENTAGE && discountValue > 100) return { error: "Giá trị phần trăm không được lớn hơn 100%." }
  if (discountType === DiscountType.FIXED && discountValue > 999999) return { error: "Giá trị giảm theo số tiền tối đa là 999.999đ." }
  if (!Number.isFinite(minOrder) || minOrder < 0) return { error: "Đơn tối thiểu không hợp lệ." }
  if (maxDiscount != null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) return { error: "Giảm tối đa không hợp lệ." }
  if (usageLimit != null && (!Number.isFinite(usageLimit) || usageLimit <= 0)) return { error: "Giới hạn sử dụng không hợp lệ." }
  if (!startDate || !endDate) return { error: "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ." }
  if (endDate < startDate) return { error: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu." }

  return { data: { name, code, discountType, discountValue, minOrder, maxDiscount, usageLimit, startDate, endDate, description, isActive } }
}

export async function OPTIONS() {
  return optionsResponse()
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorize(req, ["ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })

  const parsed = buildPayload(await req.json())
  if (parsed.error || !parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400, headers: corsHeaders() })

  const duplicate = await prisma.promotion.findFirst({ where: { code: parsed.data.code, NOT: { id: params.id } }, select: { id: true } })
  if (duplicate) return NextResponse.json({ error: "Mã khuyến mãi đã tồn tại." }, { status: 409, headers: corsHeaders() })

  const promo = await prisma.promotion.update({ where: { id: params.id }, data: parsed.data })
  return NextResponse.json(promo, { headers: corsHeaders() })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorize(req, ["ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })

  await prisma.promotion.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ message: "Đã xóa khuyến mãi khỏi danh sách hoạt động." }, { headers: corsHeaders() })
}
