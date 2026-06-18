"use client"

import Link from "next/link"
import { useAuth } from "@/store/auth"

export default function AccountPage() {
  const { user, logout } = useAuth()

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-xl font-bold text-gray-900">Tài khoản</h1>
      {!user ? (
        <div className="mt-4 rounded-xl bg-white p-5 text-center shadow-sm">
          <p className="text-sm text-gray-500">Bạn chưa đăng nhập.</p>
          <Link className="mt-4 inline-block rounded-md bg-[#8B1A1A] px-4 py-2 text-sm font-semibold text-white" href="/login">Đăng nhập</Link>
        </div>
      ) : (
        <section className="mt-4 rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Họ và tên</p>
          <p className="font-bold text-gray-900">{user.name}</p>
          <p className="mt-4 text-sm text-gray-500">Vai trò</p>
          <p className="font-semibold text-[#8B1A1A]">{user.role}</p>
          <button className="mt-6 w-full rounded-md border border-red-200 py-2 text-sm font-semibold text-red-600" onClick={logout}>Đăng xuất</button>
        </section>
      )}
    </main>
  )
}
