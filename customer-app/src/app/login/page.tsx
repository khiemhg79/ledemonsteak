"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { apiPost } from "@/lib/api"
import { useAuth } from "@/store/auth"

type AuthMode = "login" | "register"

const inputClass =
  "h-[51px] w-full rounded-xl border border-[#F2CFA3] bg-[#FFFDF8] px-4 text-[14px] font-medium text-[#251B18] outline-none transition placeholder:text-[#B7AFA8] focus:border-[#FF4B16] focus:ring-4 focus:ring-[#FF4B16]/10"

function LoginIcon() {
  return (
    <svg aria-hidden="true" className="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none">
      <path d="M10 7L15 12L10 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12H3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 4H18C19.66 4 21 5.34 21 7V17C21 18.66 19.66 20 18 20H15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function RegisterIcon() {
  return (
    <svg aria-hidden="true" className="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none">
      <path d="M15 19C15 16.8 13.21 15 11 15H8C5.79 15 4 16.8 4 19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9.5 11C11.43 11 13 9.43 13 7.5C13 5.57 11.43 4 9.5 4C7.57 4 6 5.57 6 7.5C6 9.43 7.57 11 9.5 11Z" stroke="currentColor" strokeWidth="2.2" />
      <path d="M18 8V14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15 11H21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

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
    if (mode === "register" && !name.trim()) {
      setMessage("Vui lòng nhập họ và tên.")
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
      const body =
        mode === "login"
          ? { phone: normalizedPhone, password }
          : { name: name.trim(), phone: normalizedPhone, password }

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
    <main className="flex min-h-screen justify-center overflow-hidden bg-[#190B07] text-[#171B2A]">
      <div className="relative min-h-screen w-full max-w-[466px] overflow-hidden bg-[linear-gradient(90deg,#130704_0%,#251009_14%,#31150D_50%,#251009_86%,#130704_100%)]">
        <div className="absolute left-1/2 top-[14px] h-[calc(100%-28px)] w-[331px] max-w-[calc(100%-72px)] -translate-x-1/2 overflow-hidden rounded-[3px] border border-white/70 bg-[#F7EDE2] shadow-2xl shadow-black/35">
          <div className="h-[99px] bg-[linear-gradient(115deg,#8F2410_0%,#C15413_48%,#D87318_100%)] px-6 pt-[22px] text-[17px] font-black text-white">
            Le Monde Steak
          </div>

          <div className="px-[18px] pt-[18px] opacity-25 blur-[3px]">
            <div className="h-[170px] rounded-2xl bg-white shadow-[0_10px_28px_rgba(113,70,35,0.15)]">
              <div className="px-5 pt-5">
                <p className="text-[15px] font-black text-[#E04A1D]">Bàn số 1</p>
                <p className="mt-3 h-4 w-36 rounded-full bg-[#CFC7BE]" />
                <p className="mt-3 h-4 w-28 rounded-full bg-[#DED8D1]" />
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-[64px] h-[118px] bg-[linear-gradient(180deg,rgba(232,218,202,0),rgba(219,207,193,0.72),rgba(248,243,237,0.95))]" />
          <div className="absolute inset-x-0 bottom-0 h-[64px] bg-white" />
        </div>

        <section className="absolute left-1/2 top-[161px] z-10 w-[368px] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-[22px] bg-[#FFFDF8] px-[28px] pb-[24px] pt-[28px] shadow-[0_18px_36px_rgba(78,38,15,0.24)]">
          <Link
            href="/"
            className="absolute right-[21px] top-[17px] text-[27px] font-light leading-none text-[#A3A5AC] transition hover:text-[#FF4B16]"
            aria-label="Đóng"
          >
            ×
          </Link>

          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#FF4B16] text-[10px] font-black tracking-tight text-white shadow-sm shadow-[#FF4B16]/25">
            LM
          </div>

          <div className="mt-[19px] text-center">
            <h1 className="mx-auto max-w-[300px] text-[22px] font-black leading-[1.16] tracking-[-0.02em] text-[#151A2D]">
              Chào mừng bạn đến Le Monde Steak
            </h1>
            <p className="mx-auto mt-[12px] max-w-[245px] text-[13px] font-medium leading-[19px] text-[#73767D]">
              Hãy đăng nhập hoặc tạo tài khoản để tiếp tục
            </p>
          </div>

          <div className="mt-[25px] grid grid-cols-2 gap-[10px] text-[13px] font-black">
            <button
              type="button"
              className={`flex h-[35px] items-center justify-center gap-[7px] rounded-[8px] border transition active:scale-[0.98] ${mode === "login"
                ? "border-[#FF3D0A] bg-[#FF3D0A] text-white shadow-[0_8px_16px_rgba(255,61,10,0.24)]"
                : "border-[#F2D4AA] bg-[#FFFDF8] text-[#E24716]"
                }`}
              onClick={() => switchMode("login")}
            >
              <LoginIcon />
              <span>Đăng nhập</span>
            </button>

            <button
              type="button"
              className={`flex h-[35px] items-center justify-center gap-[7px] rounded-[8px] border transition active:scale-[0.98] ${mode === "register"
                ? "border-[#FF3D0A] bg-[#FF3D0A] text-white shadow-[0_8px_16px_rgba(255,61,10,0.24)]"
                : "border-[#F2D4AA] bg-[#FFFDF8] text-[#E24716]"
                }`}
              onClick={() => switchMode("register")}
            >
              <RegisterIcon />
              <span>Đăng ký</span>
            </button>
          </div>

          <form className="mt-[17px] space-y-[13px]" onSubmit={submit}>
            {mode === "register" && (
              <input
                className={inputClass}
                placeholder="Họ và tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <input
              className={inputClass}
              placeholder="Số điện thoại"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <input
              className={inputClass}
              placeholder="Mật khẩu"
              type="password"
              value={password}
              minLength={mode === "register" ? 8 : undefined}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {mode === "register" && (
              <input
                className={inputClass}
                placeholder="Nhập lại mật khẩu"
                type="password"
                value={confirmPassword}
                minLength={8}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            )}

            {message && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium leading-5 text-red-700">
                {message}
              </p>
            )}

            <button
              className="mt-[1px] h-[53px] w-full rounded-xl bg-[#FF4B16] text-[16px] font-black text-white shadow-[0_11px_22px_rgba(255,75,22,0.28)] transition hover:bg-[#EA3F0D] active:scale-[0.99] disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}