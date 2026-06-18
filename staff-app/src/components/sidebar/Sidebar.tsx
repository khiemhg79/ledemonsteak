"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/", label: "Tổng quan" },
  { href: "/orders", label: "Đơn hàng" },
  { href: "/tables", label: "Bàn & QR" },
  { href: "/invoice", label: "Hóa đơn" },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="min-h-screen w-60 border-r border-gray-200 bg-white p-4">
      <h1 className="text-lg font-bold text-[#8B1A1A]">Le Monde Steak</h1>
      <p className="text-xs text-gray-500">Staff workspace</p>
      <nav className="mt-8 space-y-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={`block rounded-lg px-3 py-2 text-sm font-medium ${path === link.href ? "bg-[#8B1A1A] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
