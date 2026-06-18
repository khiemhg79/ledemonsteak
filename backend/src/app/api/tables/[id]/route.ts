import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { number, status, capacity, isActive } = await req.json()
  const table = await prisma.table.update({
    where: { id: params.id },
    data: {
      ...(number ? { number } : {}),
      ...(status ? { status } : {}),
      ...(capacity ? { capacity } : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
    },
  })
  return NextResponse.json(table, { headers: corsHeaders() })
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.table.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ message: "Đã ngừng sử dụng bàn" }, { headers: corsHeaders() })
}
