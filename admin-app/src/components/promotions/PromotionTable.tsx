"use client"

import { useEffect, useState } from "react"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import Modal from "@/components/ui/Modal"

const baseForm = { name: "", code: "", discountType: "PERCENTAGE", discountValue: "10", minOrder: "0", maxDiscount: "", usageLimit: "", startDate: new Date().toISOString().slice(0, 10), endDate: "2026-12-31", description: "", isActive: true }
const money = (value: number) => value.toLocaleString("vi-VN") + "đ"

export default function PromotionTable() {
  const [promos, setPromos] = useState<any[]>([])
  const [form, setForm] = useState(baseForm)
  const [editing, setEditing] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  async function load() { try { setPromos(await apiGet("/api/promotions")) } catch (error: any) { setMessage(error.message) } }
  useEffect(() => { load() }, [])
  function showCreate() { setEditing(null); setForm(baseForm); setMessage(""); setOpen(true) }
  function showEdit(p: any) { setEditing(p); setForm({ name: p.name, code: p.code, discountType: p.discountType, discountValue: String(p.discountValue), minOrder: String(p.minOrder), maxDiscount: p.maxDiscount == null ? "" : String(p.maxDiscount), usageLimit: p.usageLimit == null ? "" : String(p.usageLimit), startDate: p.startDate.slice(0, 10), endDate: p.endDate.slice(0, 10), description: p.description ?? "", isActive: p.isActive }); setMessage(""); setOpen(true) }
  function payload() { return { ...form, code: form.code.toUpperCase(), discountValue: Number(form.discountValue), minOrder: Number(form.minOrder || 0), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null, usageLimit: form.usageLimit ? Number(form.usageLimit) : null, startDate: new Date(form.startDate), endDate: new Date(form.endDate) } }
  async function save(e: React.FormEvent) { e.preventDefault(); setBusy(true); try { if (editing) await apiPatch(`/api/promotions/${editing.id}`, payload()); else await apiPost("/api/promotions", payload()); setOpen(false); await load(); setMessage(editing ? "Đã cập nhật khuyến mãi." : "Đã thêm khuyến mãi.") } catch (error: any) { setMessage(error.message) } finally { setBusy(false) } }
  async function remove(p: any) { if (!window.confirm(`Ngừng khuyến mãi “${p.name}”?`)) return; try { await apiDelete(`/api/promotions/${p.id}`); await load(); setMessage("Đã ngừng khuyến mãi.") } catch (error: any) { setMessage(error.message) } }
  return <div className="space-y-4">
    <div className="flex justify-end"><button className="admin-primary" onClick={showCreate}>+ Thêm khuyến mãi</button></div>
    {message && <p className="rounded-lg border border-[#263756] bg-[#0B1427] px-4 py-3 text-sm text-[#B9D4FF]">{message}</p>}
    <div className="overflow-x-auto rounded-xl border border-[#1D2B46] bg-black"><table className="w-full min-w-[1000px] text-sm"><thead className="bg-[#11182B] text-left text-[#DCE7FF]"><tr><th className="p-4">#</th><th>Tên</th><th>Mã</th><th>Loại</th><th>Giá trị</th><th>Thời gian</th><th>Sử dụng</th><th>Trạng thái</th><th className="pr-5 text-right">Thao tác</th></tr></thead><tbody>{promos.map((p, index) => <tr key={p.id} className="border-t border-[#132033] text-[#E9F2FF]"><td className="p-4">{index + 1}</td><td className="font-bold">{p.name}</td><td>{p.code}</td><td>{p.discountType === "PERCENTAGE" ? "Phần trăm" : "Số tiền"}</td><td className="text-[#00E09D]">{p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : money(p.discountValue)}</td><td>{new Date(p.startDate).toLocaleDateString("vi-VN")}<br />{new Date(p.endDate).toLocaleDateString("vi-VN")}</td><td>{p.usageCount}/{p.usageLimit ?? "∞"}</td><td><span className={p.isActive ? "admin-active" : "admin-inactive"}>{p.isActive ? "Hoạt động" : "Tạm dừng"}</span></td><td className="pr-5 text-right"><button className="admin-edit" onClick={() => showEdit(p)}>Sửa</button>{p.isActive && <button className="admin-delete" onClick={() => remove(p)}>Ngừng</button>}</td></tr>)}</tbody></table></div>
    <Modal open={open} title={editing ? "Sửa khuyến mãi" : "Thêm khuyến mãi"} onClose={() => setOpen(false)}><form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
      <label className="admin-field">Tên<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label><label className="admin-field">Mã<input className="uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></label>
      <label className="admin-field">Loại<select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}><option value="PERCENTAGE">Phần trăm</option><option value="FIXED">Số tiền</option></select></label><label className="admin-field">Giá trị<input type="number" min="0" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required /></label>
      <label className="admin-field">Đơn tối thiểu<input type="number" min="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} /></label><label className="admin-field">Giảm tối đa<input type="number" min="0" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} /></label>
      <label className="admin-field">Ngày bắt đầu<input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></label><label className="admin-field">Ngày kết thúc<input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></label>
      <label className="admin-field">Giới hạn sử dụng<input type="number" min="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></label><label className="admin-field">Mô tả<textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <button className="admin-save md:col-span-2" disabled={busy}>{busy ? "Đang lưu..." : "Lưu khuyến mãi"}</button>
    </form></Modal>
  </div>
}
