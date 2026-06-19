export function normalizePhone(value: unknown) {
  let phone = String(value ?? "").replace(/\D/g, "")
  if (phone.startsWith("84")) phone = `0${phone.slice(2)}`
  return phone
}

export function isVietnamesePhone(phone: string) {
  return /^0[35789]\d{8}$/.test(phone)
}
