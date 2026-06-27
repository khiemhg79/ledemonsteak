"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Modal from "@/components/ui/Modal"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"

type TableStatus = "EMPTY" | "OCCUPIED" | "REQUESTING_BILL"
type DiningTable = {
  id: string
  number: string
  capacity: number
  status: TableStatus
  isActive: boolean
}

const statusLabel: Record<TableStatus, string> = {
  EMPTY: "Trống",
  OCCUPIED: "Đang dùng",
  REQUESTING_BILL: "Yêu cầu thanh toán",
}

const statusStyle: Record<TableStatus, string> = {
  EMPTY: "border-[#005B42] bg-[#002E24] text-[#00E09D]",
  OCCUPIED: "border-[#65431E] bg-[#2B1C00] text-[#FBC02D]",
  REQUESTING_BILL: "border-[#5F1230] bg-[#2D0717] text-[#FF7A99]",
}

const cardStyle: Record<TableStatus, string> = {
  EMPTY: "border-[#14345A] bg-[#050918]",
  OCCUPIED: "border-[#68450F] bg-[#0B0910]",
  REQUESTING_BILL: "border-[#6B1738] bg-[#100711]",
}

const emptyForm = { number: "", capacity: "2", status: "EMPTY" as TableStatus, isActive: true }

function cleanTableNumber(value: string) {
  return value.replace(/\s+/g, "").toUpperCase().slice(0, 10)
}

function cleanNumber(value: string, maxLength = 10) {
  return value.replace(/\D/g, "").slice(0, maxLength)
}

function displayNumber(value: string) {
  return value.replace(/^T/i, "")
}

export default function TablesPage() {
  const [tables, setTables] = useState<DiningTable[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<DiningTable | null>(null)
  const [deleting, setDeleting] = useState<DiningTable | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState(false)
  const [message, setMessage] = useState("")

  async function load(force = false) {
    try {
      setTables(await apiGet("/api/tables", undefined, { force }))
    } catch (error: any) {
      setMessage(error.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const validation = useMemo(() => {
    const capacity = Number(form.capacity)
    return [
      !form.number.trim() ? "Vui lòng nhập số bàn." : "",
      !/^[A-Z0-9_-]{1,10}$/.test(form.number) ? "Số bàn chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới." : "",
      !Number.isInteger(capacity) || capacity <= 0 ? "Sức chứa phải là số nguyên lớn hơn 0." : "",
    ].filter(Boolean)
  }, [form])

  function showCreate() {
    setEditing(null)
    setForm(emptyForm)
    setTouched(false)
    setMessage("")
    setOpen(true)
  }

  function showEdit(table: DiningTable) {
    setEditing(table)
    setForm({
      number: table.number,
      capacity: String(table.capacity),
      status: table.status,
      isActive: table.isActive,
    })
    setTouched(false)
    setMessage("")
    setOpen(true)
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    setMessage("")
    if (validation.length) return

    setBusy(true)
    try {
      const payload = {
        number: form.number.trim(),
        capacity: Number(form.capacity),
        status: form.status,
        isActive: form.isActive,
      }
      if (editing) await apiPatch(`/api/tables/${editing.id}`, payload)
      else await apiPost("/api/tables", payload)
      setOpen(false)
      await load(true)
      setMessage(editing ? "Đã cập nhật bàn." : "Đã thêm bàn.")
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeTable() {
    if (!deleting) return
    setBusy(true)
    setMessage("")
    try {
      await apiDelete(`/api/tables/${deleting.id}`)
      setDeleting(null)
      await load(true)
      setMessage("Đã xóa bàn khỏi danh sách hoạt động.")
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black">Quản lý bàn</h1>
        <button className="admin-primary" onClick={showCreate}>+ Thêm bàn</button>
      </div>

      {message && <p className="mb-5 rounded-lg border border-[#263756] bg-[#0B1427] px-4 py-3 text-sm text-[#B9D4FF]">{message}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tables.length === 0 ? (
          <div className="rounded-xl border border-[#1D2B46] bg-[#050918] p-6 text-sm text-[#9AA8BF]">Chưa có bàn nào trong hệ thống.</div>
        ) : tables.map((table) => (
          <article key={table.id} className={`rounded-xl border p-5 shadow-sm ${cardStyle[table.status]}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Bàn {displayNumber(table.number)}</h2>
                <p className="mt-1 text-sm text-[#75849D]">Sức chứa: {table.capacity} người</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[table.status]}`}>{statusLabel[table.status]}</span>
            </div>
            <div className="mt-5 flex gap-2">
              <button className="admin-edit" onClick={() => showEdit(table)}>Sửa</button>
              <button className="admin-delete" onClick={() => setDeleting(table)}>Xóa</button>
            </div>
          </article>
        ))}
      </div>

      <Modal open={open} title={editing ? "Sửa bàn" : "Thêm bàn"} onClose={() => setOpen(false)}>
        <form className="grid gap-4" onSubmit={save}>
          <label className="admin-field">
            Số bàn
            <input placeholder="VD: 01, A1, B2" value={form.number} onChange={(e) => setForm({ ...form, number: cleanTableNumber(e.target.value) })} maxLength={10} required />
          </label>
          <label className="admin-field">
            Sức chứa
            <input inputMode="numeric" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: cleanNumber(e.target.value, 10) })} maxLength={10} required />
          </label>
          <label className="admin-field">
            Trạng thái
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TableStatus })}>
              <option value="EMPTY">Trống</option>
              <option value="OCCUPIED">Đang dùng</option>
              <option value="REQUESTING_BILL">Yêu cầu thanh toán</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-[#1D2B46] bg-[#0B1427] px-4 py-3 text-sm text-[#DCE7FF]">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Kích hoạt bàn
          </label>

          {touched && validation.length > 0 && (
            <div className="rounded-lg border border-[#7F1D1D] bg-[#2A0E13] px-4 py-3 text-sm text-[#FFB4B4]">{validation[0]}</div>
          )}

          <button className="admin-save" disabled={busy}>{busy ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo bàn"}</button>
        </form>
      </Modal>

      <Modal open={Boolean(deleting)} title="Xóa bàn" onClose={() => setDeleting(null)}>
        <div className="space-y-4">
          <p className="text-sm text-[#DCE7FF]">
            Bạn có chắc muốn xóa <b>Bàn {deleting ? displayNumber(deleting.number) : ""}</b> khỏi danh sách hoạt động?
          </p>
          <p className="rounded-lg border border-[#263756] bg-[#0B1427] px-4 py-3 text-xs text-[#9AA8BF]">
            Hệ thống sẽ không cho xóa nếu bàn đang dùng hoặc còn hóa đơn chưa thanh toán.
          </p>
          <div className="flex justify-end gap-3">
            <button className="rounded-lg bg-[#111C34] px-4 py-2 text-sm font-semibold text-[#DCE7FF]" onClick={() => setDeleting(null)}>Đóng</button>
            <button className="admin-delete" disabled={busy} onClick={removeTable}>{busy ? "Đang xóa..." : "Đồng ý"}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
