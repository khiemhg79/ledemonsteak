import { NextRequest, NextResponse } from "next/server"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { verifyToken } from "@/lib/jwt"
import { getLanIPv4 } from "@/lib/network"
import { prisma } from "@/lib/prisma"
import { createTableQrToken } from "@/lib/qrToken"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function OPTIONS() { return optionsResponse() }
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return NextResponse.json({ error: "Bạn cần đăng nhập bằng tài khoản nhân viên." }, { status: 401, headers: corsHeaders() })
  try {
    const payload = verifyToken(token)
    if (!["STAFF", "ADMIN"].includes(payload.role)) return NextResponse.json({ error: "Tài khoản không có quyền tạo mã QR." }, { status: 403, headers: corsHeaders() })
  } catch {
    return NextResponse.json({ error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401, headers: corsHeaders() })
  }

  const table = await prisma.table.findFirst({ where: { id: params.id, isActive: true } })
  if (!table) return NextResponse.json({ error: "Bàn không tồn tại hoặc đã ngừng hoạt động." }, { status: 404, headers: corsHeaders() })
  if (table.status !== "EMPTY") return NextResponse.json({ error: "Chỉ có thể tạo QR khi bàn đang Trống." }, { status: 409, headers: corsHeaders() })

  const deployedBase = process.env.CUSTOMER_APP_URL?.replace(/\/$/, "")
  const base = deployedBase?.startsWith("https://") ? deployedBase : `http://${getLanIPv4()}:3000`
  const qrToken = createTableQrToken(table.id)
  const url = new URL(base)
  url.searchParams.set("tableId", table.id)
  url.searchParams.set("qrToken", qrToken)
  const now = new Date()
  return NextResponse.json({
    url: url.toString(),
    tableId: table.id,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
  }, { headers: corsHeaders() })
}
