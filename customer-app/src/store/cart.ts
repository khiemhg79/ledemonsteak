import { create } from "zustand"

export interface CartItem {
  id: string
  type: "dish" | "combo"
  name: string
  price: number
  quantity: number
  image?: string
}

interface CartStore {
  tableId: string | null
  qrToken: string | null
  items: CartItem[]
  hydrate: () => void
  setTableId: (id: string, qrToken: string) => void
  clearTableId: () => void
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  total: () => number
}

export const useCart = create<CartStore>((set, get) => ({
  tableId: null,
  qrToken: null,
  items: [],
  hydrate: () => {
    if (typeof window === "undefined") return
    set({ tableId: localStorage.getItem("tableId"), qrToken: localStorage.getItem("qrToken") })
  },
  setTableId: (id, qrToken) => {
    if (typeof window !== "undefined") { localStorage.setItem("tableId", id); localStorage.setItem("qrToken", qrToken) }
    set((state) => ({ tableId: id, qrToken, items: state.tableId && state.tableId !== id ? [] : state.items }))
  },
  clearTableId: () => {
    if (typeof window !== "undefined") { localStorage.removeItem("tableId"); localStorage.removeItem("qrToken") }
    set({ tableId: null, qrToken: null, items: [] })
  },
  addItem: (item) => {
    const exists = get().items.find((i) => i.id === item.id)
    if (exists) {
      set({ items: get().items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) })
    } else {
      set({ items: [...get().items, { ...item, quantity: 1 }] })
    }
  },
  removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  updateQty: (id, qty) => {
    if (qty <= 0) { get().removeItem(id); return }
    set({ items: get().items.map((i) => i.id === id ? { ...i, quantity: qty } : i) })
  },
  clearCart: () => set({ items: [] }),
  total: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
}))
