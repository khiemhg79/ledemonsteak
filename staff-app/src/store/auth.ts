import { create } from "zustand"
interface User { id: string; name: string; role: string }
interface AuthStore { user: User | null; token: string | null; hydrated: boolean; hydrate: () => void; login: (u: User, t: string) => void; logout: () => void }
export const useAuth = create<AuthStore>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  hydrate: () => {
    const rawUser = typeof window !== "undefined" ? localStorage.getItem("user") : null
    set({ user: rawUser ? JSON.parse(rawUser) : null, token: typeof window !== "undefined" ? localStorage.getItem("token") : null, hydrated: true })
  },
  login: (user, token) => { set({ user, token }); localStorage.setItem("token", token); localStorage.setItem("user", JSON.stringify(user)) },
  logout: () => { set({ user: null, token: null }); localStorage.removeItem("token"); localStorage.removeItem("user") },
}))
