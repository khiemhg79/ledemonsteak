import { NextRequest, NextResponse } from "next/server"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { prisma } from "@/lib/prisma"

const tableStatuses = ["EMPTY", "OCCUPIED", "REQUESTING_BILL"] as const

export const dynamic = "force-dynamic"
export const revalidate = 0

function authError(req: NextRequest, roles: string[]) {
  const auth = authorize(req, roles)
  if (!auth.ok) return { response: NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() }) }
  return { auth }
}

function cleanTableNumber(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, "").slice(0, 10).toUpperCase()
}

function buildTablePayload(body: any) {
  const number = cleanTableNumber(body.number)
  const capacity = Number(body.capacity)
  const status = String(body.status ?? "EMPTY")
  const isActive = body.isActive !== false

  if (!number) return { error: "Vui lòng nhập số bàn." }
  if (!/^[A-Z0-9_-]{1,10}$/.test(number)) return { error: "Số bàn chỉ được gồm chữ, số, dấu gạch ngang hoặc gạch dưới." }
  if (!Number.isInteger(capacity) || capacity <= 0) return { error: "Sức chứa phải là số nguyên lớn hơn 0." }
  if (!tableStatuses.includes(status as any)) return { error: "Trạng thái bàn không hợp lệ." }

  return { data: { number, capacity, status: status as typeof tableStatuses[number], isActive } }
}

export async function OPTIONS() {
  return optionsResponse()
}

export async function GET(req: NextRequest) {
  const checked = authError(req, ["STAFF", "ADMIN"])
  if (checked.response) return checked.response

  const overview = req.nextUrl.searchParams.get("overview") === "1"
  const tableQuery = prisma.table.findMany({
    where: { isActive: true },
    select: { id: true, number: true, capacity: true, status: true, isActive: true },
    orderBy: { number: "asc" },
  })
  const activeOrderWhere = {
    tableId: { not: null },
    status: { notIn: ["COMPLETED", "CANCELLED"] },
  }

  if (overview) {
    const [tables, orders] = await Promise.all([
      tableQuery,
      prisma.order.findMany({
        where: activeOrderWhere,
        select: {
          id: true,
          orderNumber: true,
          tableId: true,
          status: true,
          totalAmount: true,
          discount: true,
          finalAmount: true,
          promoCode: true,
          createdAt: true,
          updatedAt: true,
          table: { select: { id: true, number: true, status: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 120,
      }),
    ])

    const activeOrderTableIds = new Set(orders.map((order) => order.tableId).filter(Boolean))
    const syncedTables = tables.map((table) => {
      if (table.status === "REQUESTING_BILL") return table
      if (activeOrderTableIds.has(table.id)) return { ...table, status: "OCCUPIED" }
      if (table.status === "OCCUPIED") return { ...table, status: "EMPTY" }
      return table
    })
    const syncedStatusByTableId = new Map(syncedTables.map((table) => [table.id, table.status]))

    return NextResponse.json({
      tables: syncedTables,
      orders: orders.map((order) => ({
        ...order,
        table: order.table ? { ...order.table, status: syncedStatusByTableId.get(order.table.id) ?? order.table.status } : order.table,
        items: [],
      })),
    }, { headers: corsHeaders() })
  }

  const [tables, activeOrders] = await Promise.all([
    tableQuery,
    prisma.order.findMany({
      where: {
        tableId: { not: null },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      distinct: ["tableId"],
      select: { tableId: true },
    }),
  ])

  const activeOrderTableIds = new Set(activeOrders.map((order) => order.tableId).filter(Boolean))
  const syncedTables = tables.map((table) => {
    if (table.status === "REQUESTING_BILL") return table
    if (activeOrderTableIds.has(table.id)) return { ...table, status: "OCCUPIED" }
    if (table.status === "OCCUPIED") return { ...table, status: "EMPTY" }
    return table
  })

  return NextResponse.json(syncedTables, { headers: corsHeaders() })
}

export async function POST(req: NextRequest) {
  const checked = authError(req, ["ADMIN"])
  if (checked.response) return checked.response

  const parsed = buildTablePayload(await req.json())
  if (parsed.error || !parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400, headers: corsHeaders() })

  const existed = await prisma.table.findUnique({ where: { number: parsed.data.number }, select: { id: true } })
  if (existed) return NextResponse.json({ error: "Số bàn đã tồn tại trong hệ thống." }, { status: 409, headers: corsHeaders() })

  const table = await prisma.table.create({ data: parsed.data })
  return NextResponse.json(table, { status: 201, headers: corsHeaders() })
}
