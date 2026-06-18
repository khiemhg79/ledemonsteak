import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const dish = await prisma.item.findUnique({ where: { id: params.id }, include: { category: true } })
  if (!dish) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404, headers: corsHeaders() })
  return NextResponse.json(dish, { headers: corsHeaders() })
}
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json(await prisma.item.update({ where: { id: params.id }, data: await req.json() }), { headers: corsHeaders() })
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.item.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ message: "Đã ngừng món ăn" }, { headers: corsHeaders() })
}
