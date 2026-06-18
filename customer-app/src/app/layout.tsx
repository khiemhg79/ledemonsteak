import type { Metadata } from "next"
import "./globals.css"
export const metadata: Metadata = { title: "Le Monde Steak", description: "Đặt món tại bàn" }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm">
          {children}
        </div>
      </body>
    </html>
  )
}
