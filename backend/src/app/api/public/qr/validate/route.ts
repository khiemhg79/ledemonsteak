import { NextRequest, NextResponse } from "next/server"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { prisma } from "@/lib/prisma"
import { qrTokenError, verifyTableQrToken } from "@/lib/qrToken"

export async function OPTIONS() { return optionsResponse() }

export async function POST(req: NextRequest) {
  const { tableId, qrToken } = await req.json()
  if (!tableId || !qrToken) return NextResponse.json({ error: "Mã QR thiếu thông tin xác thực." }, { status: 400, headers: corsHeaders() })
  try {
    verifyTableQrToken(String(qrToken), String(tableId))
    const table = await prisma.table.findFirst({
      where: { id: String(tableId), isActive: true },
      select: { id: true, number: true, capacity: true, status: true },
    })
    if (!table) return NextResponse.json({ error: "Bàn không tồn tại hoặc đã ngừng hoạt động." }, { status: 404, headers: corsHeaders() })
    return NextResponse.json({ valid: true, table }, { headers: corsHeaders() })
  } catch (error) {
    return NextResponse.json({ error: qrTokenError(error) }, { status: 401, headers: corsHeaders() })
  }
}
