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
  const { tableId, setTableId, items, hydrate: hydrateCart } = useCart()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const hydrateAuth = useAuth((s) => s.hydrate)

  useEffect(() => {
    hydrateAuth()
    hydrateCart()
    const scannedTableId = new URLSearchParams(window.location.search).get("tableId")
    setQrTableId(scannedTableId)
    if (scannedTableId) setTableId(scannedTableId)
  }, [hydrateAuth, hydrateCart, setTableId])

  useEffect(() => {
    setLoading(true)
    setError("")
    Promise.all([apiGet("/api/menu"), apiGet("/api/tables")])
      .then(([menu, tableList]) => {
        setCategories(menu.categories ?? [])
        setDishes(menu.dishes ?? [])
        setCombos(menu.combos ?? [])
        setTables(tableList ?? [])
        if (qrTableId && !(tableList ?? []).some((table: RestaurantTable) => table.id === qrTableId)) {
          setTableError("Mã QR bàn không hợp lệ. Vui lòng quét lại mã tại bàn.")
        } else {
          setTableError("")
        }
      })
      .catch((err) => setError(err.message || "Không tải được thực đơn."))
      .finally(() => setLoading(false))
  }, [qrTableId])

  const currentTable = tables.find((table) => table.id === tableId)

  const filteredDishes = useMemo(() => dishes.filter((dish) => {
    const matchCategory = selected === "all" || dish.category?.id === selected
    const matchText = dish.name.toLowerCase().includes(query.toLowerCase())
    return matchCategory && matchText
  }), [dishes, selected, query])

  const filteredCombos = useMemo(() => {
    if (selected !== "all" && selected !== "combo") return []
    return combos.filter((combo) => combo.name.toLowerCase().includes(query.toLowerCase()))
  }, [combos, selected, query])

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
              <p className="text-xs text-[#8A7A70]">{currentTable ? `${currentTable.capacity} chỗ ngồi` : user ? "Thành viên" : "Khách QR"}</p>
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
          {filteredCombos.map((combo) => <DishCard key={combo.id} id={combo.id} type="combo" name={combo.name} price={combo.price} description={combo.description} image={combo.image} items={combo.items} />)}
          {filteredDishes.map((dish) => <DishCard key={dish.id} id={dish.id} type="dish" name={dish.name} price={dish.price} description={dish.description} image={dish.image} category={dish.category?.name} />)}
        </div>

        {!loading && !error && !filteredCombos.length && !filteredDishes.length && (
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
