import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json(await prisma.combo.update({ where: { id: params.id }, data: await req.json() }), { headers: corsHeaders() })
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.combo.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ message: "Đã ngừng combo" }, { headers: corsHeaders() })
}
