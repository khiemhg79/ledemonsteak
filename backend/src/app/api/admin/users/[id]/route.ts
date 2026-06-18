import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export async function OPTIONS() { return optionsResponse() }

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json()
  if (data.password) data.password = await bcrypt.hash(data.password, 10)
  else delete data.password
  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, phone: true, role: true, isActive: true },
  })
  if (user.role === "CUSTOMER") {
    await prisma.customer.upsert({
      where: { userId: user.id },
      update: { name: user.name, phone: user.phone, isActive: user.isActive },
      create: { userId: user.id, name: user.name, phone: user.phone, isActive: user.isActive },
    })
  }
  return NextResponse.json(user, { headers: corsHeaders() })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.$transaction([
    prisma.user.update({ where: { id: params.id }, data: { isActive: false } }),
    prisma.customer.updateMany({ where: { userId: params.id }, data: { isActive: false } }),
  ])
  return NextResponse.json({ message: "Đã ngừng hoạt động" }, { headers: corsHeaders() })
}
