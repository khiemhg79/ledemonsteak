"use client"

type ModalProps = { open: boolean; title: string; children: React.ReactNode; onClose: () => void }

export default function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-[#263756] bg-[#080D1C] p-5 text-white shadow-2xl">
      <header className="mb-5 flex items-center justify-between gap-4"><h2 className="text-lg font-bold">{title}</h2><button type="button" aria-label="Đóng" title="Đóng" className="h-9 w-9 rounded-lg bg-[#111C34] text-xl text-[#AFC0DA]" onClick={onClose}>×</button></header>
      {children}
    </section>
  </div>
}
