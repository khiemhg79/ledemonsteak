"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { apiGet, apiPost } from "@/lib/api"

const money = (value: number) => value.toLocaleString("vi-VN") + "đ"

type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD" | "E_WALLET"

const paymentLabels: Record<PaymentMethod, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  CARD: "Thẻ ngân hàng",
  E_WALLET: "Ví điện tử",
}

function orderNo(id?: string) {
  if (!id) return "..."
  const digits = id.replace(/\D/g, "")
  return digits ? digits.slice(-2).padStart(2, "0") : id.slice(-4).toUpperCase()
}

export default function InvoicePage() {
  const [orders, setOrders] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [receivedAmount, setReceivedAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const [error, setError] = useState("")
  const requesting = useMemo(() => orders.filter((order) => order.table?.status === "REQUESTING_BILL"), [orders])

  async function loadOrders() {
    setError("")
    try {
      setOrders(await apiGet("/api/orders"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được hóa đơn.")
    }
  }

  function openPayment(order: any) {
    setSelected(order)
    setReceivedAmount(String(Math.round(order.finalAmount)))
    setPaymentMethod("CASH")
  }

  async function complete() {
    if (!selected) return
    await apiPost(`/api/orders/${selected.id}/checkout`, {
      complete: true,
      paymentMethod,
      receivedAmount: Number(receivedAmount || selected.finalAmount),
    })
    setSelected(null)
    loadOrders()
  }

  useEffect(() => { loadOrders() }, [])

  const change = selected ? Math.max(Number(receivedAmount || 0) - selected.finalAmount, 0) : 0

  return (
    <main className="min-h-screen bg-[#F7F7F7]">
      <header className="mx-6 mt-2 h-16 bg-[linear-gradient(90deg,#FF7A2A,#FF3D00)] px-16 text-white shadow-md">
        <div className="flex h-full items-center justify-between">
          <h1 className="text-xl font-black">Le Monde Steak</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold">Xin chào, staff</span>
            <button className="rounded-lg bg-white px-5 py-2 text-sm font-black text-[#E94713]">Đăng xuất</button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1180px] px-8 py-6">
        <div className="mb-6 flex gap-2">
          <Link href="/tables" className="rounded-md bg-[#E8ECEF] px-4 py-3 text-sm font-bold text-[#57606A] shadow-sm">Quản lý Bàn</Link>
          <Link href="/orders" className="rounded-md bg-[#E8ECEF] px-4 py-3 text-sm font-bold text-[#57606A] shadow-sm">Theo dõi Đơn hàng</Link>
          <Link href="/invoice" className="rounded-md bg-[#FF4A12] px-4 py-3 text-sm font-bold text-white shadow-sm">Thanh toán</Link>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#111]">Thanh toán</h2>
            <p className="text-sm text-[#667085]">Danh sách bàn đang yêu cầu thanh toán.</p>
          </div>
          <button className="rounded-md bg-[#FF4A12] px-5 py-3 text-sm font-bold text-white shadow-sm" onClick={loadOrders}>Làm mới</button>
        </div>

        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="grid gap-4 lg:grid-cols-3">
          {requesting.map((order) => (
            <article key={order.id} className="rounded-md border border-[#D9DEE6] bg-white p-4 shadow-md shadow-black/5">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-xl font-black text-[#111827]">Bàn {order.table?.number}</h3>
                  <p className="text-sm text-[#667085]">Đơn #{orderNo(order.id)}</p>
                </div>
                <p className="text-xl font-black text-[#B51F18]">{money(order.finalAmount)}</p>
              </div>
              <div className="mt-4 space-y-2">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between border-t border-[#111]/20 pt-2 text-sm">
                    <span className="font-semibold text-[#111827]">{item.item?.name ?? item.combo?.name} x {item.quantity}</span>
                    <span className="font-bold text-[#475467]">{money(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full rounded-md bg-[#12B76A] py-3 text-sm font-black text-white" onClick={() => openPayment(order)}>Xác nhận thanh toán</button>
            </article>
          ))}
        </div>
        {!error && requesting.length === 0 && <div className="rounded-md bg-white p-6 text-center text-sm text-gray-500">Chưa có bàn yêu cầu thanh toán.</div>}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-black text-[#111827]">Xác nhận Thanh toán</h2>
              <button className="text-2xl leading-none text-[#667085]" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-[#475467]">Đơn hàng #{orderNo(selected.id)}</p>
              <p className="text-3xl font-black text-[#111827]">{money(selected.finalAmount)}</p>
            </div>

            <div className="my-4 border-t border-[#D0D5DD]" />

            <h3 className="text-sm font-black text-[#111827]">Chi tiết món đã gọi</h3>
            <div className="mt-2 divide-y divide-[#111]/50">
              {selected.items.map((item: any) => (
                <div key={item.id} className="flex justify-between gap-4 py-2">
                  <div>
                    <p className="text-sm font-black text-[#111827]">{item.item?.name ?? item.combo?.name}</p>
                    <p className="text-xs text-[#667085]">Món lẻ • SL: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#111827]">{money(item.price * item.quantity)}</p>
                    <p className="text-xs text-[#98A2B3]">({money(item.price)} / phần)</p>
                  </div>
                </div>
              ))}
            </div>

            <label className="mt-4 block text-sm font-semibold text-[#344054]">
              Số tiền nhận (đ) <span className="text-red-500">*</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#D0D5DD] px-3 text-sm outline-none focus:border-[#12B76A] focus:ring-4 focus:ring-[#12B76A]/10"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value.replace(/\D/g, ""))}
              />
              <span className="mt-1 block text-xs font-normal text-[#667085]">{money(Number(receivedAmount || 0))}</span>
            </label>

            <label className="mt-4 block text-sm font-semibold text-[#344054]">
              Phương thức thanh toán
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#D0D5DD] bg-white px-3 text-sm outline-none focus:border-[#12B76A]"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                {Object.entries(paymentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <div className="mt-3 rounded-md bg-[#F9FAFB] p-3 text-sm">
              <div className="flex justify-between"><span className="text-[#667085]">Tiền thừa</span><span className="font-black text-[#111827]">{money(change)}</span></div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="h-12 rounded-md bg-[#E4E7EC] font-black text-[#344054]" onClick={() => setSelected(null)}>Hủy</button>
              <button className="h-12 rounded-md bg-[#12B76A] font-black text-white" onClick={complete}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
