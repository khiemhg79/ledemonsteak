import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { signToken } from "@/lib/jwt"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import bcrypt from "bcryptjs"

export async function OPTIONS() { return optionsResponse() }

export async function POST(req: NextRequest) {
  const { phone, password } = await req.json()
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user || !user.isActive)
    return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 401, headers: corsHeaders() })
  const ok = await bcrypt.compare(password, user.password)
  if (!ok)
    return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401, headers: corsHeaders() })
  const token = signToken({ id: user.id, role: user.role, name: user.name })
  return NextResponse.json({ token, user: { id: user.id, name: user.name, role: user.role } }, { headers: corsHeaders() })
}
