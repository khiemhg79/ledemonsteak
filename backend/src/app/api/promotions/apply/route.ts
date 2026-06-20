import { NextRequest, NextResponse } from "next/server"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { authorize } from "@/lib/apiAuth"
import { calculatePromotion, PromotionError } from "@/lib/promotion"

export async function OPTIONS() { return optionsResponse() }
export async function POST(req: NextRequest) {
  const auth = authorize(req, ["CUSTOMER"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })
  const { code, orderAmount } = await req.json()
  if (!Number.isFinite(Number(orderAmount)) || Number(orderAmount) < 0) return NextResponse.json({ error: "Tổng tiền đơn hàng không hợp lệ." }, { status: 400, headers: corsHeaders() })
  try {
    return NextResponse.json(await calculatePromotion(code, Number(orderAmount)), { headers: corsHeaders() })
  } catch (error) {
    if (error instanceof PromotionError) return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders() })
    throw error
  }
}
