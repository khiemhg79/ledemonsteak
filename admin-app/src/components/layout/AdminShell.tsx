"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import AdminSidebar from "@/components/sidebar/AdminSidebar"
import { useAuth } from "@/store/auth"

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, token, hydrated, hydrate, logout } = useAuth()
  const isLoginPage = pathname === "/login"

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!hydrated) return

    const isAdmin = user?.role === "ADMIN"
    if (isLoginPage) {
      if (token && isAdmin) router.replace("/dashboard")
      return
    }

    if (!token || !isAdmin) {
      logout()
      router.replace("/login")
    }
  }, [hydrated, isLoginPage, logout, router, token, user?.role])

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-sm font-semibold text-[#9AA8BF]">
        Đang kiểm tra phiên đăng nhập...
      </div>
    )
  }

  if (isLoginPage) {
    if (token && user?.role === "ADMIN") return null
    return children
  }

  if (!token || user?.role !== "ADMIN") return null

  function handleLogout() {
    logout()
    router.replace("/login")
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-[#182238] bg-black px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101A33] text-sm">▰</span>
          <h1 className="text-xl font-black">Bảng điều khiển quản trị</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-[#A9B4C7]">
          <span>Xin chào, <b className="text-white">{user.name}</b></span>
          <button className="rounded-xl bg-[#111C34] px-4 py-2 font-bold text-white" onClick={handleLogout}>
            ↪ Đăng xuất
          </button>
        </div>
      </header>
      <div className="flex pt-16">
        <AdminSidebar />
        <main className="min-h-[calc(100vh-4rem)] flex-1 px-8 py-7">{children}</main>
      </div>
    </>
  )
}
