import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const encoder = new TextEncoder()

type VersionRow = { version: string | null }

function scopeTables(scope: string | null) {
  if (scope === "customer") return ["orders", "orderdetails", "tables", "invoices", "payments", "promotions"]
  if (scope === "staff") return ["orders", "orderdetails", "tables", "invoices", "payments"]
  if (scope === "admin") return ["orders", "orderdetails", "tables", "invoices", "payments", "items", "combos", "comboitems", "categories", "promotions", "customerpromotions", "customers", "users", "roles"]
  return ["orders", "orderdetails", "tables", "invoices", "payments", "items", "combos", "comboitems", "categories", "promotions"]
}

function signatureSql(tableName: string) {
  switch (tableName) {
    case "orderdetails":
      return `(select concat('orderdetails:', count(*)::text, ':', coalesce(md5(string_agg(concat_ws(':', "id", "orderId", coalesce("itemId", ''), coalesce("comboId", ''), "quantity"::text, "price"::text, "status"::text), '|' order by "id")), '')) from "orderdetails")`
    case "comboitems":
      return `(select concat('comboitems:', count(*)::text, ':', coalesce(md5(string_agg(concat_ws(':', "id", "comboId", "itemId", "quantity"::text), '|' order by "id")), '')) from "comboitems")`
    case "customerpromotions":
      return `(select concat('customerpromotions:', count(*)::text, ':', coalesce(md5(string_agg(concat_ws(':', "id", "customerId", "promotionId", "isUsed"::text, coalesce(extract(epoch from "usedAt")::text, '')), '|' order by "id")), '')) from "customerpromotions")`
    default:
      return `(select concat('${tableName}:', count(*)::text, ':', coalesce(extract(epoch from max("updatedAt"))::text, '0')) from "${tableName}")`
  }
}

async function currentVersion(scope: string | null) {
  const tables = scopeTables(scope)
  const sql = `select concat_ws('|', ${tables.map(signatureSql).join(", ")}) as version`
  const rows = await prisma.$queryRawUnsafe<VersionRow[]>(sql)
  return rows[0]?.version ?? `${Date.now()}`
}

function writeEvent(controller: ReadableStreamDefaultController<Uint8Array>, event: string, data: unknown) {
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
}

export async function OPTIONS() {
  return optionsResponse()
}

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope")
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let lastVersion = ""
      const startedAt = Date.now()

      writeEvent(controller, "ready", { scope, ts: startedAt })

      while (Date.now() - startedAt < 55_000) {
        try {
          const version = await currentVersion(scope)
          if (version !== lastVersion) {
            lastVersion = version
            writeEvent(controller, "update", { scope, version, ts: Date.now() })
          } else {
            controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`))
          }
        } catch (error) {
          writeEvent(controller, "error", { message: "realtime-check-failed", ts: Date.now() })
        }
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }

      controller.close()
    },
  })

  return new NextResponse(stream, {
    headers: {
      ...corsHeaders(),
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
