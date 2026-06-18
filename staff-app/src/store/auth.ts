import { create } from "zustand"
interface User { id: string; name: string; role: string }
interface AuthStore { user: User | null; token: string | null; login: (u: User, t: string) => void; logout: () => void }
export const useAuth = create<AuthStore>((set) => ({
  user: typeof window !== "undefined" && localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  login: (user, token) => { set({ user, token }); localStorage.setItem("token", token); localStorage.setItem("user", JSON.stringify(user)) },
  logout: () => { set({ user: null, token: null }); localStorage.removeItem("token"); localStorage.removeItem("user") },
}))
