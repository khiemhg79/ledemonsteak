"use client"

import { useEffect, useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { apiGet } from "@/lib/api"

type QRModalProps = { table: any | null; onClose: () => void }
type QRData = { url: string; createdAt: string; expiresAt: string }

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

    const popup = window.open("", "_blank", "width=420,height=560")
    if (!popup) {
      setError("Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup rồi thử lại.")
      return
    }

    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>QR đặt món</title><style>
      body{font-family:Arial,sans-serif;text-align:center;padding:28px;color:#111827}
      h1{font-size:20px;margin:0 0 18px;font-weight:800}
      p{margin:0 0 14px;font-size:13px;color:#4b5563}
      .qr{margin:0 auto 18px;width:250px;border:1px solid #e5e7eb;border-radius:8px;padding:12px}
      .qr svg{width:224px;height:224px}
      button{border:0;border-radius:6px;background:#2f80ed;color:white;font-weight:700;padding:10px 18px}
      @media print{button{display:none}}
    </style></head><body><h1>Mã QR Đặt Món</h1><p>Quét mã QR để xem thực đơn và đặt món</p><div class="qr">${qrRef.current.innerHTML}</div><button onclick="window.print()">In QR</button><script>window.onload=()=>window.print()</script></body></html>`)
    popup.document.close()
  }

  if (!table) return null

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="qr-title">
      <div className="w-full max-w-[312px] rounded-md bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="qr-title" className="text-base font-black text-gray-900">Mã QR Đặt Món</h2>
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-xl font-semibold text-gray-500 hover:bg-gray-100" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        <p className="mt-3 text-center text-xs font-medium text-gray-600">Quét mã QR để xem thực đơn và đặt món</p>

        <div ref={qrRef} className="mx-auto mt-3 flex h-[214px] w-[214px] items-center justify-center rounded-md border border-gray-200 bg-white p-2">
          {qr ? <QRCodeSVG value={qr.url} size={194} level="M" includeMargin /> : <span className="text-center text-sm text-gray-500">Đang tạo mã QR...</span>}
        </div>

        {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-center text-sm text-red-700">{error}</p>}

        <div className="mt-3 flex justify-center">
          <button
            className="rounded-md bg-[#2F80ED] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#256FD1] disabled:opacity-60"
            onClick={printQr}
            disabled={!qr}
          >
            In QR
          </button>
        </div>
      </div>
    </div>
  )
}