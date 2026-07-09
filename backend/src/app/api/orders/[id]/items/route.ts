import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, optionsResponse } from "@/lib/cors"
import { authorize } from "@/lib/apiAuth"
import { attachOrderItems, packOrderLines, parseOrderLines } from "@/lib/orderLines"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function OPTIONS() { return optionsResponse() }

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = authorize(req, ["STAFF", "ADMIN"])
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        orderDetails: {
          include: {
            item: { select: { id: true, name: true } },
            combo: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Khong tim thay don." }, { status: 404, headers: corsHeaders() })
    }

    return NextResponse.json(attachOrderItems(order).items, { headers: corsHeaders() })
  } catch (error) {
    console.error("Load order items failed", error)
    return NextResponse.json({ error: "Khong tai duoc chi tiet mon." }, { status: 500, headers: corsHeaders() })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorize(req, ["STAFF", "ADMIN"])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders() })

  const { itemId, status } = await req.json()
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      orderDetails: {
        include: {
          item: { select: { id: true, name: true } },
          combo: { select: { id: true, name: true } },
        },
      },
    },
  })
  const currentDetail = order?.orderDetails.find((item) => item.id === itemId)
  const legacyItems = currentDetail ? [] : parseOrderLines(order?.customerNotes)
  const current = currentDetail ?? legacyItems.find((item) => item.id === itemId)
  if (!order || !current) {
    return NextResponse.json({ error: "Mon an khong thuoc don hang nay." }, { status: 404, headers: corsHeaders() })
  }

  const nextStatus: Record<string, string> = { WAITING: "PREPARING", PREPARING: "DONE", DONE: "SERVED" }
  if (nextStatus[current.status] !== status) {
    return NextResponse.json({ error: "Trang thai mon phai cap nhat lan luot: Bat dau -> Xong mon -> Da phuc vu." }, { status: 409, headers: corsHeaders() })
  }

  if (currentDetail) {
    const updated = await prisma.orderDetail.update({
      where: { id: currentDetail.id },
      data: { status },
      include: {
        item: { select: { id: true, name: true } },
        combo: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json(updated, { headers: corsHeaders() })
  }

  current.status = status
  await prisma.order.update({ where: { id: params.id }, data: { customerNotes: packOrderLines(legacyItems) } })
  return NextResponse.json(current, { headers: corsHeaders() })
}
