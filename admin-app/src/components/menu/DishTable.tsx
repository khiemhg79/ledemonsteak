"use client"

import { Fragment, FormEvent, useEffect, useMemo, useState } from "react"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import Modal from "@/components/ui/Modal"

type Tab = "dishes" | "combos" | "categories"
type Category = { id: string; name: string; desc?: string | null; sortOrder: number; isActive: boolean; count?: number }
type Dish = { id: string; name: string; price: number; description?: string | null; image?: string | null; categoryId: string; category?: Category; isActive: boolean }
type ComboItem = { id?: string; itemId: string; quantity: number; item?: Dish }
type Combo = { id: string; name: string; price: number; description?: string | null; image?: string | null; isActive: boolean; items?: ComboItem[] }

type DishForm = { name: string; price: string; description: string; image: string; categoryId: string; isActive: boolean }
type ComboForm = { name: string; price: string; description: string; image: string; isActive: boolean; items: ComboItem[] }
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

function textValue(value: unknown) {
  return typeof value === "string" ? value : ""
}

function activeLabel(value: boolean) {
  return value ? "Hoạt động" : "Tạm dừng"
}

export default function DishTable() {
  const [tab, setTab] = useState<Tab>("dishes")
  const [data, setData] = useState<{ dishes: Dish[]; combos: Combo[]; categories: Category[] }>({ dishes: [], combos: [], categories: [] })
  const [editing, setEditing] = useState<Dish | Combo | Category | null>(null)
  const [deleting, setDeleting] = useState<Dish | Combo | Category | null>(null)
  const [expandedCombos, setExpandedCombos] = useState<Record<string, boolean>>({})
  const [comboPick, setComboPick] = useState({ itemId: "", quantity: "1" })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [touched, setTouched] = useState(false)
  const [form, setForm] = useState<DishForm | ComboForm | CategoryForm>(initialDishForm)

  async function loadMenu(force = false) {
    try {
      setData(await apiGet("/api/menu", undefined, { force }))
    } catch (error: any) {
      setMessage(error.message)
    }
  }

  useEffect(() => {
    loadMenu()
  }, [])

  const activeDishes = useMemo(() => data.dishes.filter((dish) => dish.isActive), [data.dishes])
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
        !textValue(dishForm.name).trim() ? "Vui lòng nhập tên món ăn." : "",
        !dishForm.price || !Number.isFinite(price) || price <= 0 ? "Giá món ăn không hợp lệ." : "",
        price > 999999999 ? "Giá món ăn tối đa 999.999.999đ." : "",
        !dishForm.categoryId ? "Vui lòng chọn danh mục." : "",
      ].filter(Boolean)
    }
    if (tab === "combos") {
      const comboForm = form as ComboForm
      const price = Number(comboForm.price)
      return [
        !textValue(comboForm.name).trim() ? "Vui lòng nhập tên combo." : "",
        !comboForm.price || !Number.isFinite(price) || price <= 0 ? "Giá combo không hợp lệ." : "",
        price > 999999999 ? "Giá combo tối đa 999.999.999đ." : "",
      ].filter(Boolean)
    }
    const categoryForm = form as CategoryForm
    const sortOrder = Number(categoryForm.sortOrder || 0)
    return [
      !textValue(categoryForm.name).trim() ? "Vui lòng nhập tên danh mục." : "",
      !textValue(categoryForm.desc).trim() ? "Vui lòng nhập mô tả danh mục." : "",
      !Number.isFinite(sortOrder) || sortOrder < 0 ? "Thứ tự sắp xếp không hợp lệ." : "",
    ].filter(Boolean)
  }, [form, tab])

  function emptyForm(nextTab: Tab = tab) {
    if (nextTab === "dishes") {
      return { name: "", price: "", description: "", image: "", categoryId: data.categories.find((cat) => cat.isActive)?.id ?? "", isActive: true } satisfies DishForm
    }
    if (nextTab === "combos") return { name: "", price: "", description: "", image: "", isActive: true, items: [] } satisfies ComboForm
    return { name: "", desc: "", sortOrder: "0", isActive: true } satisfies CategoryForm
  }

  function changeTab(nextTab: Tab) {
    setTab(nextTab)
    setForm(emptyForm(nextTab))
    setEditing(null)
    setDeleting(null)
    setOpen(false)
    setTouched(false)
    setMessage("")
  }

  function showCreate() {
    setEditing(null)
    setForm(emptyForm())
    setComboPick({ itemId: activeDishes[0]?.id ?? "", quantity: "1" })
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
      setForm({
        name: combo.name,
        price: String(combo.price),
        description: combo.description ?? "",
        image: combo.image ?? "",
        isActive: combo.isActive,
        items: (combo.items ?? []).map((comboItem) => ({ itemId: comboItem.itemId, quantity: comboItem.quantity, item: comboItem.item })),
      })
      setComboPick({ itemId: activeDishes[0]?.id ?? "", quantity: "1" })
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
        name: textValue(dishForm.name).trim(),
        price: Number(dishForm.price),
        description: textValue(dishForm.description).trim(),
        image: textValue(dishForm.image).trim(),
        categoryId: dishForm.categoryId,
        isActive: dishForm.isActive,
      }
    }
    if (tab === "combos") {
      const comboForm = form as ComboForm
      return {
        name: textValue(comboForm.name).trim(),
        price: Number(comboForm.price),
        description: textValue(comboForm.description).trim(),
        image: textValue(comboForm.image).trim(),
        isActive: comboForm.isActive,
        items: comboForm.items.map((item) => ({ itemId: item.itemId, quantity: item.quantity })),
      }
    }
    const categoryForm = form as CategoryForm
    return {
      name: textValue(categoryForm.name).trim(),
      desc: textValue(categoryForm.desc).trim(),
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
      await loadMenu(true)
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
      await loadMenu(true)
      setMessage(tab === "combos" ? "Đã xóa combo khỏi danh sách hoạt động." : tab === "dishes" ? "Đã xóa món ăn khỏi danh sách hoạt động." : "Đã xóa danh mục khỏi danh sách hoạt động.")
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
      setMessage("Ảnh chỉ hỗ trợ định dạng png, jpg, jpeg.")
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

  function addComboItem() {
    if (tab !== "combos" || !comboPick.itemId) return
    const dish = activeDishes.find((item) => item.id === comboPick.itemId)
    const quantity = Math.max(1, Number(comboPick.quantity || 1))
    setForm((current: any) => {
      const items: ComboItem[] = current.items ?? []
      const existed = items.find((item) => item.itemId === comboPick.itemId)
      if (existed) {
        return { ...current, items: items.map((item) => item.itemId === comboPick.itemId ? { ...item, quantity: item.quantity + quantity, item: dish } : item) }
      }
      return { ...current, items: [...items, { itemId: comboPick.itemId, quantity, item: dish }] }
    })
  }

  function removeComboItem(itemId: string) {
    setForm((current: any) => ({ ...current, items: (current.items ?? []).filter((item: ComboItem) => item.itemId !== itemId) }))
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#1D2B46] bg-[#050918] p-2">
        {tabs.map((item) => (
          <button key={item.id} className={`rounded-lg px-5 py-3 text-sm font-semibold ${tab === item.id ? "bg-[#1E2B44] text-white" : "text-[#D4D9E4]"}`} onClick={() => changeTab(item.id)}>
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
              <Fragment key={row.id}>
                <tr key={row.id} className="border-t border-[#132033]">
                  <td className="p-4">{index + 1}</td>
                  <td className="font-semibold">{row.name}</td>
                  {tab !== "categories" && <td>{money(row.price)}</td>}
                  {tab === "dishes" && <td>{row.category?.name ?? "Chưa có"}</td>}
                  {tab === "categories" && <td>{row.count ?? 0}</td>}
                  <td><span className={row.isActive ? "admin-active" : "admin-inactive"}>{activeLabel(Boolean(row.isActive))}</span></td>
                  <td className="pr-5 text-right">
                    {tab === "combos" && <button className="admin-edit" onClick={() => setExpandedCombos((current) => ({ ...current, [row.id]: !current[row.id] }))}>⌄</button>}
                    <button className="admin-edit" onClick={() => showEdit(row)}>Sửa</button>
                    {row.isActive && <button className="admin-delete" onClick={() => setDeleting(row)}>Xóa</button>}
                  </td>
                </tr>
                {tab === "combos" && expandedCombos[row.id] && (
                  <tr key={`${row.id}-items`} className="border-t border-[#132033] bg-[#050918]">
                    <td />
                    <td colSpan={5} className="px-4 py-3 text-sm text-[#B9D4FF]">
                      {(row.items ?? []).length === 0 ? "Combo chưa có món nào." : (row.items ?? []).map((comboItem: ComboItem) => (
                        <span key={comboItem.itemId} className="mr-3 inline-flex rounded-full border border-[#263756] bg-[#0B1427] px-3 py-1">
                          {comboItem.quantity}x {comboItem.item?.name ?? comboItem.itemId}
                        </span>
                      ))}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={`${editing ? "Sửa" : "Thêm"} ${tab === "dishes" ? "món ăn" : tab === "combos" ? "combo" : "danh mục"}`} onClose={() => setOpen(false)}>
        <form className={`grid gap-4 ${tab === "combos" ? "md:grid-cols-2" : ""}`} onSubmit={save}>
          <section className="grid gap-4">
            <label className="admin-field">
              {tab === "dishes" ? "Tên món ăn" : tab === "combos" ? "Tên combo" : "Tên danh mục"}
              <input value={(form as any).name ?? ""} onBlur={() => setForm((current: any) => ({ ...current, name: textValue(current.name).trim() }))} onChange={(e) => setForm((current: any) => ({ ...current, name: cleanText(e.target.value, 50) }))} maxLength={50} required />
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
                  Hình ảnh
                  <input value={(form as DishForm | ComboForm).image ?? ""} onChange={(e) => setForm((current: any) => ({ ...current, image: e.target.value }))} placeholder="Dán URL Cloudinary hoặc chọn ảnh" />
                </label>
                <label className="admin-field">
                  Chọn ảnh
                  <input type="file" accept="image/png,image/jpeg" onChange={(e) => chooseImage(e.target.files)} />
                </label>
                {(form as DishForm | ComboForm).image && (
                  <div className="h-28 w-28 overflow-hidden rounded-lg border border-[#1D2B46] bg-[#0B1427]">
                    <img src={(form as DishForm | ComboForm).image} alt="Ảnh" className="h-full w-full object-cover" />
                  </div>
                )}
              </>
            )}

            {tab === "categories" && (
              <>
                <label className="admin-field">
                  Mô tả
                  <textarea rows={3} value={(form as CategoryForm).desc ?? ""} onChange={(e) => setForm((current: any) => ({ ...current, desc: e.target.value.slice(0, 255) }))} required />
                </label>
                <label className="admin-field">
                  Thứ tự
                  <input inputMode="numeric" value={(form as CategoryForm).sortOrder ?? "0"} onChange={(e) => setForm((current: any) => ({ ...current, sortOrder: cleanNumber(e.target.value, 3) }))} required />
                </label>
              </>
            )}

            <label className="flex items-center gap-3 rounded-lg border border-[#1D2B46] bg-[#0B1427] px-4 py-3 text-sm text-[#DCE7FF]">
              <input type="checkbox" checked={Boolean((form as any).isActive)} onChange={(e) => setForm((current: any) => ({ ...current, isActive: e.target.checked }))} />
              {tab === "dishes" ? "Còn hàng" : "Hoạt động"}
            </label>
          </section>

          {tab === "combos" && (
            <section className="grid content-start gap-4 rounded-xl border border-[#1D2B46] bg-[#050918] p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#DCE7FF]">Món trong combo</h3>
                <span className="text-xs text-[#9AA8BF]">{(form as ComboForm).items?.length ?? 0} món đã lưu</span>
              </div>
              <label className="admin-field">
                Chọn món
                <select value={comboPick.itemId} onChange={(e) => setComboPick({ ...comboPick, itemId: e.target.value })}>
                  <option value="">Chọn món</option>
                  {activeDishes.map((dish) => <option key={dish.id} value={dish.id}>{dish.name}</option>)}
                </select>
              </label>
              <label className="admin-field">
                Số lượng
                <input inputMode="numeric" value={comboPick.quantity} onChange={(e) => setComboPick({ ...comboPick, quantity: cleanNumber(e.target.value, 3) || "1" })} />
              </label>
              <button type="button" className="admin-save" onClick={addComboItem}>Thêm vào danh sách</button>
              <div className="space-y-2 border-t border-[#1D2B46] pt-3">
                {((form as ComboForm).items ?? []).length === 0 ? (
                  <p className="text-sm text-[#9AA8BF]">Chưa có món nào</p>
                ) : (form as ComboForm).items.map((comboItem) => (
                  <div key={comboItem.itemId} className="flex items-center justify-between gap-3 rounded-lg bg-[#0B1427] px-3 py-2 text-sm text-[#DCE7FF]">
                    <span>{comboItem.quantity}x {comboItem.item?.name ?? activeDishes.find((dish) => dish.id === comboItem.itemId)?.name ?? comboItem.itemId}</span>
                    <button type="button" className="admin-delete" onClick={() => removeComboItem(comboItem.itemId)}>Xóa</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {touched && validation.length > 0 && (
            <div className={`rounded-lg border border-[#7F1D1D] bg-[#2A0E13] px-4 py-3 text-sm text-[#FFB4B4] ${tab === "combos" ? "md:col-span-2" : ""}`}>
              {validation[0]}
            </div>
          )}

          <button className={`admin-save ${tab === "combos" ? "md:col-span-2" : ""}`} disabled={busy}>
            {busy ? "Đang lưu..." : editing ? "Cập nhật" : tab === "dishes" ? "Tạo món" : tab === "combos" ? "Tạo combo" : "Tạo danh mục"}
          </button>
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
