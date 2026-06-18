"use client"

import { useEffect, useState } from "react"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import Modal from "@/components/ui/Modal"

const emptyForm = { name: "", phone: "", password: "", role: "CUSTOMER", isActive: true }
const roleLabel: Record<string, string> = { CUSTOMER: "Khách hàng", STAFF: "Nhân viên", ADMIN: "Quản trị" }

export default function UserTable() {
  const [users, setUsers] = useState<any[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  async function loadUsers() { try { setUsers(await apiGet("/api/admin/users")) } catch (error: any) { setMessage(error.message) } }
  useEffect(() => { loadUsers() }, [])
  function showCreate() { setEditing(null); setForm(emptyForm); setMessage(""); setOpen(true) }
  function showEdit(user: any) { setEditing(user); setForm({ name: user.name, phone: user.phone, password: "", role: user.role, isActive: user.isActive }); setMessage(""); setOpen(true) }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("")
    try {
      if (editing) await apiPatch(`/api/admin/users/${editing.id}`, form)
      else await apiPost("/api/admin/users", { ...form, password: form.password || "Admin@123" })
      setOpen(false); await loadUsers(); setMessage(editing ? "Đã cập nhật người dùng." : "Đã thêm người dùng.")
    } catch (error: any) { setMessage(error.message) } finally { setBusy(false) }
  }
  async function deactivate(user: any) {
    if (!window.confirm(`Ngừng hoạt động tài khoản ${user.name}?`)) return
    try { await apiDelete(`/api/admin/users/${user.id}`); await loadUsers(); setMessage("Đã ngừng hoạt động tài khoản.") } catch (error: any) { setMessage(error.message) }
  }

  return <div className="space-y-4">
    <div className="flex justify-end"><button className="admin-primary" onClick={showCreate}>+ Thêm người dùng</button></div>
    {message && <p className="rounded-lg border border-[#263756] bg-[#0B1427] px-4 py-3 text-sm text-[#B9D4FF]">{message}</p>}
    <div className="overflow-x-auto rounded-xl border border-[#1D2B46] bg-black"><table className="w-full min-w-[850px] text-sm"><thead className="bg-[#11182B] text-left text-[#DCE7FF]"><tr><th className="p-4">#</th><th>Tên đăng nhập</th><th>Số điện thoại</th><th>Vai trò</th><th>Trạng thái</th><th className="pr-5 text-right">Thao tác</th></tr></thead><tbody>{users.map((user, index) => <tr key={user.id} className="border-t border-[#132033] text-[#E9F2FF]"><td className="p-4">{index + 1}</td><td className="font-semibold">{user.name}</td><td>{user.phone}</td><td><span className="admin-role">{roleLabel[user.role] ?? user.role}</span></td><td><span className={user.isActive ? "admin-active" : "admin-inactive"}>{user.isActive ? "Hoạt động" : "Tạm dừng"}</span></td><td className="pr-5 text-right"><button className="admin-edit" onClick={() => showEdit(user)}>Sửa</button>{user.isActive && <button className="admin-delete" onClick={() => deactivate(user)}>Ngừng</button>}</td></tr>)}</tbody></table></div>
    <Modal open={open} title={editing ? "Sửa người dùng" : "Thêm người dùng"} onClose={() => setOpen(false)}><form className="grid gap-4" onSubmit={save}>
      <label className="admin-field">Họ tên<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
      <label className="admin-field">Số điện thoại<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></label>
      <label className="admin-field">Mật khẩu {editing && <small>(để trống nếu không đổi)</small>}<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} /></label>
      <label className="admin-field">Vai trò<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="CUSTOMER">Khách hàng</option><option value="STAFF">Nhân viên</option><option value="ADMIN">Quản trị</option></select></label>
      {editing && <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Tài khoản hoạt động</label>}
      <button className="admin-save" disabled={busy}>{busy ? "Đang lưu..." : "Lưu người dùng"}</button>
    </form></Modal>
  </div>
}
