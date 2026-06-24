"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiPost } from "@/lib/api"
import { useAuth } from "@/store/auth"

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useAuth((s) => s.login)
  const [phone, setPhone] = useState("0900000001")
  const [password, setPassword] = useState("Admin@123")
  const [message, setMessage] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = await apiPost("/api/auth/login", { phone, password })
      if (data.user.role !== "ADMIN") throw new Error("Tài khoản không có quyền quản trị.")
      login(data.user, data.token)
      router.push("/dashboard")
    } catch (error: any) {
      setMessage(error.message || "Đăng nhập thất bại.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <form className="w-full max-w-sm rounded-xl bg-gray-800 p-8" onSubmit={submit}>
        <h1 className="mb-6 text-center text-2xl font-bold text-[#C9A84C]">Admin — Le Monde Steak</h1>
        <input className="mb-3 w-full rounded-md bg-gray-900 px-3 py-2 text-sm text-white" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số điện thoại" />
        <input className="mb-3 w-full rounded-md bg-gray-900 px-3 py-2 text-sm text-white" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" type="password" />
        {(message || searchParams.get("expired")) && (
          <p className="mb-3 rounded-md bg-red-950 p-2 text-sm text-red-200">
            {message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."}
          </p>
        )}
        <button className="w-full rounded-md bg-[#8B1A1A] py-2 font-bold text-white">Đăng nhập</button>
      </form>
    </div>
  )
}
