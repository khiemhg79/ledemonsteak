"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/dashboard", label: "Tổng quan", icon: "⌘" },
  { href: "/users", label: "Người dùng", icon: "♙" },
  { href: "/menu", label: "Thực đơn", icon: "⌁" },
  { href: "/promotions", label: "Khuyến mãi", icon: "▣" },
  { href: "/tables", label: "Bàn", icon: "▦" },
]

export default function AdminSidebar() {
  const path = usePathname()

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-[#182238] bg-black px-4 py-5">
      <nav className="space-y-2">
        {links.map((link) => {
          const active = path === link.href || (link.href === "/dashboard" && path === "/")
          return (
            <Link key={link.href} href={link.href} className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-[#1E2B44] text-white" : "text-[#D4D9E4] hover:bg-[#0A1020]"}`}>
              <span className="flex items-center gap-3"><span className="w-4 text-center text-[#C7D2E5]">{link.icon}</span>{link.label}</span>
              {active && <span className="text-[#93A4C0]">›</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
