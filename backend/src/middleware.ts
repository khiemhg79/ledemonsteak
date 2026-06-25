import { NextRequest, NextResponse } from "next/server"

type RateEntry = { count: number; resetAt: number }

const rateStore = new Map<string, RateEntry>()
const WINDOW_MS = 60_000

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown"
}

function requestLimit(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/auth/")) return 10
  return req.method === "GET" ? 300 : 120
}

function securityHeaders(headers: Headers) {
  headers.set("X-Content-Type-Options", "nosniff")
  headers.set("X-Frame-Options", "DENY")
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  headers.set("Cross-Origin-Opener-Policy", "same-origin")
  headers.set("X-Permitted-Cross-Domain-Policies", "none")
}

export function middleware(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID()
  const now = Date.now()
  const ip = clientIp(req)
  const limit = requestLimit(req)
  const key = `${ip}:${req.method}:${req.nextUrl.pathname}`
  const previous = rateStore.get(key)
  const current = !previous || previous.resetAt <= now
    ? { count: 1, resetAt: now + WINDOW_MS }
    : { count: previous.count + 1, resetAt: previous.resetAt }
  rateStore.set(key, current)

  if (rateStore.size > 5_000) {
    rateStore.forEach((entry, storedKey) => {
      if (entry.resetAt <= now) rateStore.delete(storedKey)
    })
  }

  if (current.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    const response = NextResponse.json(
      { error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.", requestId },
      { status: 429 },
    )
    response.headers.set("Retry-After", String(retryAfter))
    response.headers.set("X-RateLimit-Limit", String(limit))
    response.headers.set("X-RateLimit-Remaining", "0")
    response.headers.set("X-Request-Id", requestId)
    securityHeaders(response.headers)
    return response
  }

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-request-id", requestId)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set("X-Request-Id", requestId)
  response.headers.set("X-RateLimit-Limit", String(limit))
  response.headers.set("X-RateLimit-Remaining", String(Math.max(0, limit - current.count)))
  securityHeaders(response.headers)

  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    console.info(JSON.stringify({
      type: "AUDIT",
      requestId,
      method: req.method,
      path: req.nextUrl.pathname,
      ip,
      timestamp: new Date().toISOString(),
    }))
  }

  return response
}

export const config = {
  matcher: ["/api/:path*"],
}
