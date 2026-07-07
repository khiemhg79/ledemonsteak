"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import CustomerBottomNav from "@/components/layout/CustomerBottomNav"
import { useAuth } from "@/store/auth"
import { useCart } from "@/store/cart"

type AccountUser = {
  id: string
  name: string
  role: string
  phone?: string
  email?: string
}

const fieldClass =
  "mt-2 h-12 w-full rounded-xl border border-[#F0D7B0] bg-white px-4 text-sm font-semibold text-[#211715] outline-none transition placeholder:text-[#AFA59E] focus:border-[#F34208] focus:ring-4 focus:ring-[#F34208]/10"

function LogoutIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path d="M10 7V6C10 4.9 10.9 4 12 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H12C10.9 20 10 19.1 10 18V17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 12H4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7 9L4 12L7 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function AccountPage() {
  const user = useAuth((s) => s.user) as AccountUser | null
  const token = useAuth((s) => s.token)
  const hydrateAuth = useAuth((s) => s.hydrate)
  const login = useAuth((s) => s.login)
  const logout = useAuth((s) => s.logout)
  const hydrateCart = useCart((s) => s.hydrate)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    hydrateAuth()
    hydrateCart()
  }, [hydrateAuth, hydrateCart])

  useEffect(() => {
    if (!user) return
    setName(user.name ?? "")
    setPhone(user.phone ?? "")
    setEmail(user.email ?? "")
  }, [user])

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    if (!user || !token) return
    if (!name.trim()) {
      setMessage("Vui lòng nhập họ và tên.")
      return
    }

    const updatedUser = {
      ...user,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    }

    login(updatedUser, token)
    setMessage("Đã lưu thay đổi.")
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#FFF9EA] pb-24 text-[#211715] shadow-2xl shadow-black/10">
      <header className="sticky top-0 z-20 bg-[linear-gradient(100deg,#F34208,#F08A1A)] px-4 pb-4 pt-4 text-white shadow-lg shadow-[#F34208]/20">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black tracking-tight">Le Monde Steak</h1>
          <button className="flex h-10 w-12 items-center justify-center rounded-xl bg-white text-[#F34208] shadow-sm" onClick={logout} aria-label="Đăng xuất">
            <LogoutIcon />
          </button>
        </div>
      </header>

      <section className="px-4 pb-5 pt-0">
        <h2 className="-mt-1 text-[22px] font-black leading-tight text-[#181818]">Thông tin tài khoản</h2>

        {!user ? (
          <div className="mt-4 rounded-2xl border border-[#F0D7B0] bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-[#6F625C]">Bạn chưa đăng nhập.</p>
            <Link className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#F34208] px-5 text-sm font-black text-white shadow-lg shadow-[#F34208]/20" href="/login">
              Đăng nhập
            </Link>
          </div>
        ) : (
          <form className="mt-4 rounded-2xl border border-[#F4E5CF] bg-white px-5 py-5 shadow-sm" onSubmit={saveProfile}>
            <label className="block text-sm font-semibold text-[#6F625C]">
              Họ và tên
              <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} />
            </label>

            <label className="mt-4 block text-sm font-semibold text-[#6F625C]">
              Số điện thoại
              <input className={fieldClass} inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>

            <label className="mt-4 block text-sm font-semibold text-[#6F625C]">
              Email
              <input className={fieldClass} type="email" placeholder="Email (tùy chọn)" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>

            {message && (
              <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                {message}
              </p>
            )}

            <button className="mt-5 h-12 w-full rounded-xl bg-[#F34208] text-sm font-black text-white shadow-lg shadow-[#F34208]/20 transition active:scale-[0.99]">
              Lưu thay đổi
            </button>
          </form>
        )}
      </section>

      <CustomerBottomNav active="account" />
    </main>
  )
}