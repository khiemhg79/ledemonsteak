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
    <main className="min-h-screen bg-[#FFF8EE] text-[#171B2A]">
      <div className="relative mx-auto min-h-[900px] w-full max-w-md overflow-hidden bg-[#FFF8EE] shadow-2xl shadow-black/10">
        <div className="absolute inset-0">
          <header className="h-[86px] bg-[linear-gradient(100deg,#F34208_0%,#FA5A0A_52%,#F08A1A_100%)] px-5 pt-8 text-white shadow-lg shadow-[#F34208]/20">
            <div className="flex items-center justify-between">
              <h1 className="text-[18px] font-black tracking-tight">Le Monde Steak</h1>
              <div className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#F34208] shadow-sm">Đăng nhập</div>
            </div>
          </header>

          <div className="space-y-5 px-5 py-5 opacity-45 blur-[2px]">
            <div className="rounded-2xl border border-[#F0D7B0] bg-white px-5 py-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF1DA] text-[#F34208]">⌖</div>
                <div>
                  <p className="text-[15px] font-black text-[#D93612]">Chưa chọn bàn</p>
                  <p className="mt-1 text-xs font-bold text-[#8A7A70]">Khách</p>
                </div>
              </div>
            </div>

            <div className="flex h-14 items-center gap-3 rounded-2xl border border-[#F0D7B0] bg-white px-4 text-[#D9491E] shadow-sm">
              <span className="text-lg">⌕</span>
              <span className="text-sm text-[#8A7A70]">Tìm kiếm món ăn...</span>
            </div>

            <div className="flex gap-3 overflow-hidden">
              <div className="rounded-2xl bg-[#D9491E] px-7 py-4 text-sm font-black text-white">Tất cả</div>
              <div className="rounded-2xl border border-[#F0D7B0] bg-white px-7 py-4 text-sm font-black text-[#D9491E]">Combo</div>
              <div className="rounded-2xl border border-[#F0D7B0] bg-white px-7 py-4 text-sm font-black text-[#D9491E]">Petit Classique</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="overflow-hidden rounded-2xl border border-[#F0D7B0] bg-white shadow-sm">
                <div className="h-[150px] bg-[radial-gradient(circle_at_50%_45%,#F5B64A_0%,#9A1B18_48%,#4A120F_100%)]" />
                <div className="space-y-2 p-4">
                  <div className="h-4 rounded-full bg-[#1B1D2B]" />
                  <div className="h-3 w-3/4 rounded-full bg-[#B8AAA0]" />
                  <div className="mt-4 flex items-center justify-between">
                    <div className="h-4 w-20 rounded-full bg-[#C51E16]" />
                    <div className="h-9 w-20 rounded-full bg-[#D9491E]" />
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#F0D7B0] bg-white shadow-sm">
                <div className="h-[150px] bg-[radial-gradient(circle_at_50%_45%,#F8E7D0_0%,#8C3A23_48%,#4E1B13_100%)]" />
                <div className="space-y-2 p-4">
                  <div className="h-4 rounded-full bg-[#1B1D2B]" />
                  <div className="h-3 w-3/4 rounded-full bg-[#B8AAA0]" />
                  <div className="mt-4 flex items-center justify-between">
                    <div className="h-4 w-20 rounded-full bg-[#C51E16]" />
                    <div className="h-9 w-20 rounded-full bg-[#D9491E]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-[82px] border-t border-[#F0D7B0] bg-white/95 shadow-[0_-16px_30px_rgba(64,32,15,0.08)]" />
        </div>

        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

        <section className="absolute left-1/2 top-[206px] z-10 w-[368px] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-[24px] bg-[#FFFDF8] px-[28px] pb-[26px] pt-[30px] shadow-[0_22px_46px_rgba(58,25,11,0.24)]">
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