import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { authorize } from "@/lib/apiAuth"

export async function OPTIONS() { return optionsResponse() }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorize(req, ["STAFF", "ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
  const { itemId, status } = await req.json()
  const current = await prisma.orderDetail.findUnique({ where: { id: itemId } })
  if (!current || current.orderId !== params.id) {
    return NextResponse.json({ error: "Món ăn không thuộc đơn hàng này." }, { status: 404, headers: corsHeaders() })
  }
  const nextStatus: Record<string, string> = { WAITING: "PREPARING", PREPARING: "DONE", DONE: "SERVED" }
  if (nextStatus[current.status] !== status) {
    return NextResponse.json({ error: "Trạng thái món phải được cập nhật lần lượt: Bắt đầu → Xong món → Đã phục vụ." }, { status: 409, headers: corsHeaders() })
  }
  const item = await prisma.orderDetail.update({ where: { id: itemId }, data: { status } })
  return NextResponse.json(item, { headers: corsHeaders() })
}
