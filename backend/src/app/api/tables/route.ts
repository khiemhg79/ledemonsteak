import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { authorize } from "@/lib/apiAuth"

export async function OPTIONS() { return optionsResponse() }
export async function GET(req: NextRequest) {
  const auth = authorize(req, ["STAFF", "ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
  const tables = await prisma.table.findMany({ where: { isActive: true }, orderBy: { number: "asc" } })
  return NextResponse.json(tables, { headers: corsHeaders() })
}
export async function POST(req: NextRequest) {
  const auth = authorize(req, ["ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
  const { number, capacity } = await req.json()
  if (!String(number ?? "").trim() || !Number.isInteger(Number(capacity)) || Number(capacity) < 1) {
    return NextResponse.json({ error: "Tên bàn và sức chứa hợp lệ là bắt buộc." }, { status: 400, headers: corsHeaders() })
  }
  const table = await prisma.table.create({ data: { number: String(number).trim(), capacity: Number(capacity) } })
  return NextResponse.json(table, { status: 201, headers: corsHeaders() })
}
