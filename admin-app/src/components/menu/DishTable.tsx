"use client"

import { useEffect, useMemo, useState } from "react"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import Modal from "@/components/ui/Modal"

type Tab = "dishes" | "combos" | "categories"
const money = (value: number) => value.toLocaleString("vi-VN") + "đ"

export default function DishTable() {
  const [tab, setTab] = useState<Tab>("dishes")
  const [data, setData] = useState<any>({ dishes: [], combos: [], categories: [] })
  const [editing, setEditing] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [form, setForm] = useState<any>({})

  async function loadMenu() { try { setData(await apiGet("/api/menu")) } catch (error: any) { setMessage(error.message) } }
  useEffect(() => { loadMenu() }, [])
  const counts = useMemo(() => data.categories.map((cat: any) => ({ ...cat, count: data.dishes.filter((dish: any) => dish.categoryId === cat.id).length })), [data])

  function emptyForm() {
    if (tab === "dishes") return { name: "", price: "", description: "", image: "", categoryId: data.categories[0]?.id ?? "", isActive: true }
    if (tab === "combos") return { name: "", price: "", description: "", image: "", isActive: true }
    return { name: "", desc: "", sortOrder: data.categories.length + 1, isActive: true }
  }
  function showCreate() { setEditing(null); setForm(emptyForm()); setMessage(""); setOpen(true) }
  function showEdit(row: any) { setEditing(row); setForm({ ...row, price: row.price?.toString() }); setMessage(""); setOpen(true) }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("")
    const path = tab === "dishes" ? "/api/menu" : tab === "combos" ? "/api/menu/combos" : "/api/menu/categories"
    const payload = { ...form, ...(tab !== "categories" ? { price: Number(form.price) } : { sortOrder: Number(form.sortOrder) }) }
    delete payload.id; delete payload.category; delete payload.items; delete payload.comboItems; delete payload.count
    try {
      if (editing) await apiPatch(`${path}/${editing.id}`, payload); else await apiPost(path, payload)
      setOpen(false); await loadMenu(); setMessage(editing ? "Đã cập nhật dữ liệu." : "Đã thêm dữ liệu.")
    } catch (error: any) { setMessage(error.message) } finally { setBusy(false) }
  }
  async function remove(row: any) {
    const path = tab === "dishes" ? `/api/menu/${row.id}` : tab === "combos" ? `/api/menu/combos/${row.id}` : `/api/menu/categories/${row.id}`
    if (!window.confirm(`Ngừng sử dụng “${row.name}”?`)) return
    try { await apiDelete(path); await loadMenu(); setMessage("Đã ngừng sử dụng.") } catch (error: any) { setMessage(error.message) }
  }

  const rows = tab === "dishes" ? data.dishes : tab === "combos" ? data.combos : counts
  return <div className="space-y-5">
    <div className="rounded-xl border border-[#1D2B46] bg-[#050918] p-2">{([{ id: "dishes", label: "Món ăn" }, { id: "combos", label: "Combo" }, { id: "categories", label: "Danh mục" }] as { id: Tab; label: string }[]).map((item) => <button key={item.id} className={`rounded-lg px-5 py-3 text-sm font-semibold ${tab === item.id ? "bg-[#1E2B44] text-white" : "text-[#D4D9E4]"}`} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
    <div className="flex justify-end"><button className="admin-primary" onClick={showCreate}>+ Thêm {tab === "dishes" ? "món" : tab === "combos" ? "combo" : "danh mục"}</button></div>
    {message && <p className="rounded-lg border border-[#263756] bg-[#0B1427] px-4 py-3 text-sm text-[#B9D4FF]">{message}</p>}
    <div className="overflow-x-auto rounded-xl border border-[#1D2B46] bg-black"><table className="w-full min-w-[760px] text-sm"><thead className="bg-[#11182B] text-left text-[#DCE7FF]"><tr><th className="p-4">#</th><th>Tên</th>{tab !== "categories" && <th>Giá</th>}{tab === "dishes" && <th>Danh mục</th>}{tab === "categories" && <th>Số món</th>}<th>Trạng thái</th><th className="pr-5 text-right">Thao tác</th></tr></thead><tbody className="text-[#E9F2FF]">{rows.map((row: any, index: number) => <tr key={row.id} className="border-t border-[#132033]"><td className="p-4">{index + 1}</td><td className="font-semibold">{row.name}</td>{tab !== "categories" && <td>{money(row.price)}</td>}{tab === "dishes" && <td>{row.category?.name}</td>}{tab === "categories" && <td>{row.count}</td>}<td><span className="admin-active">Hoạt động</span></td><td className="pr-5 text-right"><button className="admin-edit" onClick={() => showEdit(row)}>Sửa</button><button className="admin-delete" onClick={() => remove(row)}>Ngừng</button></td></tr>)}</tbody></table></div>
    <Modal open={open} title={`${editing ? "Sửa" : "Thêm"} ${tab === "dishes" ? "món ăn" : tab === "combos" ? "combo" : "danh mục"}`} onClose={() => setOpen(false)}><form className="grid gap-4" onSubmit={save}>
      <label className="admin-field">Tên<input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
      {tab !== "categories" && <label className="admin-field">Giá<input type="number" min="0" value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></label>}
      {tab === "dishes" && <label className="admin-field">Danh mục<select value={form.categoryId ?? ""} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>{data.categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label>}
      {tab !== "categories" && <label className="admin-field">Ảnh Cloudinary (URL)<input value={form.image ?? ""} onChange={(e) => setForm({ ...form, image: e.target.value })} /></label>}
      <label className="admin-field">Mô tả<textarea rows={3} value={(tab === "categories" ? form.desc : form.description) ?? ""} onChange={(e) => setForm({ ...form, [tab === "categories" ? "desc" : "description"]: e.target.value })} /></label>
      {tab === "categories" && <label className="admin-field">Thứ tự<input type="number" value={form.sortOrder ?? 0} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></label>}
      <button className="admin-save" disabled={busy}>{busy ? "Đang lưu..." : "Lưu"}</button>
    </form></Modal>
  </div>
}
