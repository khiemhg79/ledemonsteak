import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken"

const SECRET = process.env.JWT_SECRET!

export type TableQrPayload = JwtPayload & { type: "TABLE_QR"; tableId: string; iat: number; exp: number }

export function createTableQrToken(tableId: string) {
  return jwt.sign({ type: "TABLE_QR", tableId }, SECRET, { expiresIn: "12h" })
}

export function verifyTableQrToken(token: string, expectedTableId?: string): TableQrPayload {
  const payload = jwt.verify(token, SECRET) as TableQrPayload
  if (payload.type !== "TABLE_QR" || !payload.tableId || (expectedTableId && payload.tableId !== expectedTableId)) throw new Error("INVALID_QR")
  return payload
}

export function qrTokenError(error: unknown) {
  return error instanceof TokenExpiredError
    ? "Mã QR đã hết hạn sau 12 giờ. Vui lòng yêu cầu nhân viên tạo mã mới."
    : "Mã QR không hợp lệ. Vui lòng quét lại mã tại bàn."
}
