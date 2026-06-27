import type { Metadata } from "next"
import "./globals.css"
import AdminShell from "@/components/layout/AdminShell"

export const metadata: Metadata = { title: "Le Monde Steak - Admin" }

const apiOrigin = process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : ""

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {apiOrigin && <link rel="preconnect" href={apiOrigin} crossOrigin="" />}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
      </head>
      <body className="min-h-screen bg-black text-white">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  )
}
