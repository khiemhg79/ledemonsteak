"use client"

export type Voucher = {
  id: string
  name: string
  code: string
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
  minOrder: number
  maxDiscount?: number | null
  description?: string | null
  startDate: string
  endDate: string
  availabilityStatus?: "ACTIVE" | "UPCOMING"
}

const money = (value: number) => Number(value || 0).toLocaleString("vi-VN") + "đ"
const date = (value: string) => new Date(value).toLocaleDateString("vi-VN")

function discountLabel(voucher: Voucher) {
  return voucher.discountType === "PERCENTAGE" ? `Giảm ${voucher.discountValue}%` : `Giảm ${money(voucher.discountValue)}`
}

export default function VoucherList({ vouchers, amount, selectedCode, onApply, busyCode }: {
  vouchers: Voucher[]
  amount: number
  selectedCode: string
  onApply: (code: string) => void
  busyCode?: string
}) {
  if (vouchers.length === 0) return <div className="rounded-xl border border-[#F0D7B0] bg-white p-3 text-sm text-[#8A7A70]">Không có mã giảm giá.</div>

  return <div className="space-y-2">
    {vouchers.map((voucher) => {
      const upcoming = voucher.availabilityStatus === "UPCOMING" || new Date(voucher.startDate).getTime() > Date.now()
      const insufficient = amount < voucher.minOrder
      const selected = selectedCode === voucher.code
      return <article key={voucher.id} className={`rounded-xl border bg-white p-3 shadow-sm ${selected ? "border-[#D9491E] ring-1 ring-[#D9491E]/20" : "border-[#F0D7B0]"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-[#D9491E]">{voucher.name}</h3>
              <span className="rounded-md bg-[#FBE7C9] px-2 py-1 text-xs font-bold text-[#B95A22]">{discountLabel(voucher)}</span>
              <span className={`rounded-full px-2 py-1 text-[10px] font-black ${upcoming ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>{upcoming ? "Sắp hoạt động" : "Đang hoạt động"}</span>
            </div>
            <p className="mt-2 font-mono text-xs font-black text-[#B93A16]">Mã: {voucher.code}</p>
            <p className="mt-1 text-xs leading-5 text-[#6F625C]">{voucher.description || `Áp dụng cho đơn từ ${money(voucher.minOrder)}.`}</p>
            <p className="mt-1 text-xs text-[#8A7A70]">Điều kiện: đơn từ {money(voucher.minOrder)} · Hết hạn: {date(voucher.endDate)}</p>
            {upcoming && <p className="mt-1 text-xs font-bold text-blue-700">Bắt đầu từ {date(voucher.startDate)}</p>}
            {!upcoming && insufficient && <p className="mt-1 text-xs font-bold text-amber-600">Cần thêm {money(voucher.minOrder - amount)} để sử dụng</p>}
          </div>
          <button className="shrink-0 text-sm font-black text-[#D9491E] disabled:text-[#B7A79E]" disabled={upcoming || insufficient || busyCode === voucher.code} onClick={() => onApply(voucher.code)}>
            {busyCode === voucher.code ? "Đang áp dụng" : selected ? "Đã áp dụng" : upcoming ? "Chưa mở" : insufficient ? "Chưa đủ" : "Áp dụng"}
          </button>
        </div>
      </article>
    })}
  </div>
}
