import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const image = (name: string) => `https://res.cloudinary.com/demo/image/upload/${name}.jpg`

async function main() {
  console.log("Seeding Le Monde Steak...")

  await prisma.userRole.createMany({
    data: [
      { id: "ADMIN", name: "Admin", description: "Quan tri vien he thong" },
      { id: "STAFF", name: "Staff", description: "Nhan vien nha hang" },
      { id: "CUSTOMER", name: "Customer", description: "Khach hang dat mon qua QR" },
    ],
    skipDuplicates: true,
  })

  const categories = await Promise.all([
    prisma.category.upsert({ where: { id: "cat_premium" }, update: {}, create: { id: "cat_premium", name: "Premium Aging Beef", sortOrder: 1 } }),
    prisma.category.upsert({ where: { id: "cat_hot_plate" }, update: {}, create: { id: "cat_hot_plate", name: "Hot Plate", sortOrder: 2 } }),
    prisma.category.upsert({ where: { id: "cat_side" }, update: {}, create: { id: "cat_side", name: "Side Dish", sortOrder: 3 } }),
    prisma.category.upsert({ where: { id: "cat_drink" }, update: {}, create: { id: "cat_drink", name: "Thuc uong", sortOrder: 4 } }),
    prisma.category.upsert({ where: { id: "cat_pasta" }, update: {}, create: { id: "cat_pasta", name: "Pasta", sortOrder: 5 } }),
    prisma.category.upsert({ where: { id: "cat_doria" }, update: {}, create: { id: "cat_doria", name: "Doria", sortOrder: 6 } }),
  ])
  const [premium, hotPlate, side, drink, pasta, doria] = categories

  const dishes = await Promise.all([
    prisma.item.upsert({ where: { id: "item_dasani" }, update: {}, create: { id: "item_dasani", name: "Nuoc loc Dasani", price: 10000, categoryId: drink.id, image: image("water"), description: "Nuoc loc dong chai dung kem bua an." } }),
    prisma.item.upsert({ where: { id: "item_pepsi" }, update: {}, create: { id: "item_pepsi", name: "Pepsi", price: 10000, categoryId: drink.id, image: image("soda"), description: "Nuoc ngot co gas uong lanh." } }),
    prisma.item.upsert({ where: { id: "item_coca" }, update: {}, create: { id: "item_coca", name: "Coca", price: 10000, categoryId: drink.id, image: image("cola"), description: "Nuoc ngot co gas vi cola." } }),
    prisma.item.upsert({ where: { id: "item_sausage" }, update: {}, create: { id: "item_sausage", name: "Grilled Hoshi Shinshu Sausage", price: 99000, categoryId: side.id, image: image("sausage"), description: "Xuc xich nuong thom vi, dung kem sot dac trung." } }),
    prisma.item.upsert({ where: { id: "item_bacon" }, update: {}, create: { id: "item_bacon", name: "Grilled Shinshu Bacon", price: 79000, categoryId: side.id, image: image("bacon"), description: "Bacon nuong vang, thich hop dung kem steak." } }),
    prisma.item.upsert({ where: { id: "item_tongue" }, update: {}, create: { id: "item_tongue", name: "Beef Tongue", price: 329000, categoryId: premium.id, image: image("steak"), description: "Luoi bo nuong mem, dam vi dac trung Le Monde Steak." } }),
    prisma.item.upsert({ where: { id: "item_sirloin" }, update: {}, create: { id: "item_sirloin", name: "Aging Sirloin Wagyu A5", price: 779000, categoryId: premium.id, image: image("wagyu"), description: "Thit bo Wagyu A5 u tuoi, ap chao tren dia nong." } }),
    prisma.item.upsert({ where: { id: "item_pasta" }, update: {}, create: { id: "item_pasta", name: "Pasta Bo Wagyu Phong Cach Nhat", price: 139000, categoryId: pasta.id, image: image("pasta"), description: "Mi Y sot dac biet ket hop thit bo Wagyu bam." } }),
    prisma.item.upsert({ where: { id: "item_doria" }, update: {}, create: { id: "item_doria", name: "Doria Bo Nuong Pho Mai", price: 149000, categoryId: doria.id, image: image("pizza"), description: "Com nuong kieu Nhat voi bo va lop pho mai beo thom." } }),
    prisma.item.upsert({ where: { id: "item_chicken" }, update: {}, create: { id: "item_chicken", name: "Ga Chien Dac Biet", price: 149000, categoryId: hotPlate.id, image: image("chicken"), description: "Ga chien gion, phuc vu kem sot nha hang." } }),
  ])

  await prisma.combo.upsert({
    where: { id: "combo_lunch" },
    update: {},
    create: {
      id: "combo_lunch",
      name: "Set Lunch Nhanh 1 Nguoi",
      price: 299000,
      description: "Steak + mi sot kem nam + salad cho bua trua nhanh gon.",
      image: image("set_lunch"),
    },
  })
  await prisma.combo.upsert({
    where: { id: "combo_family" },
    update: {},
    create: {
      id: "combo_family",
      name: "Set Le Monde Family",
      price: 1599000,
      description: "Day du cho ca nha voi steak, pasta, side dish va thuc uong.",
      image: image("family_set"),
    },
  })

  for (const [number, capacity] of [
    ["T01", 2], ["T02", 2], ["T03", 4], ["T04", 4], ["T05", 4],
    ["T06", 6], ["T07", 6], ["T08", 6], ["T09", 8], ["T10", 10],
    ["T11", 6], ["T12", 6], ["T13", 6], ["T14", 6], ["T15", 10],
  ] as const) {
    await prisma.table.upsert({
      where: { number },
      update: { capacity },
      create: { number, capacity },
    })
  }

  const pw = await bcrypt.hash("Admin@123", 10)
  await prisma.user.upsert({ where: { phone: "0900000001" }, update: {}, create: { name: "Admin", phone: "0900000001", password: pw, role: "ADMIN" } })
  await prisma.user.upsert({ where: { phone: "0900000002" }, update: {}, create: { name: "Nhan Vien", phone: "0900000002", password: pw, role: "STAFF" } })
  await prisma.user.upsert({
    where: { phone: "0900000003" },
    update: {},
    create: { name: "Khach Demo", phone: "0900000003", password: pw, role: "CUSTOMER", customer: { create: { name: "Khach Demo", phone: "0900000003" } } },
  })

  await prisma.promotion.upsert({
    where: { code: "NEWGUEST" },
    update: {},
    create: { id: "promo_new", name: "Giam 10% Khach Moi", code: "NEWGUEST", discountType: "PERCENTAGE", discountValue: 10, minOrder: 200000, maxDiscount: 100000, usageLimit: 500, startDate: new Date("2025-01-01"), endDate: new Date("2026-12-31"), description: "Uu dai cho khach lan dau." },
  })
  await prisma.promotion.upsert({
    where: { code: "WEEKEND50" },
    update: {},
    create: { id: "promo_weekend", name: "Giam 50K Cuoi Tuan", code: "WEEKEND50", discountType: "FIXED", discountValue: 50000, minOrder: 300000, usageLimit: 200, startDate: new Date("2025-01-01"), endDate: new Date("2026-12-31"), description: "Uu dai cuoi tuan cho hoa don tu 300.000d." },
  })
  await prisma.promotion.upsert({
    where: { code: "BIRTHDAY" },
    update: {},
    create: { id: "promo_birthday", name: "Giam 20% Sinh Nhat", code: "BIRTHDAY", discountType: "PERCENTAGE", discountValue: 20, minOrder: 150000, maxDiscount: 150000, usageLimit: 1000, startDate: new Date("2025-01-01"), endDate: new Date("2026-12-31"), description: "Giam gia nhan dip sinh nhat." },
  })

  console.log("Seed xong!")
}

main().catch(console.error).finally(() => prisma.$disconnect())
