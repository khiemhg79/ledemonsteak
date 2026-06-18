import type { Metadata } from "next"
import "./globals.css"
import AdminSidebar from "@/components/sidebar/AdminSidebar"

export const metadata: Metadata = { title: "Le Monde Steak - Admin" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-black text-white">
        <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-[#182238] bg-black px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101A33] text-sm">▰</span>
            <h1 className="text-xl font-black">Bảng điều khiển quản trị</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-[#A9B4C7]">
            <span>Xin chào, <b className="text-white">admin</b></span>
            <button className="rounded-xl bg-[#111C34] px-4 py-2 font-bold text-white">↪ Đăng xuất</button>
          </div>
        </header>
        <div className="flex pt-16">
          <AdminSidebar />
          <main className="min-h-[calc(100vh-4rem)] flex-1 px-8 py-7">{children}</main>
        </div>
      </body>
    </html>
  )
}
