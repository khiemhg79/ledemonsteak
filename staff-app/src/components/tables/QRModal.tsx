"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { apiGet } from "@/lib/api"

type QRModalProps = { table: any | null; onClose: () => void }

export default function QRModal({ table, onClose }: QRModalProps) {
  const [customerUrl, setCustomerUrl] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!table) return
    setCustomerUrl("")
    setError("")
    apiGet(`/api/tables/${table.id}/qr`)
      .then((data) => setCustomerUrl(data.url))
      .catch((err) => setError(err instanceof Error ? err.message : "Không tạo được mã QR. Vui lòng thử lại."))
  }, [table])

  if (!table) return null
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-sm rounded-xl bg-white p-5">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">QR riêng bàn {table.number}</h2><button className="text-sm text-gray-500" onClick={onClose}>Đóng</button></div>
      <div className="mt-5 flex min-h-[254px] items-center justify-center rounded-xl border border-gray-200 bg-white p-4">
        {customerUrl ? <QRCodeSVG value={customerUrl} size={220} /> : <span className="text-sm text-gray-500">Đang tạo QR theo IP hiện tại...</span>}
      </div>
      {customerUrl && <p className="mt-4 break-all rounded-lg bg-gray-50 p-3 text-center text-xs font-semibold text-gray-600">{customerUrl}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-center text-xs text-red-700">{error}</p>}
      <p className="mt-3 text-center text-xs text-gray-500">IP được nhận tự động mỗi lần mở QR. Điện thoại cần dùng cùng Wi-Fi với máy chạy web.</p>
    </div>
  </div>
}
