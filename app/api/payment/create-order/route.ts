import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createOrder, PREMIUM_PLAN_PRICE } from "@/lib/payments"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const amount = body.type === "MEMBERSHIP" ? PREMIUM_PLAN_PRICE : body.amount

  const order = await createOrder(amount, `korpo_${session.user.id}_${Date.now()}`, {
    userId: session.user.id,
    type: body.type,
  })

  // Create pending payment record
  await prisma.payment.create({
    data: {
      userId: session.user.id,
      amount,
      type: body.type,
      status: "PENDING",
      razorpayOrderId: order.id as string,
    },
  })

  return NextResponse.json({ orderId: order.id, amount })
}
