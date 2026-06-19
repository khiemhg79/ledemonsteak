import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { number, status, capacity, isActive } = await req.json()
  if (status === "EMPTY") {
    const activeOrder = await prisma.order.findFirst({
      where: { tableId: params.id, status: { in: ["PENDING", "CONFIRMED"] } },
      select: { id: true },
    })
    if (activeOrder) {
      return NextResponse.json({ error: "Không thể chuyển bàn về Trống khi hóa đơn chưa thanh toán" }, { status: 409, headers: corsHeaders() })
    }
  }
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
