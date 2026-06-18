import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }
export async function POST(req: NextRequest) {
  return NextResponse.json(await prisma.combo.create({ data: await req.json() }), { status: 201, headers: corsHeaders() })
}
