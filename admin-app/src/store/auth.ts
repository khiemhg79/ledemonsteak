import { create } from "zustand"
interface User { id: string; name: string; role: string }
interface AuthStore {
  user: User | null
  token: string | null
  hydrated: boolean
  hydrate: () => void
  login: (u: User, t: string) => void
  logout: () => void
}

function clearStoredAuth() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  hydrate: () => {
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (!token || !storedUser) {
      clearStoredAuth()
      set({ user: null, token: null, hydrated: true })
      return
    }

    try {
      const user = JSON.parse(storedUser) as User
      if (!user.id || !user.name || user.role !== "ADMIN") throw new Error("Invalid admin session")
      set({ user, token, hydrated: true })
    } catch {
      clearStoredAuth()
      set({ user: null, token: null, hydrated: true })
    }
  },
  login: (user, token) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    set({ user, token, hydrated: true })
  },
  logout: () => {
    clearStoredAuth()
    set({ user: null, token: null, hydrated: true })
  },
}))
