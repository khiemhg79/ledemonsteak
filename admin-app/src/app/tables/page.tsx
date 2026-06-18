"use client"

import { useEffect, useState } from "react"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import Modal from "@/components/ui/Modal"

const statusLabel: Record<string, string> = { EMPTY: "Trống", OCCUPIED: "Đang dùng", REQUESTING_BILL: "Yêu cầu thanh toán" }
const statusClass: Record<string, string> = { EMPTY: "admin-active", OCCUPIED: "admin-inactive", REQUESTING_BILL: "rounded-full border border-[#5F1230] bg-[#2D0717] px-3 py-1 text-xs text-[#FF7A99]" }

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([])
  const [form, setForm] = useState({ number: "", capacity: "2", status: "EMPTY" })
  const [editing, setEditing] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  async function load() { try { setTables(await apiGet("/api/tables")) } catch (error: any) { setMessage(error.message) } }
  useEffect(() => { load() }, [])
  function create() { setEditing(null); setForm({ number: "", capacity: "2", status: "EMPTY" }); setMessage(""); setOpen(true) }
  function edit(t: any) { setEditing(t); setForm({ number: t.number, capacity: String(t.capacity), status: t.status }); setMessage(""); setOpen(true) }
  async function save(e: React.FormEvent) { e.preventDefault(); setBusy(true); try { const body = { ...form, capacity: Number(form.capacity) }; if (editing) await apiPatch(`/api/tables/${editing.id}`, body); else await apiPost("/api/tables", body); setOpen(false); await load(); setMessage(editing ? "Đã cập nhật bàn." : "Đã thêm bàn.") } catch (error: any) { setMessage(error.message) } finally { setBusy(false) } }
  async function remove(t: any) { if (!window.confirm(`Ngừng sử dụng bàn ${t.number}?`)) return; try { await apiDelete(`/api/tables/${t.id}`); await load(); setMessage("Đã ngừng sử dụng bàn.") } catch (error: any) { setMessage(error.message) } }
  return <div>
    <div className="mb-6 flex items-center justify-between"><h1 className="text-2xl font-black">Quản lý bàn</h1><button className="admin-primary" onClick={create}>+ Thêm bàn</button></div>
    {message && <p className="mb-5 rounded-lg border border-[#263756] bg-[#0B1427] px-4 py-3 text-sm text-[#B9D4FF]">{message}</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{tables.map((t) => <article key={t.id} className="rounded-xl border border-[#1D2B46] bg-[#050918] p-5"><div className="flex justify-between gap-3"><div><h2 className="font-bold">Bàn {t.number.replace(/^T/i, "")}</h2><p className="mt-1 text-sm text-[#75849D]">Sức chứa: {t.capacity} người</p></div><span className={`h-fit ${statusClass[t.status]}`}>{statusLabel[t.status]}</span></div><div className="mt-5"><button className="admin-edit" onClick={() => edit(t)}>Sửa</button><button className="admin-delete" onClick={() => remove(t)}>Ngừng</button></div></article>)}</div>
    <Modal open={open} title={editing ? "Sửa bàn" : "Thêm bàn"} onClose={() => setOpen(false)}><form className="grid gap-4" onSubmit={save}><label className="admin-field">Số bàn<input placeholder="Ví dụ: T11" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required /></label><label className="admin-field">Sức chứa<input type="number" min="1" max="30" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required /></label>{editing && <label className="admin-field">Trạng thái<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="EMPTY">Trống</option><option value="OCCUPIED">Đang dùng</option><option value="REQUESTING_BILL">Yêu cầu thanh toán</option></select></label>}<button className="admin-save" disabled={busy}>{busy ? "Đang lưu..." : "Lưu bàn"}</button></form></Modal>
  </div>
}
