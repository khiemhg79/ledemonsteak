"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { apiPost } from "@/lib/api"
import { useAuth } from "@/store/auth"

type AuthMode = "login" | "register"

export default function LoginPage() {
  const router = useRouter()
  const login = useAuth((s) => s.login)
  const [mode, setMode] = useState<AuthMode>("register")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setMessage("")
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage("")

    if (mode === "register" && password !== confirmPassword) {
      setMessage("Mật khẩu nhập lại chưa khớp.")
      return
    }

    setLoading(true)
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body = mode === "login" ? { phone, password } : { name, phone, password }
      const data = await apiPost(path, body)
      login(data.user, data.token)
      router.push("/")
    } catch (error: any) {
      setMessage(error.message || "Không thể xác thực tài khoản.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#2A1512] px-4 py-8 text-[#211715]">
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(80,18,14,0.95),rgba(35,20,18,0.86)),linear-gradient(45deg,#C18A45,#671313)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(0deg,rgba(15,10,8,0.55),rgba(15,10,8,0))]" />

      <section className="relative w-full max-w-sm rounded-[28px] border border-[#F0D7B0] bg-[#FFF9F0]/95 px-6 py-6 shadow-2xl shadow-black/35 backdrop-blur">
        <Link href="/" className="absolute right-5 top-4 text-xl leading-none text-[#8D7B70]" aria-label="Đóng">
          x
        </Link>

        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#E8BF7A] bg-[#FFF4D8] text-sm font-black tracking-tight text-[#8B1A1A] shadow-sm">
          LM
        </div>
        <div className="mt-3 text-center">
          <h1 className="text-2xl font-black leading-tight text-[#201817]">Chào mừng bạn đến Le Monde Steak</h1>
          <p className="mx-auto mt-2 max-w-[250px] text-sm leading-5 text-[#756860]">Hãy đăng nhập hoặc tạo tài khoản để tiếp tục</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm font-bold">
          <button
            type="button"
            className={`rounded-xl border px-3 py-3 shadow-sm transition ${mode === "login" ? "border-[#9B1C1C] bg-[#9B1C1C] text-white" : "border-[#EBCB96] bg-white text-[#9B1C1C]"}`}
            onClick={() => switchMode("login")}
          >
            <span className="mr-1">-&gt;</span> Đăng nhập
          </button>
          <button
            type="button"
            className={`rounded-xl border px-3 py-3 shadow-sm transition ${mode === "register" ? "border-[#D9491E] bg-[#D9491E] text-white" : "border-[#EBCB96] bg-white text-[#9B1C1C]"}`}
            onClick={() => switchMode("register")}
          >
            <span className="mr-1">+</span> Đăng ký
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={submit}>
          {mode === "register" && (
            <input
              className="h-12 w-full rounded-xl border border-[#E8CFA6] bg-white/90 px-4 text-sm outline-none transition placeholder:text-[#B7AAA2] focus:border-[#9B1C1C] focus:ring-4 focus:ring-[#9B1C1C]/10"
              placeholder="Họ và tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            className="h-12 w-full rounded-xl border border-[#E8CFA6] bg-white/90 px-4 text-sm outline-none transition placeholder:text-[#B7AAA2] focus:border-[#9B1C1C] focus:ring-4 focus:ring-[#9B1C1C]/10"
            placeholder="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            className="h-12 w-full rounded-xl border border-[#E8CFA6] bg-white/90 px-4 text-sm outline-none transition placeholder:text-[#B7AAA2] focus:border-[#9B1C1C] focus:ring-4 focus:ring-[#9B1C1C]/10"
            placeholder="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {mode === "register" && (
            <input
              className="h-12 w-full rounded-xl border border-[#E8CFA6] bg-white/90 px-4 text-sm outline-none transition placeholder:text-[#B7AAA2] focus:border-[#9B1C1C] focus:ring-4 focus:ring-[#9B1C1C]/10"
              placeholder="Nhập lại mật khẩu"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

          {message && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>}

          <button
            className="h-12 w-full rounded-xl bg-[#B51F18] text-sm font-black text-white shadow-lg shadow-[#8B1A1A]/25 transition hover:bg-[#961813] disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        </form>
      </section>
    </main>
  )
}
