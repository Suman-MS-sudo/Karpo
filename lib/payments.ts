import Razorpay from "razorpay"
import crypto from "crypto"

function getRazorpay() {
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

export const PREMIUM_PLAN_PRICE = 9900 // ₹99 in paise

export const BOOST_PRICE_MAP: Record<string, { price: number; days: number }> = {
  BASIC:    { price: 4900,  days: 7 },
  FEATURED: { price: 9900,  days: 7 },
  SUPER:    { price: 19900, days: 14 },
}

export async function createOrder(
  amount: number,
  receipt: string,
  notes?: Record<string, string>
) {
  return getRazorpay().orders.create({
    amount,
    currency: "INR",
    receipt,
    notes,
  })
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex")
  return expectedSignature === signature
}
