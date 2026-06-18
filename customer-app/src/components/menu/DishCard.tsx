"use client"

import { useState } from "react"
import { useCart } from "@/store/cart"

type DishCardProps = {
  id: string
  type: "dish" | "combo"
  name: string
  price: number
  description?: string | null
  category?: string
  image?: string | null
  items?: { item?: { name: string } | null; quantity: number }[]
}

const money = (value: number) => value.toLocaleString("vi-VN") + "đ"

export default function DishCard({ id, type, name, price, description, category, image, items }: DishCardProps) {
  const [open, setOpen] = useState(false)
  const addItem = useCart((s) => s.addItem)

  function addToCart() {
    addItem({ id, type, name, price, image: image ?? undefined })
  }

  return (
    <>
      <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#F0D7B0]">
        <button className="block w-full text-left" onClick={() => setOpen(true)}>
          <div className="aspect-[1.35] bg-[linear-gradient(135deg,#281511,#8B1A1A)]">
            {image ? <img src={image} alt={name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm font-black text-[#F6D690]">LE MONDE</div>}
          </div>
          <div className="p-3">
            <h3 className="line-clamp-1 text-sm font-black text-[#2B211D]">{name}</h3>
            <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-[#81736B]">{description || "Món đặc trưng của Le Monde Steak."}</p>
          </div>
        </button>
        <div className="flex items-center justify-between px-3 pb-3">
          <p className="text-sm font-black text-[#B51F18]">{money(price)}</p>
          <button className="rounded-full bg-[#D9491E] px-4 py-2 text-xs font-black text-white shadow-sm" onClick={addToCart}>
            Thêm
          </button>
        </div>
      </article>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="relative w-full max-w-sm rounded-[24px] bg-white p-5 shadow-2xl shadow-black/35" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-xl leading-none text-[#9A8B82] shadow-sm"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
            >
              ×
            </button>

            <h2 className="pr-10 text-2xl font-black leading-tight text-[#211715]">{name}</h2>
            <div className="mt-4 aspect-[1.28] overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#281511,#8B1A1A)]">
              {image ? <img src={image} alt={name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center font-black text-[#F6D690]">LE MONDE STEAK</div>}
            </div>

            <p className="mt-5 text-sm leading-6 text-[#6F625C]">{description || "Món ăn được chuẩn bị theo tiêu chuẩn phục vụ tại bàn của Le Monde Steak."}</p>
            {items?.length ? (
              <div className="mt-4 rounded-2xl bg-[#FFF8EE] p-3 text-sm text-[#6F625C]">
                <p className="font-black text-[#211715]">Món trong combo</p>
                {items.map((item, idx) => (
                  <p key={idx}>- {item.item?.name ?? "Món"} x {item.quantity}</p>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="whitespace-nowrap text-2xl font-black text-[#D9491E]">{money(price)}</p>
              <button
                className="min-w-[150px] rounded-xl bg-[#D9491E] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#D9491E]/25"
                onClick={() => {
                  addToCart()
                  setOpen(false)
                }}
              >
                + Thêm vào giỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
