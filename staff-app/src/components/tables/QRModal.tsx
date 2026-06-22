"use client"

import { useEffect, useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { apiGet } from "@/lib/api"

type QRModalProps = { table: any | null; onClose: () => void }
type QRData = { url: string; createdAt: string; expiresAt: string }

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(value))
}

export default function QRModal({ table, onClose }: QRModalProps) {
  const [qr, setQr] = useState<QRData | null>(null)
  const [error, setError] = useState("")
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!table) return
    setQr(null)
    setError("")
    apiGet(`/api/tables/${table.id}/qr`)
      .then((data) => setQr(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Không tạo được mã QR. Vui lòng thử lại."))
  }, [table])

  function printQr() {
    if (!qr || !qrRef.current) return
    const popup = window.open("", "_blank", "width=520,height=720")
    if (!popup) { setError("Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup rồi thử lại."); return }
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>QR bàn ${table.number}</title><style>
      body{font-family:Arial,sans-serif;text-align:center;padding:36px;color:#18120f}h1{font-size:24px;margin:0 0 8px}p{margin:8px 0}.qr{margin:24px auto;width:280px}.qr svg{width:280px;height:280px}.url{font-size:11px;word-break:break-all;color:#555}.note{font-size:13px;color:#666}@media print{button{display:none}}
    </style></head><body><h1>Le Monde Steak</h1><h2>Mã QR Đặt Món - Bàn ${table.number}</h2><p>Quét mã QR để xem thực đơn và đặt món</p><div class="qr">${qrRef.current.innerHTML}</div><p class="note">Có hiệu lực đến: ${formatDateTime(qr.expiresAt)}</p><p class="url">${qr.url}</p><button onclick="window.print()">In QR</button><script>window.onload=()=>window.print()</script></body></html>`)
    popup.document.close()
  }

  if (!table) return null
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="qr-title">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="qr-title" className="text-lg font-black text-gray-900">Mã QR Đặt Món - Bàn {table.number}</h2>
          <button className="flex h-9 w-9 items-center justify-center rounded-md text-2xl text-gray-500 hover:bg-gray-100" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <p className="mt-2 text-sm text-gray-600">Quét mã QR để xem thực đơn và đặt món</p>
        <div ref={qrRef} className="mt-4 flex min-h-[254px] items-center justify-center rounded-lg border border-gray-200 bg-white p-4">
          {qr ? <QRCodeSVG value={qr.url} size={220} level="M" includeMargin /> : <span className="text-sm text-gray-500">Đang tạo mã QR...</span>}
        </div>
        {qr && <>
          <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            <p>Tạo lúc: <strong>{formatDateTime(qr.createdAt)}</strong></p>
            <p className="mt-1">Hết hạn: <strong>{formatDateTime(qr.expiresAt)}</strong></p>
          </div>
          <p className="mt-3 break-all rounded-lg border border-gray-200 p-3 text-center text-[11px] text-gray-500">{qr.url}</p>
          <button className="mt-4 w-full rounded-md bg-[#FF4A12] px-4 py-3 text-sm font-bold text-white hover:bg-[#E43E0A]" onClick={printQr}>In QR</button>
        </>}
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">{error}</p>}
        <p className="mt-3 text-center text-xs text-gray-500">Mỗi mã chỉ dùng cho đúng bàn và tự hết hạn sau 12 giờ.</p>
      </div>
    </div>
  )
}
