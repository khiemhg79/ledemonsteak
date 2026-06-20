"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/store/auth"

export default function StaffGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, token, hydrated, hydrate, logout } = useAuth()
  const isLogin = pathname === "/login"
  const authorized = !!user && !!token && ["STAFF", "ADMIN"].includes(user.role)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (!hydrated) return
    if (isLogin && authorized) router.replace("/tables")
    if (!isLogin && !authorized) { logout(); router.replace("/login") }
  }, [hydrated, isLogin, authorized, logout, router])

  if (isLogin) return <>{children}</>
  if (!hydrated || !authorized) return <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7] text-sm font-semibold text-[#667085]">Đang kiểm tra phiên đăng nhập...</div>
  return <>{children}</>
}
