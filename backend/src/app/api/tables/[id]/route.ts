import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { authorize } from "@/lib/apiAuth"

export async function OPTIONS() { return optionsResponse() }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorize(req, ["STAFF", "ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
  const { number, status, capacity, isActive } = await req.json()
  if (auth.user.role === "STAFF" && (number !== undefined || capacity !== undefined || isActive !== undefined)) {
    return NextResponse.json({ error: "Nhân viên chỉ được cập nhật trạng thái bàn." }, { status: 403, headers: corsHeaders() })
  }
  if (status && !["EMPTY", "OCCUPIED", "REQUESTING_BILL"].includes(status)) {
    return NextResponse.json({ error: "Trạng thái bàn không hợp lệ." }, { status: 400, headers: corsHeaders() })
  }
  if (capacity !== undefined && (!Number.isInteger(Number(capacity)) || Number(capacity) < 1)) {
    return NextResponse.json({ error: "Sức chứa bàn phải là số nguyên lớn hơn 0." }, { status: 400, headers: corsHeaders() })
  }
  if (status) {
    const activeOrder = await prisma.order.findFirst({ where: { tableId: params.id, status: { in: ["PENDING", "CONFIRMED"] } }, select: { id: true } })
    if (activeOrder && status === "EMPTY") {
      return NextResponse.json({ error: "Không thể chuyển bàn về Trống khi hóa đơn chưa thanh toán." }, { status: 409, headers: corsHeaders() })
    }
    if (!activeOrder && status !== "EMPTY") {
      return NextResponse.json({ error: "TB02: Bàn chưa có đơn hàng đang hoạt động." }, { status: 409, headers: corsHeaders() })
    }
  }
  const table = await prisma.table.update({
    where: { id: params.id },
    data: {
      ...(number ? { number } : {}),
      ...(status ? { status } : {}),
      ...(capacity !== undefined ? { capacity: Number(capacity) } : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
    },
  })
  return NextResponse.json(table, { headers: corsHeaders() })
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorize(req, ["ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
  await prisma.table.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ message: "Đã ngừng sử dụng bàn" }, { headers: corsHeaders() })
}
