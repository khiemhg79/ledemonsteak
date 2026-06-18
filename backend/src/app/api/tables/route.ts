import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }
export async function GET() {
  const tables = await prisma.table.findMany({ where: { isActive: true }, orderBy: { number: "asc" } })
  return NextResponse.json(tables, { headers: corsHeaders() })
}
export async function POST(req: NextRequest) {
  const { number, capacity } = await req.json()
  const table = await prisma.table.create({ data: { number, capacity } })
  return NextResponse.json(table, { status: 201, headers: corsHeaders() })
}
