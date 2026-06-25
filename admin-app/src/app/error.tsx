"use client"

import { useEffect } from "react"

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin application error", { message: error.message, digest: error.digest })
  }, [error])

  return (
    <section className="mx-auto mt-16 max-w-xl rounded-xl border border-[#7F1D1D] bg-[#2A0E13] p-6 text-center">
      <h1 className="text-xl font-black text-[#FFB4B4]">Không thể tải chức năng quản trị</h1>
      <p className="mt-3 text-sm leading-6 text-[#D7A8A8]">Hệ thống gặp lỗi tạm thời. Thao tác chưa hoàn tất sẽ không được ghi nhận.</p>
      <button className="admin-primary mt-5 w-full" onClick={reset}>Thử lại</button>
      <button className="mt-2 h-11 w-full rounded-xl bg-[#111C34] font-bold text-white" onClick={() => window.location.assign("/dashboard")}>Về tổng quan</button>
    </section>
  )
}
