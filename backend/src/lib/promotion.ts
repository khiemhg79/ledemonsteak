import { prisma } from "@/lib/prisma"

export class PromotionError extends Error {}

export async function calculatePromotion(code: string, orderAmount: number) {
  const normalizedCode = String(code ?? "").trim().toUpperCase()
  const promo = await prisma.promotion.findUnique({ where: { code: normalizedCode } })
  const now = new Date()
  if (!promo || !promo.isActive) throw new PromotionError("Mã giảm giá không hợp lệ.")
  if (promo.startDate > now) throw new PromotionError("Mã giảm giá chưa đến thời gian áp dụng.")
  if (promo.endDate < now) throw new PromotionError("Mã giảm giá đã hết hạn.")
  if (promo.usageLimit != null && promo.usageCount >= promo.usageLimit) throw new PromotionError("Mã giảm giá đã hết lượt sử dụng.")
  if (orderAmount < promo.minOrder) throw new PromotionError(`Đơn tối thiểu ${promo.minOrder.toLocaleString("vi-VN")}đ.`)

  let discount = promo.discountType === "PERCENTAGE"
    ? orderAmount * promo.discountValue / 100
    : promo.discountValue
  if (promo.maxDiscount != null) discount = Math.min(discount, promo.maxDiscount)
  discount = Math.min(discount, orderAmount)
  return { promo, discount, finalAmount: orderAmount - discount }
}
