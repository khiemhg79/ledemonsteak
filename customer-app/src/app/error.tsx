"use client"

import { useEffect } from "react"

export default function CustomerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Customer application error", { message: error.message, digest: error.digest })
  }, [error])

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-[#FFF8EE] p-6 text-[#211715]">
      <section className="w-full rounded-2xl border border-[#F0D7B0] bg-white p-6 text-center shadow-lg">
        <h1 className="text-xl font-black text-[#B51F18]">Không thể hiển thị trang</h1>
        <p className="mt-3 text-sm leading-6 text-[#6F625C]">Hệ thống vừa gặp lỗi tạm thời. Dữ liệu của bạn vẫn được giữ an toàn.</p>
        <button className="mt-5 h-11 w-full rounded-xl bg-[#D9491E] font-black text-white" onClick={reset}>Thử lại</button>
        <button className="mt-2 h-11 w-full rounded-xl border border-[#F0D7B0] bg-white font-bold text-[#B51F18]" onClick={() => window.location.assign("/")}>Về trang món ăn</button>
      </section>
    </main>
  )
}
