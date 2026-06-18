import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { signToken } from "@/lib/jwt"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import bcrypt from "bcryptjs"

export async function OPTIONS() { return optionsResponse() }

export async function POST(req: NextRequest) {
  const { name, phone, password } = await req.json()
  const exists = await prisma.user.findUnique({ where: { phone } })
  if (exists)
    return NextResponse.json({ error: "Số điện thoại đã đăng ký" }, { status: 400, headers: corsHeaders() })
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name,
      phone,
      password: hashed,
      role: "CUSTOMER",
      customer: { create: { name, phone } },
    },
  })
  const token = signToken({ id: user.id, role: user.role, name: user.name })
  return NextResponse.json({ token, user: { id: user.id, name: user.name, role: user.role } }, { status: 201, headers: corsHeaders() })
}
