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
  items: CartItem[]
  hydrate: () => void
  setTableId: (id: string) => void
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  total: () => number
}

export const useCart = create<CartStore>((set, get) => ({
  tableId: null,
  items: [],
  hydrate: () => {
    if (typeof window === "undefined") return
    set({ tableId: localStorage.getItem("tableId") })
  },
  setTableId: (id) => {
    if (typeof window !== "undefined") localStorage.setItem("tableId", id)
    set({ tableId: id })
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
