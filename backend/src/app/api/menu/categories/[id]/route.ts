import { NextRequest, NextResponse } from "next/server"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { prisma } from "@/lib/prisma"

function adminOnly(req: NextRequest) {
  const auth = authorize(req, ["ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
  return null
}

function cleanText(value: unknown, max = 50) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max)
}

function buildCategoryPayload(body: any) {
  const name = cleanText(body.name, 50)
  const desc = cleanText(body.desc, 255)
  const sortOrder = Number(body.sortOrder ?? 0)
  const isActive = body.isActive !== false

  if (!name) return { error: "Vui lòng nhập tên danh mục." }
  if (!desc) return { error: "Vui lòng nhập mô tả danh mục." }
  if (!Number.isFinite(sortOrder) || sortOrder < 0) return { error: "Thứ tự sắp xếp không hợp lệ." }

  return { data: { name, desc, sortOrder: Math.trunc(sortOrder), isActive } }
}

export async function OPTIONS() {
  return optionsResponse()
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = adminOnly(req)
  if (denied) return denied

  const parsed = buildCategoryPayload(await req.json())
  if (parsed.error || !parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400, headers: corsHeaders() })

  const category = await prisma.category.update({ where: { id: params.id }, data: parsed.data })
  return NextResponse.json(category, { headers: corsHeaders() })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = adminOnly(req)
  if (denied) return denied

  await prisma.$transaction([
    prisma.category.update({ where: { id: params.id }, data: { isActive: false } }),
    prisma.item.updateMany({ where: { categoryId: params.id }, data: { isActive: false } }),
  ])
  return NextResponse.json({ message: "Đã xóa danh mục khỏi danh sách hoạt động." }, { headers: corsHeaders() })
}
