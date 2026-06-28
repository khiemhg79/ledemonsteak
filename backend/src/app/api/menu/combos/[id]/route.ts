import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"

type ComboItemInput = { itemId: string; quantity: number }

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

function buildComboPayload(body: any) {
  const name = cleanText(body.name, 50)
  const price = Number(body.price)
  const description = cleanLongText(body.description)
  const image = cleanImage(body.image)
  const isActive = body.isActive !== false
  const rawItems = Array.isArray(body.items) ? body.items : []
  const items: ComboItemInput[] = rawItems
    .map((item: any) => ({ itemId: String(item.itemId ?? "").trim(), quantity: Math.trunc(Number(item.quantity)) }))
    .filter((item: ComboItemInput) => item.itemId && Number.isFinite(item.quantity) && item.quantity > 0)

  if (!name) return { error: "Vui lòng nhập tên combo." }
  if (!Number.isFinite(price) || price <= 0) return { error: "Giá combo không hợp lệ." }
  if (price > 999999999) return { error: "Giá combo tối đa 999.999.999đ." }

  const merged = new Map<string, number>()
  items.forEach((item) => merged.set(item.itemId, (merged.get(item.itemId) ?? 0) + item.quantity))

  return {
    data: { name, price, description: description || null, image, isActive },
    items: Array.from(merged.entries()).map(([itemId, quantity]) => ({ itemId, quantity })),
  }
}

export async function OPTIONS() {
  return optionsResponse()
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = adminOnly(req)
  if (denied) return denied

  const parsed = buildComboPayload(await req.json())
  if (parsed.error || !parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400, headers: corsHeaders() })

  if (parsed.items.length > 0) {
    const activeItems = await prisma.item.count({ where: { id: { in: parsed.items.map((item) => item.itemId) }, isActive: true } })
    if (activeItems !== parsed.items.length) return NextResponse.json({ error: "Danh sách món trong combo không hợp lệ." }, { status: 400, headers: corsHeaders() })
  }

  const combo = await prisma.combo.update({
    where: { id: params.id },
    data: parsed.data,
  })

  return NextResponse.json({ ...combo, items: parsed.items }, { headers: corsHeaders() })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = adminOnly(req)
  if (denied) return denied

  await prisma.combo.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ message: "Đã xóa combo khỏi danh sách hoạt động." }, { headers: corsHeaders() })
}
