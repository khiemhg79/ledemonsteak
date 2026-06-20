import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }

export async function GET() {
  const tables = await prisma.table.findMany({
    where: { isActive: true },
    select: { id: true, number: true, capacity: true, status: true },
    orderBy: { number: "asc" },
  })
  return NextResponse.json(tables, { headers: corsHeaders() })
}
