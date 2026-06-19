import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { signToken } from "@/lib/jwt"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import bcrypt from "bcryptjs"
import { isVietnamesePhone, normalizePhone } from "@/lib/authValidation"

export async function OPTIONS() { return optionsResponse() }

export async function POST(req: NextRequest) {
  const body = await req.json()
  const name = String(body.name ?? "").trim()
  const phone = normalizePhone(body.phone)
  const password = String(body.password ?? "")
  if (!name || !phone || !password)
    return NextResponse.json({ error: "Vui lòng nhập đầy đủ các trường bắt buộc" }, { status: 400, headers: corsHeaders() })
  if (!isVietnamesePhone(phone))
    return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400, headers: corsHeaders() })
  if (password.length < 8)
    return NextResponse.json({ error: "Mật khẩu phải có ít nhất 8 ký tự" }, { status: 400, headers: corsHeaders() })
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
