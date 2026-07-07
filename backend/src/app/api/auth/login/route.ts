import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signToken } from "@/lib/jwt"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { normalizePhone } from "@/lib/authValidation"

export async function OPTIONS() {
  return optionsResponse()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const phone = normalizePhone(body.phone)
    const password = String(body.password ?? "")
    const user = await prisma.user.findUnique({ where: { phone } })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 401, headers: corsHeaders() })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401, headers: corsHeaders() })
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    const token = signToken({ id: user.id, role: user.role, name: user.name })

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
        },
      },
      { headers: corsHeaders() }
    )
  } catch (error) {
    console.error("Login failed", error)
    return NextResponse.json({ error: "Không thể đăng nhập. Vui lòng thử lại." }, { status: 500, headers: corsHeaders() })
  }
}