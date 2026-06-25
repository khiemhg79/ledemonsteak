import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders } from "@/lib/cors"

export const dynamic = "force-dynamic"

export async function GET() {
  const startedAt = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: "ok",
      service: "le-monde-steak-backend",
      database: "connected",
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, {
      headers: { ...corsHeaders(), "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("Health check failed", error)
    return NextResponse.json({
      status: "error",
      service: "le-monde-steak-backend",
      database: "unavailable",
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, {
      status: 503,
      headers: { ...corsHeaders(), "Cache-Control": "no-store" },
    })
  }
}
