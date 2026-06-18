import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = { title: "Le Monde Steak - Staff" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#F7F7F7]">
        {children}
      </body>
    </html>
  )
}
