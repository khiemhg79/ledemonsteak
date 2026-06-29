import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { authorize } from "@/lib/apiAuth"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { isVietnamesePhone, normalizePhone } from "@/lib/authValidation"
import { roleIdFor } from "@/lib/roles"

const roles = [Role.ADMIN, Role.STAFF, Role.CUSTOMER] as const

function adminOnly(req: NextRequest) {
  const auth = authorize(req, ["ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
  return null
}

function cleanName(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 50)
}

function cleanPassword(value: unknown) {
  return String(value ?? "").trim()
}

function validatePassword(password: string) {
  if (password.length < 8 || password.length > 20) return "Mật khẩu phải có từ 8 đến 20 ký tự."
  if (!/[A-Z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ viết hoa."
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return "Mật khẩu phải bao gồm chữ, số và ký tự đặc biệt."
  }
  return null
}

function validateRole(value: unknown) {
  const role = String(value ?? "").toUpperCase()
  return roles.includes(role as Role) ? role as Role : null
}

function userSelect() {
  return { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true }
}

export async function OPTIONS() {
  return optionsResponse()
}

export async function GET(req: NextRequest) {
  const denied = adminOnly(req)
  if (denied) return denied

  const users = await prisma.user.findMany({
    select: userSelect(),
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(users, { headers: corsHeaders() })
}

export async function POST(req: NextRequest) {
  const denied = adminOnly(req)
  if (denied) return denied

  const body = await req.json()
  const name = cleanName(body.name)
  const phone = normalizePhone(body.phone)
  const password = cleanPassword(body.password)
  const role = validateRole(body.role)

  if (!name) return NextResponse.json({ error: "Vui lòng nhập tên đăng nhập." }, { status: 400, headers: corsHeaders() })
  if (!phone) return NextResponse.json({ error: "Vui lòng nhập số điện thoại." }, { status: 400, headers: corsHeaders() })
  if (!isVietnamesePhone(phone)) return NextResponse.json({ error: "Số điện thoại không hợp lệ." }, { status: 400, headers: corsHeaders() })
  if (!role) return NextResponse.json({ error: "Vai trò không hợp lệ." }, { status: 400, headers: corsHeaders() })
  const passwordError = validatePassword(password)
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400, headers: corsHeaders() })

  const existing = await prisma.user.findUnique({ where: { phone } })
  if (existing) return NextResponse.json({ error: "Số điện thoại đã tồn tại trên hệ thống." }, { status: 409, headers: corsHeaders() })

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name,
      phone,
      password: hashed,
      role,
      roleId: roleIdFor(role),
      isActive: true,
      ...(role === "CUSTOMER" ? { customer: { create: { name, phone, isActive: true } } } : {}),
    },
    select: userSelect(),
  })
  return NextResponse.json(user, { status: 201, headers: corsHeaders() })
}
