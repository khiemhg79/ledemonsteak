import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }

export async function GET() {
  const [dishes, combos, categories] = await Promise.all([
    prisma.item.findMany({ where: { isActive: true }, include: { category: true }, orderBy: { category: { sortOrder: "asc" } } }),
    prisma.combo.findMany({ where: { isActive: true }, include: { items: { include: { item: true } } } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ])
  return NextResponse.json({ dishes, combos, categories }, { headers: corsHeaders() })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const dish = await prisma.item.create({ data: body, include: { category: true } })
  return NextResponse.json(dish, { status: 201, headers: corsHeaders() })
}
