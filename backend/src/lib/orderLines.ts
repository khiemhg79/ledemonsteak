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

type OrderDetailLike = {
  id: string
  itemId?: string | null
  comboId?: string | null
  quantity: number
  price: number
  status: StoredOrderLineStatus
  item?: { id: string; name: string } | null
  combo?: { id: string; name: string } | null
}

export function mapOrderDetails(details?: OrderDetailLike[] | null): StoredOrderLine[] {
  return (details ?? []).map((detail) => ({
    id: detail.id,
    itemId: detail.itemId ?? null,
    comboId: detail.comboId ?? null,
    quantity: detail.quantity,
    price: Number(detail.price),
    status: detail.status,
    item: detail.item ? { id: detail.item.id, name: detail.item.name } : null,
    combo: detail.combo ? { id: detail.combo.id, name: detail.combo.name } : null,
  }))
}

export function attachOrderItems<T extends { customerNotes?: string | null; orderDetails?: OrderDetailLike[] | null }>(order: T) {
  const detailLines = mapOrderDetails(order.orderDetails)
  return { ...order, items: detailLines.length > 0 ? detailLines : parseOrderLines(order.customerNotes) }
}
