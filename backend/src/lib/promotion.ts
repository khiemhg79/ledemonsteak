import { prisma } from "@/lib/prisma"

export class PromotionError extends Error {}

export async function calculatePromotion(code: string, orderAmount: number) {
  const rawCode = String(code ?? "").trim()
  const promo = await prisma.promotion.findFirst({
    where: {
      OR: [
        { id: rawCode },
        { id: rawCode.toLowerCase() },
        { id: rawCode.toUpperCase() },
      ],
    },
  })
  const now = new Date()
  if (!promo || !promo.isActive) throw new PromotionError("Ma giam gia khong hop le.")
  if (promo.startDate > now) throw new PromotionError("Ma giam gia chua den thoi gian ap dung.")
  if (promo.endDate < now) throw new PromotionError("Ma giam gia da het han.")
  if (promo.usageLimit != null && promo.usageCount >= promo.usageLimit) throw new PromotionError("Ma giam gia da het luot su dung.")
  if (orderAmount < promo.minOrder) throw new PromotionError(`Don toi thieu ${promo.minOrder.toLocaleString("vi-VN")}d.`)

  let discount = promo.discountType === "PERCENTAGE"
    ? orderAmount * promo.discountValue / 100
    : promo.discountValue
  if (promo.maxDiscount != null) discount = Math.min(discount, promo.maxDiscount)
  discount = Math.min(discount, orderAmount)
  return { promo: { ...promo, code: promo.id }, discount, finalAmount: orderAmount - discount }
}
