import { NextRequest, NextResponse } from "next/server"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { getLanIPv4 } from "@/lib/network"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function OPTIONS() { return optionsResponse() }
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const deployedBase = process.env.CUSTOMER_APP_URL?.replace(/\/$/, "")
  const base = deployedBase?.startsWith("https://") ? deployedBase : `http://${getLanIPv4()}:3000`
  return NextResponse.json({ url: `${base}?tableId=${params.id}`, tableId: params.id }, { headers: corsHeaders() })
}
