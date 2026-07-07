"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import CustomerBottomNav from "@/components/layout/CustomerBottomNav"
import DishCard from "@/components/menu/DishCard"
import { apiGet, apiPost } from "@/lib/api"
import { subscribeRealtime } from "@/lib/realtime"
import { useAuth } from "@/store/auth"
import { useCart } from "@/store/cart"

type Category = { id: string; name: string }
type Dish = { id: string; name: string; price: number; description?: string | null; image?: string | null; category?: Category }
type Combo = { id: string; name: string; price: number; description?: string | null; image?: string | null; items?: any[] }
type RestaurantTable = { id: string; number: string; capacity: number; status: string }

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").trim().toLocaleLowerCase("vi-VN")
}

function tableLabel(tableId: string | null, table?: RestaurantTable) {
  if (!tableId) return "Chưa chọn bàn"
  if (table) {
    const match = table.number.match(/\d+/)
    return match ? `Bàn số ${Number(match[0])}` : `Bàn ${table.number}`
  }
  const match = tableId.match(/(\d+)$/)
  return match ? `Bàn số ${Number(match[1])}` : `Bàn ${tableId}`
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none">
      <path d="M10 7V6C10 4.9 10.9 4 12 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H12C10.9 20 10 19.1 10 18V17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 12H4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7 9L4 12L7 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg aria-hidden="true" className="h-[19px] w-[19px]" viewBox="0 0 24 24" fill="none">
      <path d="M12 21C12 21 19 14.7 19 8.9C19 5.1 15.87 2 12 2C8.13 2 5 5.1 5 8.9C5 14.7 12 21 12 21Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12 11.3C13.33 11.3 14.4 10.23 14.4 8.9C14.4 7.57 13.33 6.5 12 6.5C10.67 6.5 9.6 7.57 9.6 8.9C9.6 10.23 10.67 11.3 12 11.3Z" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  )
}

