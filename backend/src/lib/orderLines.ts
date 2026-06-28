export type StoredOrderLineStatus = "WAITING" | "PREPARING" | "DONE" | "SERVED"

export type StoredOrderLine = {
  id: string
  itemId: string | null
  comboId: string | null
  quantity: number
  price: number
  status: StoredOrderLineStatus
  item: { id: string; name: string } | null
  combo: { id: string; name: string } | null
}

export function parseOrderLines(customerNotes?: string | null): StoredOrderLine[] {
  if (!customerNotes) return []
  try {
    const parsed = JSON.parse(customerNotes)
    return Array.isArray(parsed?.items) ? parsed.items : []
  } catch {
    return []
  }
}

export function packOrderLines(lines: StoredOrderLine[], note = "") {
  return JSON.stringify({ note, items: lines })
}

export function attachOrderItems<T extends { customerNotes?: string | null }>(order: T) {
  return { ...order, items: parseOrderLines(order.customerNotes) }
}

