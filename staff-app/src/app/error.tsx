"use client"

import { useEffect } from "react"

export default function StaffError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Staff application error", { message: error.message, digest: error.digest })
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7F7] p-6">
      <section className="w-full max-w-md rounded-xl border border-[#FFD2C4] bg-white p-6 text-center shadow-lg">
        <h1 className="text-xl font-black text-[#C73516]">Không thể tải màn hình nhân viên</h1>
        <p className="mt-3 text-sm leading-6 text-[#667085]">Hệ thống gặp lỗi tạm thời. Vui lòng thử tải lại dữ liệu.</p>
        <button className="mt-5 h-11 w-full rounded-lg bg-[#FF4A12] font-black text-white" onClick={reset}>Thử lại</button>
        <button className="mt-2 h-11 w-full rounded-lg bg-[#E8ECEF] font-bold text-[#475467]" onClick={() => window.location.assign("/tables")}>Về quản lý bàn</button>
      </section>
    </main>
  )
}
