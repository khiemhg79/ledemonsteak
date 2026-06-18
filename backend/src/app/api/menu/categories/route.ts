import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }
export async function GET() {
  const cats = await prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })
  return NextResponse.json(cats, { headers: corsHeaders() })
}
export async function POST(req: NextRequest) {
  const body = await req.json()
  const cat = await prisma.category.create({ data: body })
  return NextResponse.json(cat, { status: 201, headers: corsHeaders() })
}
