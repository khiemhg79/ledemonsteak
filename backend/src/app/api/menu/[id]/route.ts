import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"

function adminOnly(req: NextRequest) {
  const auth = authorize(req, ["ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
  return null
}

function cleanText(value: unknown, max = 50) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max)
}

function cleanLongText(value: unknown) {
  return String(value ?? "").trim().slice(0, 500)
}

function cleanImage(value: unknown) {
  const image = String(value ?? "").trim()
  if (!image) return null
  if (image.startsWith("data:image/")) return image
  try {
    const url = new URL(image)
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

function buildDishPayload(body: any) {
  const name = cleanText(body.name, 50)
  const price = Number(body.price)
  const categoryId = String(body.categoryId ?? "").trim()
  const description = cleanLongText(body.description)
  const image = cleanImage(body.image)
  const isActive = body.isActive !== false

  if (!name) return { error: "Vui lòng nhập tên món ăn." }
  if (!Number.isFinite(price) || price <= 0) return { error: "Giá món ăn không hợp lệ." }
  if (price > 999999999) return { error: "Giá món ăn tối đa 999.999.999đ." }
  if (!categoryId) return { error: "Vui lòng chọn danh mục." }

  return { data: { name, price, categoryId, description: description || null, image, isActive } }
}

export async function OPTIONS() {
  return optionsResponse()
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const dish = await prisma.item.findUnique({ where: { id: params.id }, include: { category: true } })
  if (!dish) return NextResponse.json({ error: "Không tìm thấy món ăn." }, { status: 404, headers: corsHeaders() })
  return NextResponse.json(dish, { headers: corsHeaders() })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = adminOnly(req)
  if (denied) return denied

  const parsed = buildDishPayload(await req.json())
  if (parsed.error || !parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400, headers: corsHeaders() })

  const category = await prisma.category.findFirst({ where: { id: parsed.data.categoryId, isActive: true }, select: { id: true } })
  if (!category) return NextResponse.json({ error: "Danh mục không tồn tại hoặc đã tạm dừng." }, { status: 400, headers: corsHeaders() })

  const dish = await prisma.item.update({ where: { id: params.id }, data: parsed.data, include: { category: true } })
  return NextResponse.json(dish, { headers: corsHeaders() })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = adminOnly(req)
  if (denied) return denied

  await prisma.item.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ message: "Đã xóa món ăn khỏi danh sách hoạt động." }, { headers: corsHeaders() })
}
