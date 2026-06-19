"use client"

const money = (value: number) => Number(value || 0).toLocaleString("vi-VN") + "đ"

export default function OrderDetailModal({ order, onClose }: { order: any | null; onClose: () => void }) {
  if (!order) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
    <section className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between"><div><h2 className="text-lg font-black text-[#111827]">Đơn hiện tại - Bàn {String(order.table?.number ?? "").replace(/^T/i, "")}</h2><p className="mt-1 text-sm text-[#667085]">Bàn đang dùng bữa</p></div><button className="text-2xl text-[#667085]" onClick={onClose}>×</button></div>
      <div className="my-4 border-t border-[#D0D5DD]" />
      <h3 className="text-sm font-black text-[#111827]">Chi tiết món đã gọi</h3>
      <div className="mt-2 divide-y divide-[#D0D5DD]">{order.items?.map((item: any) => <div key={item.id} className="flex justify-between gap-4 py-3"><div><p className="text-sm font-bold text-[#111827]">{item.item?.name ?? item.combo?.name}</p><p className="text-xs text-[#667085]">{item.combo ? "Combo" : "Món lẻ"} • SL: {item.quantity}</p></div><div className="text-right"><p className="text-sm font-black text-[#111827]">{money(item.price * item.quantity)}</p><p className="text-xs text-[#98A2B3]">{money(item.price)} / phần</p></div></div>)}</div>
      <div className="mt-4 flex justify-between border-t border-[#D0D5DD] pt-4"><span className="font-bold text-[#344054]">Tạm tính</span><span className="text-xl font-black text-[#B51F18]">{money(order.finalAmount)}</span></div>
      <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700">Khách chưa yêu cầu thanh toán. Không thể chuyển bàn về Trống.</p>
      <button className="mt-5 h-12 w-full rounded-md bg-[#E4E7EC] font-black text-[#344054]" onClick={onClose}>Đóng</button>
    </section>
  </div>
}
