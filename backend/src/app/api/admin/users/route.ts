import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import bcrypt from "bcryptjs"

export async function OPTIONS() { return optionsResponse() }
export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(users, { headers: corsHeaders() })
}
export async function POST(req: NextRequest) {
  const { name, phone, password, role } = await req.json()
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name,
      phone,
      password: hashed,
      role,
      ...(role === "CUSTOMER" ? { customer: { create: { name, phone } } } : {}),
    },
    select: { id: true, name: true, phone: true, role: true },
  })
  return NextResponse.json(user, { status: 201, headers: corsHeaders() })
}
