"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import Modal from "@/components/ui/Modal"

type Role = "CUSTOMER" | "STAFF" | "ADMIN"
type User = {
  id: string
  name: string
  phone: string
  role: Role
  isActive: boolean
}

type UserForm = {
  name: string
  phone: string
  password: string
  role: Role
  isActive: boolean
}

const emptyForm: UserForm = { name: "", phone: "", password: "", role: "CUSTOMER", isActive: true }
const roleLabel: Record<Role, string> = { CUSTOMER: "Customer", STAFF: "Staff", ADMIN: "Admin" }

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trimStart().slice(0, 50)
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 10)
}

function passwordMessage(password: string, required: boolean) {
  if (!password && !required) return ""
  if (!password) return "Vui lòng nhập mật khẩu."
  if (password.length < 8 || password.length > 20) return "Mật khẩu phải có từ 8 đến 20 ký tự."
  if (!/[A-Z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ viết hoa."
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return "Mật khẩu phải bao gồm chữ, số và ký tự đặc biệt."
  }
  return ""
}

function phoneMessage(phone: string) {
  if (!phone) return "Vui lòng nhập số điện thoại."
  if (!/^0[35789]\d{8}$/.test(phone)) return "Số điện thoại không hợp lệ."
  return ""
}

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [touched, setTouched] = useState(false)

  const validation = useMemo(() => {
    const name = form.name.trim()
    const errors = [
      !name ? "Vui lòng nhập tên đăng nhập." : "",
      phoneMessage(form.phone),
      passwordMessage(form.password, !editing),
    ].filter(Boolean)
    return errors
  }, [editing, form.name, form.password, form.phone])

  async function loadUsers() {
    try {
      setUsers(await apiGet("/api/admin/users"))
    } catch (error: any) {
      setMessage(error.message)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  function showCreate() {
    setEditing(null)
    setForm(emptyForm)
    setTouched(false)
    setMessage("")
    setOpen(true)
  }

  function showEdit(user: User) {
    setEditing(user)
    setForm({ name: user.name, phone: user.phone, password: "", role: user.role, isActive: user.isActive })
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
        name: form.name.trim(),
        phone: form.phone,
        password: form.password,
        role: form.role,
        isActive: form.isActive,
      }
      if (editing) await apiPatch(`/api/admin/users/${editing.id}`, payload)
      else await apiPost("/api/admin/users", payload)
      setOpen(false)
      await loadUsers()
      setMessage(editing ? "Đã cập nhật người dùng." : "Đã tạo người dùng.")
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeUser() {
    if (!deleting) return
    setBusy(true)
    setMessage("")
    try {
      await apiDelete(`/api/admin/users/${deleting.id}`)
      setDeleting(null)
      await loadUsers()
      setMessage("Đã xóa tài khoản khỏi danh sách hoạt động.")
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="admin-primary" onClick={showCreate}>+ Thêm người dùng</button>
      </div>

      {message && <p className="rounded-lg border border-[#263756] bg-[#0B1427] px-4 py-3 text-sm text-[#B9D4FF]">{message}</p>}

      <div className="overflow-x-auto rounded-xl border border-[#1D2B46] bg-black">
        <table className="w-full min-w-[850px] text-sm">
          <thead className="bg-[#11182B] text-left text-[#DCE7FF]">
            <tr>
              <th className="p-4">#</th>
              <th>Tên đăng nhập</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th className="pr-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className="border-t border-[#132033] text-[#E9F2FF]">
                <td className="p-4">{index + 1}</td>
                <td className="font-semibold">{user.name}</td>
                <td>{user.phone}</td>
                <td><span className="admin-role">{roleLabel[user.role]}</span></td>
                <td><span className={user.isActive ? "admin-active" : "admin-inactive"}>{user.isActive ? "Hoạt động" : "Tạm dừng"}</span></td>
                <td className="pr-5 text-right">
                  <button className="admin-edit" onClick={() => showEdit(user)}>Sửa</button>
                  {user.isActive && <button className="admin-delete" onClick={() => setDeleting(user)}>Xóa</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={editing ? "Sửa người dùng" : "Thêm người dùng"} onClose={() => setOpen(false)}>
        <form className="grid gap-4" onSubmit={save}>
          <label className="admin-field">
            Tên đăng nhập
            <input
              value={form.name}
              onBlur={() => setForm((current) => ({ ...current, name: current.name.trim() }))}
              onChange={(e) => setForm({ ...form, name: normalizeName(e.target.value) })}
              maxLength={50}
              required
            />
          </label>

          <label className="admin-field">
            Số điện thoại
            <input
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: normalizePhone(e.target.value) })}
              maxLength={10}
              required
            />
          </label>

          <label className="admin-field">
            Mật khẩu {editing && <small>(để trống nếu không đổi)</small>}
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value.slice(0, 20) })}
              minLength={editing ? undefined : 8}
              maxLength={20}
              required={!editing}
            />
          </label>

          <label className="admin-field">
            Chọn vai trò
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </label>

          {editing && (
            <label className="flex items-center gap-3 text-sm text-[#DCE7FF]">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Tài khoản hoạt động
            </label>
          )}

          {touched && validation.length > 0 && (
            <div className="rounded-lg border border-[#7F1D1D] bg-[#2A0E13] px-4 py-3 text-sm text-[#FFB4B4]">
              {validation[0]}
            </div>
          )}

          <button className="admin-save" disabled={busy}>{busy ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo người dùng"}</button>
        </form>
      </Modal>

      <Modal open={Boolean(deleting)} title="Xóa người dùng" onClose={() => setDeleting(null)}>
        <div className="space-y-4">
          <p className="text-sm text-[#DCE7FF]">
            Bạn có chắc muốn xóa tài khoản <b>{deleting?.name}</b> khỏi danh sách hoạt động?
          </p>
          <div className="flex justify-end gap-3">
            <button className="rounded-lg bg-[#111C34] px-4 py-2 text-sm font-semibold text-[#DCE7FF]" onClick={() => setDeleting(null)}>Đóng</button>
            <button className="admin-delete" disabled={busy} onClick={removeUser}>{busy ? "Đang xóa..." : "Đồng ý"}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
