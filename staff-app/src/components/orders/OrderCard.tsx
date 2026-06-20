"use client"

import { apiPatch } from "@/lib/api"

type OrderCardProps = {
  order: any
  onChanged: () => void
  onError: (message: string) => void
}

const nextStatus: Record<string, string> = {
  WAITING: "PREPARING",
  PREPARING: "DONE",
  DONE: "SERVED",
}

const buttonLabel: Record<string, string> = {
  WAITING: "▶ Bắt đầu",
  PREPARING: "✓ Xong món",
  DONE: "✓ Đã phục vụ",
}

const buttonStyle: Record<string, string> = {
  WAITING: "bg-[#2F80ED] text-white",
  PREPARING: "bg-[#20B85A] text-white",
  DONE: "bg-[#6B7280] text-white",
}

const money = (value: number) => value.toLocaleString("vi-VN") + "đ"

function tableNumber(number?: string) {
  const digits = number?.match(/\d+/)?.[0]
  return digits ? Number(digits) : number
}

export default function OrderCard({ order, onChanged, onError }: OrderCardProps) {
  async function updateItem(itemId: string, status: string) {
    try {
      await apiPatch(`/api/orders/${order.id}/items`, { itemId, status })
      onChanged()
    } catch (error) {
      onError(error instanceof Error ? error.message : "Không cập nhật được trạng thái món ăn.")
    }
  }

  return (
    <article className="rounded-md border border-[#D9DEE6] bg-white p-4 shadow-md shadow-black/5">
      <h2 className="text-xl font-black text-[#1F2937]">Bàn {tableNumber(order.table?.number)}</h2>
      <p className="mt-1 text-sm text-[#536173]">{new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} {new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
      <p className="mt-4 text-sm font-bold text-[#1F2937]">Món ăn:</p>

      <div className="mt-2 divide-y divide-[#111]/60">
        {order.items.map((item: any) => {
          const label = item.item?.name ?? item.combo?.name
          const isCombo = !!item.combo
          return (
            <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-[#111827]">{item.quantity}x {label}</p>
                  {isCombo && <span className="rounded-full bg-[#DDF3FF] px-2 py-1 text-[10px] font-bold text-[#1683B8]">Combo</span>}
                </div>
                <p className="mt-2 text-sm text-[#536173]">{money(item.price * item.quantity)}</p>
              </div>
              {nextStatus[item.status] ? (
                <button className={`h-7 rounded-md px-3 text-xs font-black ${buttonStyle[item.status]}`} onClick={() => updateItem(item.id, nextStatus[item.status])}>
                  {buttonLabel[item.status]}
                </button>
              ) : (
                <span className="h-7 rounded-md bg-[#6B7280] px-3 py-1 text-xs font-black text-white">✓ Đã phục vụ</span>
              )}
            </div>
          )
        })}
      </div>
    </article>
  )
}
