import { Role } from "@prisma/client"

export function roleIdFor(role: Role | string) {
  return String(role).toUpperCase()
}
