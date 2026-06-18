import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
const prisma = new PrismaClient()

async function main() {
  console.log("Seeding Le Monde Steak...")

  const catSteaks  = await prisma.category.create({ data: { name: "Bít tết",     sortOrder: 1 } })
  const catPasta   = await prisma.category.create({ data: { name: "Pasta",        sortOrder: 2 } })
  const catSides   = await prisma.category.create({ data: { name: "Món phụ",     sortOrder: 3 } })
  const catDrinks  = await prisma.category.create({ data: { name: "Đồ uống",     sortOrder: 4 } })
  const catDessert = await prisma.category.create({ data: { name: "Tráng miệng", sortOrder: 5 } })

  const ribeye    = await prisma.item.create({ data: { name: "Ribeye 300g",     price: 450000, categoryId: catSteaks.id,  description: "Bít tết Mỹ thượng hạng" } })
  const tbone     = await prisma.item.create({ data: { name: "T-Bone 400g",     price: 520000, categoryId: catSteaks.id,  description: "Hai loại thịt trong một miếng" } })
  const sirloin   = await prisma.item.create({ data: { name: "Sirloin 250g",    price: 380000, categoryId: catSteaks.id,  description: "Thăn lưng mềm mịn" } })
  const carbonara = await prisma.item.create({ data: { name: "Pasta Carbonara", price: 159000, categoryId: catPasta.id,   description: "Trứng, phô mai, bacon" } })
  const bolognese = await prisma.item.create({ data: { name: "Pasta Bolognese", price: 149000, categoryId: catPasta.id,   description: "Sốt thịt bò băm Ý" } })
  const fries     = await prisma.item.create({ data: { name: "Khoai tây chiên", price:  59000, categoryId: catSides.id,   description: "Giòn vàng, muối biển" } })
  const salad     = await prisma.item.create({ data: { name: "Salad Caesar",    price:  89000, categoryId: catSides.id,   description: "Lettuce, crouton, parmesan" } })
  const lemonade  = await prisma.item.create({ data: { name: "Lemonade",        price:  49000, categoryId: catDrinks.id,  description: "Chanh tươi, mint, soda" } })
  const tiramisu  = await prisma.item.create({ data: { name: "Tiramisu",        price:  89000, categoryId: catDessert.id, description: "Mascarpone, espresso, cocoa" } })

  await prisma.combo.create({ data: { name: "Set Dinner Đôi",    price:  890000, description: "Lãng mạn cho 2 người",    items: { create: [{ itemId: ribeye.id, quantity: 1 },{ itemId: sirloin.id, quantity: 1 },{ itemId: salad.id, quantity: 2 },{ itemId: lemonade.id, quantity: 2 },{ itemId: tiramisu.id, quantity: 1 }] } } })
  await prisma.combo.create({ data: { name: "Set Family 4 người",price: 1590000, description: "Đầy đủ cho cả gia đình", items: { create: [{ itemId: ribeye.id, quantity: 2 },{ itemId: tbone.id, quantity: 1 },{ itemId: carbonara.id, quantity: 1 },{ itemId: fries.id, quantity: 2 },{ itemId: tiramisu.id, quantity: 2 }] } } })
  await prisma.combo.create({ data: { name: "Set Lunch 1 người", price:  299000, description: "Nhanh gọn bữa trưa",     items: { create: [{ itemId: sirloin.id, quantity: 1 },{ itemId: fries.id, quantity: 1 },{ itemId: lemonade.id, quantity: 1 }] } } })

  for (const [num, cap] of [["T01",2],["T02",2],["T03",4],["T04",4],["T05",4],["T06",6],["T07",6],["T08",6],["T09",8],["T10",10]]) {
    await prisma.table.create({ data: { number: num as string, capacity: cap as number } })
  }

  const pw = await bcrypt.hash("Admin@123", 10)
  await prisma.user.createMany({ data: [
    { name: "Admin",      phone: "0900000001", password: pw, role: "ADMIN"    },
    { name: "Nhân viên",  phone: "0900000002", password: pw, role: "STAFF"    },
    { name: "Khách demo", phone: "0900000003", password: pw, role: "CUSTOMER" },
  ]})

  await prisma.promotion.createMany({ data: [
    { name: "Giảm 10% khách mới", code: "NEWGUEST",  discountType: "PERCENTAGE", discountValue: 10, minOrder: 200000, maxDiscount: 100000, usageLimit: 500, startDate: new Date("2025-01-01"), endDate: new Date("2026-12-31") },
    { name: "Giảm 50k cuối tuần", code: "WEEKEND50", discountType: "FIXED",      discountValue: 50000, minOrder: 300000, startDate: new Date("2025-01-01"), endDate: new Date("2026-12-31") },
  ]})

  console.log("Seed xong!")
}
main().catch(console.error).finally(() => prisma.$disconnect())
