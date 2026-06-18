type OrderStatusProps = {
  status: "WAITING" | "PREPARING" | "DONE" | "SERVED"
}

const labels = {
  WAITING: "Chờ xác nhận",
  PREPARING: "Đang chế biến",
  DONE: "Đã xong",
  SERVED: "Đã phục vụ",
}

const colors = {
  WAITING: "bg-gray-100 text-gray-700",
  PREPARING: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
  SERVED: "bg-blue-100 text-blue-700",
}

export default function OrderStatus({ status }: OrderStatusProps) {
  return <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${colors[status]}`}>{labels[status]}</span>
}
