"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { apiDelete, apiGet, apiGetCached, apiPatch, apiPost } from "@/lib/api"
import { subscribeRealtime } from "@/lib/realtime"
import Modal from "@/components/ui/Modal"

type DiscountType = "PERCENTAGE" | "FIXED"
type Promotion = {
  id: string
  name: string
  code: string
  discountType: DiscountType
  discountValue: number
  minOrder: number
  maxDiscount: number | null
  usageLimit: number | null
  usageCount: number
  startDate: string
  endDate: string
  description: string | null
  isActive: boolean
}

type PromotionForm = {
  name: string
  code: string
  discountType: DiscountType
  discountValue: string
  minOrder: string
  maxDiscount: string
  usageLimit: string
  startDate: string
  endDate: string
  description: string
  isActive: boolean
}

const today = new Date().toISOString().slice(0, 10)
const PROMOTIONS_PATH = "/api/promotions"
const baseForm: PromotionForm = {
  name: "",
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "20",
  minOrder: "100000",
  maxDiscount: "50000",
  usageLimit: "100",
  startDate: today,
  endDate: "2026-12-31",
  description: "",
  isActive: true,
}

function money(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`
}

function dateText(value: string) {
  return new Date(value).toLocaleDateString("vi-VN")
}

function cleanText(value: string, max = 50) {
  return value.replace(/\s+/g, " ").trimStart().slice(0, max)
}

function cleanCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30)
}

function cleanNumber(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength)
}

export default function PromotionTable() {
  const [promos, setPromos] = useState<Promotion[]>([])
  const [form, setForm] = useState<PromotionForm>(baseForm)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [deleting, setDeleting] = useState<Promotion | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [touched, setTouched] = useState(false)

  const validation = useMemo(() => {
    const discountValue = Number(form.discountValue)
    const minOrder = form.minOrder ? Number(form.minOrder) : 0
    const maxDiscount = form.maxDiscount ? Number(form.maxDiscount) : null
    const usageLimit = form.usageLimit ? Number(form.usageLimit) : null
    const errors = [
      !form.name.trim() ? "Vui lòng nhập tên chương trình khuyến mãi." : "",
      !form.code.trim() ? "Vui lòng nhập mã khuyến mãi." : "",
      !form.discountValue || !Number.isFinite(discountValue) || discountValue <= 0 ? "Giá trị khuyến mãi không hợp lệ." : "",
      form.discountType === "PERCENTAGE" && discountValue > 100 ? "Giá trị phần trăm không được lớn hơn 100%." : "",
      form.discountType === "FIXED" && discountValue > 999999 ? "Giá trị giảm theo số tiền tối đa là 999.999đ." : "",
      !Number.isFinite(minOrder) || minOrder < 0 ? "Đơn tối thiểu không hợp lệ." : "",
      maxDiscount != null && (!Number.isFinite(maxDiscount) || maxDiscount < 0) ? "Giảm tối đa không hợp lệ." : "",
      usageLimit != null && (!Number.isFinite(usageLimit) || usageLimit <= 0) ? "Giới hạn sử dụng không hợp lệ." : "",
      !form.startDate || !form.endDate ? "Vui lòng nhập ngày bắt đầu và ngày kết thúc." : "",
      form.startDate && form.endDate && form.endDate < form.startDate ? "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu." : "",
    ].filter(Boolean)
    return errors
  }, [form])

  async function load(force = false) {
    try {
      setPromos(await apiGet(PROMOTIONS_PATH, undefined, { force }))
    } catch (error: any) {
      setMessage(error.message)
    }
  }

  useEffect(() => {
    const cached = apiGetCached(PROMOTIONS_PATH)
    if (cached) {
      setPromos(cached)
      void load(true)
    } else {
      void load()
    }
    const unsubscribe = subscribeRealtime("admin-promotions", () => {
      if (document.visibilityState === "visible") load(false)
    })
    return unsubscribe
  }, [])

  function showCreate() {
    setEditing(null)
    setForm(baseForm)
    setTouched(false)
    setMessage("")
    setOpen(true)
  }

  function showEdit(promo: Promotion) {
    setEditing(promo)
    setForm({
      name: promo.name,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: String(promo.discountValue),
      minOrder: String(promo.minOrder ?? 0),
      maxDiscount: promo.maxDiscount == null ? "" : String(promo.maxDiscount),
      usageLimit: promo.usageLimit == null ? "" : String(promo.usageLimit),
      startDate: promo.startDate.slice(0, 10),
      endDate: promo.endDate.slice(0, 10),
      description: promo.description ?? "",
      isActive: promo.isActive,
    })
    setTouched(false)
    setMessage("")
    setOpen(true)
  }

  function payload() {
    return {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrder: form.minOrder ? Number(form.minOrder) : 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description.trim(),
      isActive: form.isActive,
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    setMessage("")
    if (validation.length) return

    setBusy(true)
    try {
      if (editing) await apiPatch(`/api/promotions/${editing.id}`, payload())
      else await apiPost("/api/promotions", payload())
      setOpen(false)
      await load(true)
      setMessage(editing ? "Đã cập nhật khuyến mãi." : "Đã tạo khuyến mãi.")
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function removePromotion() {
    if (!deleting) return
    setBusy(true)
    setMessage("")
    try {
      await apiDelete(`/api/promotions/${deleting.id}`)
      setDeleting(null)
      await load(true)
      setMessage("Đã xóa khuyến mãi khỏi danh sách hoạt động.")
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="admin-primary" onClick={showCreate}>+ Thêm khuyến mãi</button>
      </div>

      {message && <p className="rounded-lg border border-[#263756] bg-[#0B1427] px-4 py-3 text-sm text-[#B9D4FF]">{message}</p>}

      <div className="overflow-x-auto rounded-xl border border-[#1D2B46] bg-black">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-[#11182B] text-left text-[#DCE7FF]">
            <tr>
              <th className="p-4">#</th>
              <th>Tên</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Thời gian</th>
              <th>Sử dụng</th>
              <th>Trạng thái</th>
              <th className="pr-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((promo, index) => (
              <tr key={promo.id} className="border-t border-[#132033] text-[#E9F2FF]">
                <td className="p-4">{index + 1}</td>
                <td>
                  <div className="font-bold">{promo.name}</div>
                  <div className="mt-1 text-xs text-[#75849D]">{promo.code}</div>
                </td>
                <td>{promo.discountType === "PERCENTAGE" ? "Phần trăm" : "Số tiền"}</td>
                <td className="font-semibold text-[#00E09D]">{promo.discountType === "PERCENTAGE" ? `${promo.discountValue}%` : money(promo.discountValue)}</td>
                <td>{dateText(promo.startDate)}<br />{dateText(promo.endDate)}</td>
                <td>{promo.usageCount}/{promo.usageLimit ?? "∞"}</td>
                <td><span className={promo.isActive ? "admin-active" : "admin-inactive"}>{promo.isActive ? "Hoạt động" : "Tạm dừng"}</span></td>
                <td className="pr-5 text-right">
                  <button className="admin-edit" onClick={() => showEdit(promo)}>Sửa</button>
                  {promo.isActive && <button className="admin-delete" onClick={() => setDeleting(promo)}>Xóa</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={editing ? "Sửa khuyến mãi" : "Thêm khuyến mãi"} onClose={() => setOpen(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
          <label className="admin-field">
            Tên khuyến mãi
            <input
              value={form.name}
              maxLength={50}
              onBlur={() => setForm((current) => ({ ...current, name: current.name.trim() }))}
              onChange={(e) => setForm({ ...form, name: cleanText(e.target.value, 50) })}
              placeholder="VD: Giảm 20% cuối tuần"
              required
            />
          </label>
          <label className="admin-field">
            Mã khuyến mãi
            <input
              className="uppercase"
              value={form.code}
              maxLength={30}
              onChange={(e) => setForm({ ...form, code: cleanCode(e.target.value) })}
              placeholder="VD: WEEKEND20"
              required
            />
          </label>

          <label className="admin-field">
            Loại
            <select
              value={form.discountType}
              onChange={(e) => {
                const discountType = e.target.value as DiscountType
                setForm({ ...form, discountType, discountValue: discountType === "PERCENTAGE" ? "20" : "50000" })
              }}
            >
              <option value="PERCENTAGE">Phần trăm (%)</option>
              <option value="FIXED">Số tiền (đ)</option>
            </select>
          </label>
          <label className="admin-field">
            Giá trị
            <input
              inputMode="numeric"
              value={form.discountValue}
              maxLength={form.discountType === "PERCENTAGE" ? 3 : 6}
              onChange={(e) => setForm({ ...form, discountValue: cleanNumber(e.target.value, form.discountType === "PERCENTAGE" ? 3 : 6) })}
              required
            />
          </label>

          <label className="admin-field">
            Ngày bắt đầu
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </label>
          <label className="admin-field">
            Ngày kết thúc
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </label>

          <label className="admin-field md:col-span-2">
            Mô tả
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, 255) })} placeholder="Mô tả về khuyến mãi" />
          </label>

          <label className="admin-field">
            Đơn tối thiểu
            <input inputMode="numeric" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: cleanNumber(e.target.value, 9) })} placeholder="100000" />
          </label>
          <label className="admin-field">
            Giảm tối đa
            <input inputMode="numeric" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: cleanNumber(e.target.value, 9) })} placeholder="50000" />
          </label>

          <label className="admin-field">
            Giới hạn sử dụng
            <input inputMode="numeric" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: cleanNumber(e.target.value, 6) })} placeholder="100" />
          </label>
          <label className="flex items-center gap-3 self-end rounded-lg border border-[#1D2B46] bg-[#0B1427] px-4 py-3 text-sm text-[#DCE7FF]">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Kích hoạt khuyến mãi
          </label>

          {touched && validation.length > 0 && (
            <div className="rounded-lg border border-[#7F1D1D] bg-[#2A0E13] px-4 py-3 text-sm text-[#FFB4B4] md:col-span-2">
              {validation[0]}
            </div>
          )}

          <button className="admin-save md:col-span-2" disabled={busy}>{busy ? "Đang lưu..." : editing ? "Cập nhật khuyến mãi" : "Tạo khuyến mãi"}</button>
        </form>
      </Modal>

      <Modal open={Boolean(deleting)} title="Xóa khuyến mãi" onClose={() => setDeleting(null)}>
        <div className="space-y-4">
          <p className="text-sm text-[#DCE7FF]">
            Bạn có chắc muốn xóa khuyến mãi <b>{deleting?.name}</b> khỏi danh sách hoạt động?
          </p>
          <div className="flex justify-end gap-3">
            <button className="rounded-lg bg-[#111C34] px-4 py-2 text-sm font-semibold text-[#DCE7FF]" onClick={() => setDeleting(null)}>Đóng</button>
            <button className="admin-delete" disabled={busy} onClick={removePromotion}>{busy ? "Đang xóa..." : "Đồng ý"}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
