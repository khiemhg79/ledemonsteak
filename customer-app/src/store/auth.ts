import { create } from "zustand"

interface User { id: string; name: string; role: string }

interface AuthStore {
  user: User | null
  token: string | null
  hydrate: () => void
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  token: null,
  hydrate: () => {
    if (typeof window === "undefined") return
    const rawUser = localStorage.getItem("user")
    set({
      user: rawUser ? JSON.parse(rawUser) : null,
      token: localStorage.getItem("token"),
    })
  },
  login: (user, token) => {
    set({ user, token })
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
  },
  logout: () => {
    set({ user: null, token: null })
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  },
}))
