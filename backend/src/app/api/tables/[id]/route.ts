import { NextRequest, NextResponse } from "next/server"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { prisma } from "@/lib/prisma"

const tableStatuses = ["EMPTY", "OCCUPIED", "REQUESTING_BILL"] as const

function authError(req: NextRequest, roles: string[]) {
  const auth = authorize(req, roles)
  if (!auth.ok) return { response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() }) }
  return { auth }
}

function cleanTableNumber(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, "").slice(0, 10).toUpperCase()
}

async function hasActiveBill(tableId: string) {
  const [activeOrder, unpaidInvoice] = await Promise.all([
    prisma.order.findFirst({ where: { tableId, status: { in: ["PENDING", "CONFIRMED"] } }, select: { id: true } }),
    prisma.invoice.findFirst({ where: { tableId, status: "UNPAID" }, select: { id: true } }),
  ])
  return Boolean(activeOrder || unpaidInvoice)
}

export async function OPTIONS() {
  return optionsResponse()
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const checked = authError(req, ["STAFF", "ADMIN"])
  if (checked.response) return checked.response

  const body = await req.json()
  const { auth } = checked
  const data: Record<string, unknown> = {}

  if (auth.user.role === "STAFF" && (body.number !== undefined || body.capacity !== undefined || body.isActive !== undefined)) {
    return NextResponse.json({ error: "Nhân viên chỉ được cập nhật trạng thái bàn." }, { status: 403, headers: corsHeaders() })
  }

  if (body.status !== undefined) {
    const status = String(body.status)
    if (!tableStatuses.includes(status as any)) return NextResponse.json({ error: "Trạng thái bàn không hợp lệ." }, { status: 400, headers: corsHeaders() })

    const activeBill = await hasActiveBill(params.id)
    if (activeBill && status === "EMPTY") {
      return NextResponse.json({ error: "Không thể chuyển bàn về Trống khi hóa đơn chưa thanh toán." }, { status: 409, headers: corsHeaders() })
    }
    if (!activeBill && status !== "EMPTY") {
      return NextResponse.json({ error: "TB02: Bàn chưa có đơn hàng đang hoạt động." }, { status: 409, headers: corsHeaders() })
    }
    data.status = status
  }

  if (auth.user.role === "ADMIN") {
    if (body.number !== undefined) {
      const number = cleanTableNumber(body.number)
      if (!number) return NextResponse.json({ error: "Vui lòng nhập số bàn." }, { status: 400, headers: corsHeaders() })
      if (!/^[A-Z0-9_-]{1,10}$/.test(number)) return NextResponse.json({ error: "Số bàn chỉ được gồm chữ, số, dấu gạch ngang hoặc gạch dưới." }, { status: 400, headers: corsHeaders() })

      const existed = await prisma.table.findUnique({ where: { number }, select: { id: true } })
      if (existed && existed.id !== params.id) return NextResponse.json({ error: "Số bàn đã tồn tại trong hệ thống." }, { status: 409, headers: corsHeaders() })
      data.number = number
    }

    if (body.capacity !== undefined) {
      const capacity = Number(body.capacity)
      if (!Number.isInteger(capacity) || capacity <= 0) return NextResponse.json({ error: "Sức chứa phải là số nguyên lớn hơn 0." }, { status: 400, headers: corsHeaders() })
      data.capacity = capacity
    }

    if (typeof body.isActive === "boolean") data.isActive = body.isActive
  }

  const table = await prisma.table.update({ where: { id: params.id }, data })
  return NextResponse.json(table, { headers: corsHeaders() })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const checked = authError(req, ["ADMIN"])
  if (checked.response) return checked.response

  const table = await prisma.table.findUnique({ where: { id: params.id }, select: { status: true } })
  if (!table) return NextResponse.json({ error: "Không tìm thấy bàn." }, { status: 404, headers: corsHeaders() })
  if (table.status !== "EMPTY" || await hasActiveBill(params.id)) {
    return NextResponse.json({ error: "Không thể xóa bàn đang dùng hoặc còn hóa đơn chưa thanh toán." }, { status: 409, headers: corsHeaders() })
  }

  await prisma.table.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ message: "Đã xóa bàn khỏi danh sách hoạt động." }, { headers: corsHeaders() })
}
