"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import Modal from "@/components/ui/Modal"

type Tab = "dishes" | "combos" | "categories"
type Category = { id: string; name: string; desc?: string | null; sortOrder: number; isActive: boolean; count?: number }
type Dish = { id: string; name: string; price: number; description?: string | null; image?: string | null; categoryId: string; category?: Category; isActive: boolean }
type Combo = { id: string; name: string; price: number; description?: string | null; image?: string | null; isActive: boolean }

type DishForm = { name: string; price: string; description: string; image: string; categoryId: string; isActive: boolean }
type ComboForm = { name: string; price: string; description: string; image: string; isActive: boolean }
type CategoryForm = { name: string; desc: string; sortOrder: string; isActive: boolean }

const tabs: { id: Tab; label: string }[] = [
  { id: "dishes", label: "Món ăn" },
  { id: "combos", label: "Combo" },
  { id: "categories", label: "Danh mục" },
]

const initialDishForm: DishForm = { name: "", price: "", description: "", image: "", categoryId: "", isActive: true }

function money(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`
}

function cleanText(value: string, max = 50) {
  return value.replace(/\s+/g, " ").trimStart().slice(0, max)
}

function cleanNumber(value: string, maxLength = 9) {
  return value.replace(/\D/g, "").slice(0, maxLength)
}

function activeLabel(value: boolean) {
  return value ? "Hoạt động" : "Tạm dừng"
}

export default function DishTable() {
  const [tab, setTab] = useState<Tab>("dishes")
  const [data, setData] = useState<{ dishes: Dish[]; combos: Combo[]; categories: Category[] }>({ dishes: [], combos: [], categories: [] })
  const [editing, setEditing] = useState<Dish | Combo | Category | null>(null)
  const [deleting, setDeleting] = useState<Dish | Combo | Category | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [touched, setTouched] = useState(false)
  const [form, setForm] = useState<DishForm | ComboForm | CategoryForm>(initialDishForm)

  async function loadMenu() {
    try {
      setData(await apiGet("/api/menu"))
    } catch (error: any) {
      setMessage(error.message)
    }
  }

  useEffect(() => {
    loadMenu()
  }, [])

  const categoriesWithCount = useMemo(
    () => data.categories.map((cat) => ({ ...cat, count: data.dishes.filter((dish) => dish.categoryId === cat.id && dish.isActive).length })),
    [data],
  )

  const rows = tab === "dishes" ? data.dishes : tab === "combos" ? data.combos : categoriesWithCount

  const validation = useMemo(() => {
    if (tab === "dishes") {
      const dishForm = form as DishForm
      const price = Number(dishForm.price)
      return [
        !(dishForm.name ?? "").trim() ? "Vui lòng nhập tên món ăn." : "",
        !dishForm.price || !Number.isFinite(price) || price <= 0 ? "Giá món ăn không hợp lệ." : "",
        price > 999999999 ? "Giá món ăn tối đa 999.999.999đ." : "",
        !dishForm.categoryId ? "Vui lòng chọn danh mục." : "",
      ].filter(Boolean)
    }
    if (tab === "combos") {
      const comboForm = form as ComboForm
      const price = Number(comboForm.price)
      return [
        !(comboForm.name ?? "").trim() ? "Vui lòng nhập tên combo." : "",
        !comboForm.price || !Number.isFinite(price) || price <= 0 ? "Giá combo không hợp lệ." : "",
      ].filter(Boolean)
    }
    const categoryForm = form as CategoryForm
    return [!(categoryForm.name ?? "").trim() ? "Vui lòng nhập tên danh mục." : ""].filter(Boolean)
  }, [form, tab])

  function emptyForm() {
    if (tab === "dishes") {
      return { name: "", price: "", description: "", image: "", categoryId: data.categories.find((cat) => cat.isActive)?.id ?? "", isActive: true } satisfies DishForm
    }
    if (tab === "combos") return { name: "", price: "", description: "", image: "", isActive: true } satisfies ComboForm
    return { name: "", desc: "", sortOrder: String(data.categories.length + 1), isActive: true } satisfies CategoryForm
  }

  function showCreate() {
    setEditing(null)
    setForm(emptyForm())
    setTouched(false)
    setMessage("")
    setOpen(true)
  }

  function showEdit(row: Dish | Combo | Category) {
    setEditing(row)
    setTouched(false)
    setMessage("")
    if (tab === "dishes") {
      const dish = row as Dish
      setForm({ name: dish.name, price: String(dish.price), description: dish.description ?? "", image: dish.image ?? "", categoryId: dish.categoryId, isActive: dish.isActive })
    } else if (tab === "combos") {
      const combo = row as Combo
      setForm({ name: combo.name, price: String(combo.price), description: combo.description ?? "", image: combo.image ?? "", isActive: combo.isActive })
    } else {
      const category = row as Category
      setForm({ name: category.name, desc: category.desc ?? "", sortOrder: String(category.sortOrder ?? 0), isActive: category.isActive })
    }
    setOpen(true)
  }

  function pathFor(row?: Dish | Combo | Category) {
    if (tab === "dishes") return row ? `/api/menu/${row.id}` : "/api/menu"
    if (tab === "combos") return row ? `/api/menu/combos/${row.id}` : "/api/menu/combos"
    return row ? `/api/menu/categories/${row.id}` : "/api/menu/categories"
  }

  function payload() {
    if (tab === "dishes") {
      const dishForm = form as DishForm
      return {
        name: dishForm.name.trim(),
        price: Number(dishForm.price),
        description: dishForm.description.trim(),
        image: dishForm.image.trim(),
        categoryId: dishForm.categoryId,
        isActive: dishForm.isActive,
      }
    }
    if (tab === "combos") {
      const comboForm = form as ComboForm
      return {
        name: comboForm.name.trim(),
        price: Number(comboForm.price),
        description: comboForm.description.trim(),
        image: comboForm.image.trim(),
        isActive: comboForm.isActive,
      }
    }
    const categoryForm = form as CategoryForm
    return {
      name: categoryForm.name.trim(),
      desc: categoryForm.desc.trim(),
      sortOrder: Number(categoryForm.sortOrder || 0),
      isActive: categoryForm.isActive,
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    setMessage("")
    if (validation.length) return

    setBusy(true)
    try {
      if (editing) await apiPatch(pathFor(editing), payload())
      else await apiPost(pathFor(), payload())
      setOpen(false)
      await loadMenu()
      setMessage(editing ? "Đã cập nhật dữ liệu." : "Đã thêm dữ liệu.")
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeRow() {
    if (!deleting) return
    setBusy(true)
    setMessage("")
    try {
      await apiDelete(pathFor(deleting))
      setDeleting(null)
      await loadMenu()
      setMessage(tab === "dishes" ? "Đã xóa món ăn khỏi danh sách hoạt động." : "Đã xóa dữ liệu khỏi danh sách hoạt động.")
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function chooseImage(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setMessage("Ảnh món ăn chỉ hỗ trợ định dạng png, jpg, jpeg.")
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setMessage("Dung lượng ảnh tối đa là 3MB.")
      return
    }
    const image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    setForm((current: any) => ({ ...current, image }))
    setMessage("")
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#1D2B46] bg-[#050918] p-2">
        {tabs.map((item) => (
          <button key={item.id} className={`rounded-lg px-5 py-3 text-sm font-semibold ${tab === item.id ? "bg-[#1E2B44] text-white" : "text-[#D4D9E4]"}`} onClick={() => { setTab(item.id); setMessage("") }}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button className="admin-primary" onClick={showCreate}>+ Thêm {tab === "dishes" ? "món" : tab === "combos" ? "combo" : "danh mục"}</button>
      </div>

      {message && <p className="rounded-lg border border-[#263756] bg-[#0B1427] px-4 py-3 text-sm text-[#B9D4FF]">{message}</p>}

      <div className="overflow-x-auto rounded-xl border border-[#1D2B46] bg-black">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-[#11182B] text-left text-[#DCE7FF]">
            <tr>
              <th className="p-4">#</th>
              <th>{tab === "combos" ? "Tên combo" : tab === "categories" ? "Tên danh mục" : "Tên món"}</th>
              {tab !== "categories" && <th>Giá</th>}
              {tab === "dishes" && <th>Danh mục</th>}
              {tab === "categories" && <th>Số món</th>}
              <th>Trạng thái</th>
              <th className="pr-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-[#E9F2FF]">
            {rows.length === 0 ? (
              <tr><td className="p-6 text-center text-[#9AA8BF]" colSpan={6}>Không có dữ liệu phù hợp.</td></tr>
            ) : rows.map((row: any, index: number) => (
              <tr key={row.id} className="border-t border-[#132033]">
                <td className="p-4">{index + 1}</td>
                <td className="font-semibold">{row.name}</td>
                {tab !== "categories" && <td>{money(row.price)}</td>}
                {tab === "dishes" && <td>{row.category?.name ?? "Chưa có"}</td>}
                {tab === "categories" && <td>{row.count ?? 0}</td>}
                <td><span className={row.isActive ? "admin-active" : "admin-inactive"}>{activeLabel(Boolean(row.isActive))}</span></td>
                <td className="pr-5 text-right">
                  <button className="admin-edit" onClick={() => showEdit(row)}>Sửa</button>
                  {row.isActive && <button className="admin-delete" onClick={() => setDeleting(row)}>Xóa</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={`${editing ? "Sửa" : "Thêm"} ${tab === "dishes" ? "món ăn" : tab === "combos" ? "combo" : "danh mục"}`} onClose={() => setOpen(false)}>
        <form className="grid gap-4" onSubmit={save}>
          <label className="admin-field">
            {tab === "dishes" ? "Tên món ăn" : tab === "combos" ? "Tên combo" : "Tên danh mục"}
            <input
              value={(form as any).name ?? ""}
              onBlur={() => setForm((current: any) => ({ ...current, name: current.name.trim() }))}
              onChange={(e) => setForm((current: any) => ({ ...current, name: cleanText(e.target.value, 50) }))}
              maxLength={50}
              required
            />
          </label>

          {tab !== "categories" && (
            <label className="admin-field">
              Giá
              <input inputMode="numeric" value={(form as DishForm | ComboForm).price ?? ""} onChange={(e) => setForm((current: any) => ({ ...current, price: cleanNumber(e.target.value, 9) }))} maxLength={9} required />
            </label>
          )}

          {tab === "dishes" && (
            <label className="admin-field">
              Danh mục
              <select value={(form as DishForm).categoryId ?? ""} onChange={(e) => setForm((current: any) => ({ ...current, categoryId: e.target.value }))} required>
                <option value="">Chọn danh mục</option>
                {data.categories.filter((cat) => cat.isActive).map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </label>
          )}

          {tab !== "categories" && (
            <>
              <label className="admin-field">
                Mô tả
                <textarea rows={3} value={(form as DishForm | ComboForm).description ?? ""} onChange={(e) => setForm((current: any) => ({ ...current, description: e.target.value.slice(0, 500) }))} />
              </label>
              <label className="admin-field">
                Ảnh món
                <input value={(form as DishForm | ComboForm).image ?? ""} onChange={(e) => setForm((current: any) => ({ ...current, image: e.target.value }))} placeholder="Dán URL Cloudinary hoặc chọn ảnh bên dưới" />
              </label>
              <label className="admin-field">
                Chọn ảnh
                <input type="file" accept="image/png,image/jpeg" onChange={(e) => chooseImage(e.target.files)} />
              </label>
              {(form as DishForm | ComboForm).image && (
                <div className="h-28 w-28 overflow-hidden rounded-lg border border-[#1D2B46] bg-[#0B1427]">
                  <img src={(form as DishForm | ComboForm).image} alt="Ảnh món" className="h-full w-full object-cover" />
                </div>
              )}
            </>
          )}

          {tab === "categories" && (
            <>
              <label className="admin-field">
                Mô tả
                <textarea rows={3} value={(form as CategoryForm).desc ?? ""} onChange={(e) => setForm((current: any) => ({ ...current, desc: e.target.value.slice(0, 255) }))} />
              </label>
              <label className="admin-field">
                Thứ tự
                <input inputMode="numeric" value={(form as CategoryForm).sortOrder ?? "0"} onChange={(e) => setForm((current: any) => ({ ...current, sortOrder: cleanNumber(e.target.value, 3) }))} />
              </label>
            </>
          )}

          <label className="flex items-center gap-3 rounded-lg border border-[#1D2B46] bg-[#0B1427] px-4 py-3 text-sm text-[#DCE7FF]">
            <input type="checkbox" checked={Boolean((form as any).isActive)} onChange={(e) => setForm((current: any) => ({ ...current, isActive: e.target.checked }))} />
            {tab === "dishes" ? "Còn hàng" : "Hoạt động"}
          </label>

          {touched && validation.length > 0 && (
            <div className="rounded-lg border border-[#7F1D1D] bg-[#2A0E13] px-4 py-3 text-sm text-[#FFB4B4]">
              {validation[0]}
            </div>
          )}

          <button className="admin-save" disabled={busy}>{busy ? "Đang lưu..." : editing ? "Cập nhật" : tab === "dishes" ? "Tạo món" : "Lưu"}</button>
        </form>
      </Modal>

      <Modal open={Boolean(deleting)} title={`Xóa ${tab === "dishes" ? "món ăn" : tab === "combos" ? "combo" : "danh mục"}`} onClose={() => setDeleting(null)}>
        <div className="space-y-4">
          <p className="text-sm text-[#DCE7FF]">
            Bạn có chắc muốn xóa <b>{deleting?.name}</b> khỏi danh sách hoạt động?
          </p>
          <div className="flex justify-end gap-3">
            <button className="rounded-lg bg-[#111C34] px-4 py-2 text-sm font-semibold text-[#DCE7FF]" onClick={() => setDeleting(null)}>Đóng</button>
            <button className="admin-delete" disabled={busy} onClick={removeRow}>{busy ? "Đang xóa..." : "Đồng ý"}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
