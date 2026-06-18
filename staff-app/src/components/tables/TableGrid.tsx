"use client"

type TableStatus = "EMPTY" | "OCCUPIED" | "REQUESTING_BILL"

type TableGridProps = {
  tables: any[]
  onSelect: (table: any) => void
  onStatusChange: (tableId: string, status: TableStatus) => void
}

const statusCard: Record<TableStatus, string> = {
  EMPTY: "border-[#52D891] bg-[#D7F8E4]",
  OCCUPIED: "border-[#F7C838] bg-[#FFF6BD]",
  REQUESTING_BILL: "border-[#FF7B7B] bg-[#FFD7D7]",
}

const statusLabel: Record<TableStatus, string> = {
  EMPTY: "Trống",
  OCCUPIED: "Đang dùng bữa",
  REQUESTING_BILL: "Yêu cầu thanh toán",
}

const statusOptions: { value: TableStatus; label: string }[] = [
  { value: "EMPTY", label: "Trống" },
  { value: "OCCUPIED", label: "Đang dùng bữa" },
  { value: "REQUESTING_BILL", label: "Yêu cầu thanh toán" },
]

function tableNumber(number: string) {
  const digits = number.match(/\d+/)?.[0]
  return digits ? Number(digits) : number
}

export default function TableGrid({ tables, onSelect, onStatusChange }: TableGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {tables.map((table) => (
        <article key={table.id} className={`rounded-md border-2 p-4 text-center shadow-sm ${statusCard[table.status as TableStatus] ?? "border-gray-200 bg-white"}`}>
          <button className="block w-full" onClick={() => onSelect(table)}>
            <h3 className="text-xl font-black text-[#1F1F1F]">Bàn {tableNumber(table.number)}</h3>
            <p className="mt-2 text-sm text-[#333]">{table.capacity} chỗ ngồi</p>
            <span className="mt-2 inline-block rounded-full bg-white px-4 py-1 text-xs font-bold text-[#333]">{statusLabel[table.status as TableStatus] ?? table.status}</span>
          </button>
          <select
            className="mt-4 h-9 w-full rounded-sm border border-[#555]/50 bg-white/55 px-2 text-sm outline-none"
            value={table.status}
            onChange={(e) => onStatusChange(table.id, e.target.value as TableStatus)}
          >
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </article>
      ))}
    </div>
  )
}
