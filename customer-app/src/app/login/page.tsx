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

    const normalizedPhone = phone.replace(/\D/g, "").replace(/^84/, "0")
    if (!/^0[35789]\d{8}$/.test(normalizedPhone)) {
      setMessage("Số điện thoại không hợp lệ.")
      return
    }
    if (mode === "register" && password.length < 8) {
      setMessage("Mật khẩu phải có ít nhất 8 ký tự.")
      return
    }
    if (mode === "register" && password !== confirmPassword) {
      setMessage("Mật khẩu nhập lại chưa khớp.")
      return
    }

    setLoading(true)
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body = mode === "login" ? { phone: normalizedPhone, password } : { name: name.trim(), phone: normalizedPhone, password }
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#21100D] px-4 py-8 text-[#221817]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_15%,rgba(255,141,33,0.34),transparent_26%),linear-gradient(135deg,#7B1B13_0%,#421512_48%,#160D0B_100%)]" />
      <div className="absolute left-1/2 top-1/2 h-[760px] w-[420px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[3px] border border-white/10 bg-[#FBF4EA] shadow-2xl shadow-black/45">
        <div className="h-20 bg-[linear-gradient(90deg,#A32219,#F27A14)] px-6 py-5 text-lg font-black text-white shadow-lg shadow-[#9B1C1C]/20">
          Le Monde Steak
        </div>
        <div className="space-y-4 p-5 opacity-45 blur-sm">
          <div className="rounded-2xl border border-[#EBCB96] bg-white p-4">
            <p className="text-sm font-black text-[#C7331C]">Bàn số 1</p>
            <p className="text-xs text-[#7B6C63]">Thành viên</p>
          </div>
          <div className="h-12 rounded-2xl border border-[#EBCB96] bg-white" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-44 rounded-2xl bg-[#64372A]" />
            <div className="h-44 rounded-2xl bg-[#7E1D18]" />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-white/95 shadow-[0_-8px_28px_rgba(91,39,18,0.14)]" />
      </div>

      <section className="relative w-full max-w-[356px] rounded-[26px] border border-[#F0D7B0] bg-[#FFFDF9]/96 px-7 pb-7 pt-6 shadow-[0_18px_46px_rgba(56,24,11,0.38)] backdrop-blur-md sm:max-w-[380px]">
        <Link href="/" className="absolute right-5 top-4 text-2xl leading-none text-[#9B8F88] transition hover:text-[#B51F18]" aria-label="Đóng">
          ×
        </Link>

        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#F3C77D] bg-[#FFF6E5] text-[11px] font-black tracking-tight text-[#B51F18] shadow-sm">
          LM
        </div>
        <div className="mt-3 text-center">
          <h1 className="mx-auto max-w-[270px] text-[22px] font-black leading-[1.13] text-[#1F2633]">
            Chào mừng bạn đến Le Monde Steak
          </h1>
          <p className="mx-auto mt-3 max-w-[250px] text-[14px] leading-5 text-[#7A6F68]">
            Hãy đăng nhập hoặc tạo tài khoản để tiếp tục
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-[14px] font-black">
          <button
            type="button"
            className={`h-12 rounded-xl border shadow-sm transition active:scale-[0.98] ${mode === "login" ? "border-[#FB3B0B] bg-[#FB3B0B] text-white shadow-[#FB3B0B]/25" : "border-[#F2C783] bg-white text-[#C83A1D]"}`}
            onClick={() => switchMode("login")}
          >
            <span className="mr-1">-&gt;</span> Đăng nhập
          </button>
          <button
            type="button"
            className={`h-12 rounded-xl border shadow-sm transition active:scale-[0.98] ${mode === "register" ? "border-[#FB3B0B] bg-[#FB3B0B] text-white shadow-[#FB3B0B]/25" : "border-[#F2C783] bg-white text-[#C83A1D]"}`}
            onClick={() => switchMode("register")}
          >
            <span className="mr-1">+</span> Đăng ký
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={submit}>
          {mode === "register" && (
            <input
              className="h-[52px] w-full rounded-xl border border-[#F1D09A] bg-white/92 px-4 text-[15px] outline-none transition placeholder:text-[#B5AAA3] focus:border-[#FB3B0B] focus:ring-4 focus:ring-[#FB3B0B]/10"
              placeholder="Họ và tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            className="h-[52px] w-full rounded-xl border border-[#F1D09A] bg-white/92 px-4 text-[15px] outline-none transition placeholder:text-[#B5AAA3] focus:border-[#FB3B0B] focus:ring-4 focus:ring-[#FB3B0B]/10"
            placeholder="Số điện thoại"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            className="h-[52px] w-full rounded-xl border border-[#F1D09A] bg-white/92 px-4 text-[15px] outline-none transition placeholder:text-[#B5AAA3] focus:border-[#FB3B0B] focus:ring-4 focus:ring-[#FB3B0B]/10"
            placeholder="Mật khẩu"
            type="password"
            value={password}
            minLength={mode === "register" ? 8 : undefined}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {mode === "register" && (
            <input
              className="h-[52px] w-full rounded-xl border border-[#F1D09A] bg-white/92 px-4 text-[15px] outline-none transition placeholder:text-[#B5AAA3] focus:border-[#FB3B0B] focus:ring-4 focus:ring-[#FB3B0B]/10"
              placeholder="Nhập lại mật khẩu"
              type="password"
              value={confirmPassword}
              minLength={8}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

          {message && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700">{message}</p>}

          <button
            className="mt-1 h-[54px] w-full rounded-xl bg-[#FB3B0B] text-[15px] font-black text-white shadow-lg shadow-[#FB3B0B]/25 transition hover:bg-[#E03209] active:scale-[0.99] disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        </form>
      </section>
    </main>
  )
}
