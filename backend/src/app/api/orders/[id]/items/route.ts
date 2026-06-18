import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { itemId, status } = await req.json()
  const item = await prisma.orderDetail.update({ where: { id: itemId }, data: { status } })
  return NextResponse.json(item, { headers: corsHeaders() })
}
