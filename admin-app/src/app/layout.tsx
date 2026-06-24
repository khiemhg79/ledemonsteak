import type { Metadata } from "next"
import "./globals.css"
import AdminShell from "@/components/layout/AdminShell"

export const metadata: Metadata = { title: "Le Monde Steak - Admin" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-black text-white">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  )
}
