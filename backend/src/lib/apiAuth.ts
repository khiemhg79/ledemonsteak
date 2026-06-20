import { NextRequest } from "next/server"
import { verifyToken } from "@/lib/jwt"

export type AuthResult =
  | { ok: true; user: { id: string; role: string; name?: string } }
  | { ok: false; status: number; error: string }

export function authorize(req: NextRequest, roles: string[]): AuthResult {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return { ok: false, status: 401, error: "Bạn cần đăng nhập để sử dụng chức năng này." }
  try {
    const user = verifyToken(token)
    if (!roles.includes(user.role)) return { ok: false, status: 403, error: "Tài khoản không có quyền thực hiện thao tác này." }
    return { ok: true, user }
  } catch {
    return { ok: false, status: 401, error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." }
  }
}