export default function HomePage() {
  const [qrTableId, setQrTableId] = useState<string | null>(null)
  const [scannedQrToken, setScannedQrToken] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [selected, setSelected] = useState("all")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [tableError, setTableError] = useState("")
  const { tableId, qrToken, setTableId, clearTableId, hydrate: hydrateCart } = useCart()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const hydrateAuth = useAuth((s) => s.hydrate)

  useEffect(() => {
    hydrateAuth()
    hydrateCart()
    const params = new URLSearchParams(window.location.search)
    setQrTableId(params.get("tableId"))
    setScannedQrToken(params.get("qrToken"))
  }, [hydrateAuth, hydrateCart])

  const loadMenuAndTables = useCallback((force = false, silent = false) => {
    if (!silent) setLoading(true)
    setError("")
    Promise.all([apiGet("/api/menu", undefined, { force }), apiGet("/api/public/tables", undefined, { force })])
      .then(async ([menu, tableList]) => {
        setCategories(menu.categories ?? [])
        setDishes(menu.dishes ?? [])
        setCombos(menu.combos ?? [])
        setTables(tableList ?? [])

        const availableTables = tableList ?? []
        const candidateTableId = qrTableId ?? tableId
        const candidateQrToken = qrTableId ? scannedQrToken : qrToken

        if (candidateTableId) {
          if (!candidateQrToken || !availableTables.some((table: RestaurantTable) => table.id === candidateTableId)) {
            clearTableId()
            setTableError("Mã QR bàn không hợp lệ. Vui lòng quét lại mã tại bàn.")
            return
          }

          try {
            await apiPost("/api/public/qr/validate", { tableId: candidateTableId, qrToken: candidateQrToken })
            if (tableId !== candidateTableId || qrToken !== candidateQrToken) setTableId(candidateTableId, candidateQrToken)
            setTableError("")
          } catch (error: any) {
            clearTableId()
            setTableError(error.message || "Mã QR không hợp lệ hoặc đã hết hạn.")
          }
        } else if (tableId && !availableTables.some((table: RestaurantTable) => table.id === tableId)) {
          clearTableId()
          setTableError("Bàn đã lưu không còn hoạt động. Vui lòng quét lại mã QR tại bàn.")
        } else {
          setTableError("")
        }
      })
      .catch((err) => setError(err.message || "Không tải được thực đơn."))
      .finally(() => setLoading(false))
  }, [qrTableId, scannedQrToken, tableId, qrToken, setTableId, clearTableId])

  useEffect(() => {
    loadMenuAndTables()
    const refresh = () => {
      if (document.visibilityState === "visible") loadMenuAndTables(true, true)
    }
    const unsubscribe = subscribeRealtime("customer", refresh)
    return () => {
      unsubscribe()
    }
  }, [loadMenuAndTables])

  const currentTable = tables.find((table) => table.id === tableId)

  const filteredItems = useMemo(() => {
    const keyword = normalizeSearch(query)
    const candidates = [
      ...combos.map((combo) => ({ ...combo, kind: "combo" as const, categoryId: "combo" })),
      ...dishes.map((dish) => ({ ...dish, kind: "dish" as const, categoryId: dish.category?.id ?? "" })),
    ]

    function rank(item: { name: string; description?: string | null }) {
      if (!keyword) return 0
      const name = normalizeSearch(item.name)
      const description = normalizeSearch(item.description ?? "")
      if (name.startsWith(keyword)) return 0
      if (name.includes(keyword)) return 1
      if (description.includes(keyword)) return 2
      return 99
    }

    return candidates
      .filter((item) => (selected === "all" || item.categoryId === selected) && rank(item) < 99)
      .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "vi"))
  }, [combos, dishes, selected, query])

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#FFF8EE] pb-28 text-[#211715] shadow-2xl shadow-black/10">
      <header className="sticky top-0 z-20 bg-[linear-gradient(100deg,#F34208_0%,#FA5A0A_52%,#F08A1A_100%)] px-4 py-4 text-white shadow-lg shadow-[#F34208]/20">
        <div className="flex items-center justify-between">
          <h1 className="text-[18px] font-black tracking-tight">Le Monde Steak</h1>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <p className="max-w-[112px] truncate text-[13px] font-black">Chào, {user.name}</p>
                <button
                  className="flex h-10 w-12 items-center justify-center rounded-xl bg-white text-[#F34208] shadow-sm"
                  onClick={logout}
                  aria-label="Đăng xuất"
                >
                  <LogoutIcon />
                </button>
              </>
            ) : (
              <Link className="rounded-xl bg-white px-3 py-2 text-sm font-black text-[#F34208] shadow-sm" href="/login">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="space-y-4 px-4 py-4">
        <div className="rounded-2xl border border-[#F0D7B0] bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1DA] text-[#F34208]">
              <LocationIcon />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-black leading-5 text-[#D93612]">{tableLabel(tableId, currentTable)}</p>
              <div className="mt-[2px] flex items-center gap-2 text-[11px] font-bold text-[#8A7A70]">
                <span>{user ? "Thành viên" : "Khách"}</span>
                {currentTable && <span>{currentTable.capacity} chỗ ngồi</span>}
              </div>
            </div>
          </div>
        </div>

        {tableError && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{tableError}</div>}

        <label className="flex h-14 items-center gap-3 rounded-2xl border border-[#F0D7B0] bg-white px-4 text-[#D9491E] shadow-sm">
          <span className="text-lg">⌕</span>
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-[#211715] outline-none placeholder:text-[#AA9D94]"
            placeholder="Tìm kiếm món ăn..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button className={`shrink-0 rounded-2xl border px-5 py-3 text-sm font-bold shadow-sm ${selected === "all" ? "border-[#D9491E] bg-[#D9491E] text-white" : "border-[#F0D7B0] bg-white text-[#D9491E]"}`} onClick={() => setSelected("all")}>
            Tất cả
          </button>
          <button className={`shrink-0 rounded-2xl border px-5 py-3 text-sm font-bold shadow-sm ${selected === "combo" ? "border-[#D9491E] bg-[#D9491E] text-white" : "border-[#F0D7B0] bg-white text-[#D9491E]"}`} onClick={() => setSelected("combo")}>
            Combo
          </button>
          {categories.map((cat) => (
            <button key={cat.id} className={`shrink-0 rounded-2xl border px-5 py-3 text-sm font-bold shadow-sm ${selected === cat.id ? "border-[#D9491E] bg-[#D9491E] text-white" : "border-[#F0D7B0] bg-white text-[#D9491E]"}`} onClick={() => setSelected(cat.id)}>
              {cat.name}
            </button>
          ))}
        </div>

        {loading && <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#8A7A70] shadow-sm">Đang tải thực đơn...</div>}
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <DishCard
              key={`${item.kind}-${item.id}`}
              id={item.id}
              type={item.kind}
              name={item.name}
              price={item.price}
              description={item.description}
              image={item.image}
              items={item.kind === "combo" ? item.items : undefined}
              category={item.kind === "dish" ? item.category?.name : undefined}
            />
          ))}
        </div>

        {!loading && !error && filteredItems.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#8A7A70] shadow-sm">Không tìm thấy món ăn phù hợp.</div>
        )}
      </section>

      <CustomerBottomNav active="menu" />
    </main>
  )
}