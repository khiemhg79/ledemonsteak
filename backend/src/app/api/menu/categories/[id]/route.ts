import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json(await prisma.category.update({ where: { id: params.id }, data: await req.json() }), { headers: corsHeaders() })
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.$transaction([
    prisma.category.update({ where: { id: params.id }, data: { isActive: false } }),
    prisma.item.updateMany({ where: { categoryId: params.id }, data: { isActive: false } }),
  ])
  return NextResponse.json({ message: "Đã ngừng danh mục" }, { headers: corsHeaders() })
}
