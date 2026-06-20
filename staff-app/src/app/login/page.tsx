"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiPost } from "@/lib/api"
import { useAuth } from "@/store/auth"

export default function StaffLoginPage() {
  const router = useRouter()
  const login = useAuth((s) => s.login)
  const [phone, setPhone] = useState("0900000002")
  const [password, setPassword] = useState("Admin@123")
  const [message, setMessage] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = await apiPost("/api/auth/login", { phone, password })
      if (!["STAFF", "ADMIN"].includes(data.user.role)) throw new Error("Tài khoản không có quyền nhân viên.")
      login(data.user, data.token)
      router.push("/tables")
    } catch (error: any) {
      setMessage(error.message || "Đăng nhập thất bại.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1A1A1A]">
      <form className="w-full max-w-sm rounded-xl bg-white p-8" onSubmit={submit}>
        <h1 className="mb-6 text-center text-2xl font-bold text-[#8B1A1A]">Đăng nhập nhân viên</h1>
        <input className="mb-3 w-full rounded-md border px-3 py-2 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số điện thoại" />
        <input className="mb-3 w-full rounded-md border px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" type="password" />
        {message && <p className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{message}</p>}
        <button className="w-full rounded-md bg-[#8B1A1A] py-2 font-bold text-white">Đăng nhập</button>
      </form>
    </div>
  )
}
