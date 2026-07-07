"use client"

import Link from "next/link"
import CartDrawer from "@/components/cart/CartDrawer"

type CustomerBottomNavProps = {
    active: "menu" | "order" | "history" | "account"
}

function HomeIcon() {
    return (
        <svg aria-hidden="true" className="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path d="M4 11.5L12 5L20 11.5V20H15V14H9V20H4V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    )
}

function ReceiptIcon() {
    return (
        <svg aria-hidden="true" className="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path d="M7 3H17V21L15 19.7L13 21L11 19.7L9 21L7 19.7L5 21V5C5 3.9 5.9 3 7 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 8H15M9 12H15M9 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}

function HistoryIcon() {
    return (
        <svg aria-hidden="true" className="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path d="M5 12A7 7 0 1 0 7.05 7.05" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 6V10H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function UserIcon() {
    return (
        <svg aria-hidden="true" className="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="currentColor" strokeWidth="2" />
            <path d="M5 20C5 16.69 8.13 14 12 14C15.87 14 19 16.69 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}

function navClass(isActive: boolean) {
    return `flex min-w-0 flex-col items-center justify-center gap-1 text-center text-[11px] ${isActive ? "font-black text-[#F34208]" : "font-bold text-[#6F625C]"
        }`
}

export default function CustomerBottomNav({ active }: CustomerBottomNavProps) {
    return (
        <nav className="fixed bottom-0 left-1/2 z-20 grid h-[76px] w-full max-w-md -translate-x-1/2 grid-cols-5 items-center gap-1 border-t border-[#F0D7B0] bg-white px-3 pb-2 pt-2 shadow-2xl shadow-black/10">
            <Link className={navClass(active === "menu")} href="/">
                <HomeIcon />
                <span>Món ăn</span>
            </Link>

            <Link className={navClass(active === "order")} href="/order">
                <ReceiptIcon />
                <span>Đơn hiện tại</span>
            </Link>

            <Link className={navClass(active === "history")} href="/history">
                <HistoryIcon />
                <span>Lịch sử</span>
            </Link>

            <Link className={navClass(active === "account")} href="/account">
                <UserIcon />
                <span>Người dùng</span>
            </Link>

            <CartDrawer />
        </nav>
    )
}