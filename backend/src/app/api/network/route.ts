import { NextResponse } from "next/server"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { getLanIPv4 } from "@/lib/network"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function OPTIONS() { return optionsResponse() }
export async function GET() {
  const ip = getLanIPv4()
  const customerBase = process.env.CUSTOMER_APP_URL?.startsWith("https://") ? process.env.CUSTOMER_APP_URL.replace(/\/$/, "") : `http://${ip}:3000`
  const apiBase = process.env.BACKEND_PUBLIC_URL?.startsWith("https://") ? process.env.BACKEND_PUBLIC_URL.replace(/\/$/, "") : `http://${ip}:4000`
  return NextResponse.json({ ip, customerBase, apiBase }, { headers: corsHeaders() })
}
