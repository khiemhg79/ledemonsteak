"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import CartDrawer from "@/components/cart/CartDrawer"
import DishCard from "@/components/menu/DishCard"
import { apiGet } from "@/lib/api"
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

export default function HomePage() {
  const [qrTableId, setQrTableId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [selected, setSelected] = useState("all")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [tableError, setTableError] = useState("")
  const { tableId, setTableId, clearTableId, items, hydrate: hydrateCart } = useCart()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const hydrateAuth = useAuth((s) => s.hydrate)

  useEffect(() => {
    hydrateAuth()
    hydrateCart()
    const scannedTableId = new URLSearchParams(window.location.search).get("tableId")
    setQrTableId(scannedTableId)
  }, [hydrateAuth, hydrateCart])

  useEffect(() => {
    setLoading(true)
    setError("")
    Promise.all([apiGet("/api/menu"), apiGet("/api/tables")])
      .then(([menu, tableList]) => {
        setCategories(menu.categories ?? [])
        setDishes(menu.dishes ?? [])
        setCombos(menu.combos ?? [])
        setTables(tableList ?? [])
        const availableTables = tableList ?? []
        if (qrTableId) {
          if (availableTables.some((table: RestaurantTable) => table.id === qrTableId)) {
            setTableId(qrTableId)
            setTableError("")
          } else {
            clearTableId()
            setTableError("Mã QR bàn không hợp lệ. Vui lòng quét lại mã tại bàn.")
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
  }, [qrTableId, tableId, setTableId, clearTableId])

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
      <header className="sticky top-0 z-20 bg-[linear-gradient(100deg,#9B1C1C,#D9491E,#F08A1A)] px-4 pb-4 pt-5 text-white shadow-lg shadow-[#9B1C1C]/20">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black tracking-tight">Le Monde Steak</h1>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <p className="max-w-[120px] truncate text-sm font-bold">Chào, {user.name}</p>
                <button className="rounded-xl bg-white/95 px-3 py-2 text-sm font-bold text-[#D9491E] shadow-sm" onClick={logout}>-&gt;</button>
              </>
            ) : (
              <Link className="rounded-xl bg-white/95 px-3 py-2 text-sm font-bold text-[#D9491E] shadow-sm" href="/login">Đăng nhập</Link>
            )}
          </div>
        </div>
      </header>

      <section className="space-y-4 px-4 py-4">
        <div className="rounded-2xl border border-[#F0D7B0] bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF1DA] text-sm font-black text-[#D9491E]">P</span>
            <div>
              <p className="font-black text-[#B51F18]">{tableLabel(tableId, currentTable)}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-[#8A7A70]">
                <span className="rounded-full bg-[#FFF1DA] px-2 py-1 font-bold text-[#B95A22]">{user ? "Thành viên" : "Khách"}</span>
                {currentTable && <span>{currentTable.capacity} chỗ ngồi</span>}
              </div>
            </div>
          </div>
        </div>
        {tableError && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{tableError}</div>}

        <label className="flex h-14 items-center gap-3 rounded-2xl border border-[#F0D7B0] bg-white px-4 text-[#D9491E] shadow-sm">
          <span className="text-lg">⌕</span>
          <input className="min-w-0 flex-1 bg-transparent text-sm text-[#211715] outline-none placeholder:text-[#AA9D94]" placeholder="Tìm kiếm món ăn..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>

        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button className={`shrink-0 rounded-2xl border px-5 py-3 text-sm font-bold shadow-sm ${selected === "all" ? "border-[#D9491E] bg-[#D9491E] text-white" : "border-[#F0D7B0] bg-white text-[#D9491E]"}`} onClick={() => setSelected("all")}>Tất cả</button>
          <button className={`shrink-0 rounded-2xl border px-5 py-3 text-sm font-bold shadow-sm ${selected === "combo" ? "border-[#D9491E] bg-[#D9491E] text-white" : "border-[#F0D7B0] bg-white text-[#D9491E]"}`} onClick={() => setSelected("combo")}>Combo</button>
          {categories.map((cat) => (
            <button key={cat.id} className={`shrink-0 rounded-2xl border px-5 py-3 text-sm font-bold shadow-sm ${selected === cat.id ? "border-[#D9491E] bg-[#D9491E] text-white" : "border-[#F0D7B0] bg-white text-[#D9491E]"}`} onClick={() => setSelected(cat.id)}>{cat.name}</button>
          ))}
        </div>

        {loading && <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#8A7A70] shadow-sm">Đang tải thực đơn...</div>}
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => <DishCard key={`${item.kind}-${item.id}`} id={item.id} type={item.kind} name={item.name} price={item.price} description={item.description} image={item.image} items={item.kind === "combo" ? item.items : undefined} category={item.kind === "dish" ? item.category?.name : undefined} />)}
        </div>

        {!loading && !error && filteredItems.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#8A7A70] shadow-sm">Không tìm thấy món ăn phù hợp.</div>
        )}
      </section>

      <CartDrawer />
      <nav className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-md -translate-x-1/2 grid-cols-5 items-center border-t border-[#F0D7B0] bg-white px-3 pb-3 pt-2 shadow-2xl shadow-black/10">
        <Link className="text-center text-[11px] font-bold text-[#D9491E]" href="/">Món ăn</Link>
        <Link className="text-center text-[11px] font-semibold text-[#6F625C]" href="/order">Đơn hiện tại</Link>
        <Link className="text-center text-[11px] font-semibold text-[#6F625C]" href="/history">Lịch sử</Link>
        <Link className="text-center text-[11px] font-semibold text-[#6F625C]" href="/account">Người dùng</Link>
        <button className="pointer-events-none rounded-2xl bg-[#D9491E] px-2 py-3 text-center text-[11px] font-black text-white shadow-lg shadow-[#D9491E]/30">{items.length} món</button>
      </nav>
    </main>
  )
}
