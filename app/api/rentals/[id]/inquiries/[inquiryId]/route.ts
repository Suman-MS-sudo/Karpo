import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

type Ctx = { params: { id: string; inquiryId: string } }

// Valid owner actions per inquiry type
const VALID_ACTIONS: Record<string, string[]> = {
  INTEREST: ["ACCEPT", "DECLINE"],
  VISIT:    ["CONFIRM", "DECLINE", "DONE", "CLOSE_DEAL"],
  INQUIRY:  ["ACCEPT", "DECLINE"],
}

const ACTION_STATUS: Record<string, string> = {
  ACCEPT:     "ACCEPTED",
  CONFIRM:    "CONFIRMED",
  DECLINE:    "DECLINED",
  DONE:       "DONE",
  CLOSE_DEAL: "ACCEPTED",
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { session, error } = await requireVerified()
  if (error) return error

  const { action } = (await req.json()) as { action: string }

  const inquiry = await prisma.rentalInquiry.findUnique({
    where: { id: params.inquiryId },
    include: {
      rental: {
        select: {
          userId: true, title: true, id: true,
          user: { select: { phone: true, email: true, name: true } },
        },
      },
      user: { select: { name: true } },
    },
  })
  if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (inquiry.rental.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const allowed = VALID_ACTIONS[inquiry.type] ?? ["ACCEPT", "DECLINE"]
  if (!allowed.includes(action)) {
    return NextResponse.json({ error: `Invalid action '${action}' for type '${inquiry.type}'` }, { status: 400 })
  }

  if (action === "DONE" && inquiry.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Visit must be confirmed before marking done" }, { status: 400 })
  }
  if (action === "CLOSE_DEAL" && inquiry.status !== "DONE") {
    return NextResponse.json({ error: "Visit must be marked done before closing the deal" }, { status: 400 })
  }
  if (action === "DECLINE" && inquiry.status === "DONE") {
    // allowed: owner declines after visit
  }

  const newStatus = ACTION_STATUS[action]

  if (action === "ACCEPT") {
    // Accept: reveal contact info + send message
    await prisma.$transaction([
      prisma.rentalInquiry.update({ where: { id: params.inquiryId }, data: { status: newStatus } }),
      prisma.notification.create({
        data: {
          userId: inquiry.userId,
          type:   "RENTAL_ACCEPTED",
          title:  "Your request was accepted! 🎉",
          body:   `The owner of "${inquiry.rental.title}" accepted your request. Contact details are now available.`,
          link:   `/rentals/${inquiry.rental.id}`,
        },
      }),
      prisma.message.create({
        data: {
          senderId:   session.user.id,
          receiverId: inquiry.userId,
          content: `Hi ${inquiry.user.name?.split(" ")[0] ?? "there"}! I've accepted your request for "${inquiry.rental.title}". Here's how to reach me:\n\n📞 Phone: ${inquiry.rental.user.phone ?? "Not provided"}\n📧 Email: ${inquiry.rental.user.email ?? "Not provided"}\n\nFeel free to schedule a visit!`,
          listingId:   inquiry.rental.id,
          listingType: "rental",
        },
      }),
    ])
  } else if (action === "CONFIRM") {
    // Confirm visit: notify with date/time
    const visitInfo = inquiry.visitDate
      ? `${new Date(inquiry.visitDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}${inquiry.visitTime ? ` · ${inquiry.visitTime.charAt(0) + inquiry.visitTime.slice(1).toLowerCase()}` : ""}`
      : "as requested"

    await prisma.$transaction([
      prisma.rentalInquiry.update({ where: { id: params.inquiryId }, data: { status: newStatus } }),
      prisma.notification.create({
        data: {
          userId: inquiry.userId,
          type:   "RENTAL_ACCEPTED",
          title:  "Visit confirmed! 📅",
          body:   `Your visit to "${inquiry.rental.title}" is confirmed for ${visitInfo}.`,
          link:   `/rentals/${inquiry.rental.id}`,
        },
      }),
      prisma.message.create({
        data: {
          senderId:   session.user.id,
          receiverId: inquiry.userId,
          content: `Hi ${inquiry.user.name?.split(" ")[0] ?? "there"}! Your visit to "${inquiry.rental.title}" is confirmed for ${visitInfo}.\n\nMy contact:\n📞 ${inquiry.rental.user.phone ?? "Not provided"}\n📧 ${inquiry.rental.user.email ?? "Not provided"}`,
          listingId:   inquiry.rental.id,
          listingType: "rental",
        },
      }),
    ])
  } else if (action === "DONE") {
    await prisma.rentalInquiry.update({ where: { id: params.inquiryId }, data: { status: newStatus } })
  } else if (action === "CLOSE_DEAL") {
    // Mark deal closed: accept inquiry + fill the rental
    await prisma.$transaction([
      prisma.rentalInquiry.update({ where: { id: params.inquiryId }, data: { status: "ACCEPTED" } }),
      prisma.rentalPost.update({ where: { id: params.id }, data: { status: "FILLED" } }),
      prisma.notification.create({
        data: {
          userId: inquiry.userId,
          type:   "RENTAL_ACCEPTED",
          title:  "Deal confirmed! 🎉",
          body:   `Your visit to "${inquiry.rental.title}" turned into a deal. Congratulations!`,
          link:   `/rentals/${inquiry.rental.id}`,
        },
      }),
      prisma.message.create({
        data: {
          senderId:    session.user.id,
          receiverId:  inquiry.userId,
          content:     `Hi ${inquiry.user.name?.split(" ")[0] ?? "there"}! I'm happy to confirm that we've agreed on the deal for "${inquiry.rental.title}". Welcome! 🎉\n\nPlease reach out if you need anything for move-in.\n\n📞 ${inquiry.rental.user.phone ?? "Not provided"}\n📧 ${inquiry.rental.user.email ?? "Not provided"}`,
          listingId:   inquiry.rental.id,
          listingType: "rental",
        },
      }),
    ])
  } else {
    // DECLINE
    await prisma.$transaction([
      prisma.rentalInquiry.update({ where: { id: params.inquiryId }, data: { status: newStatus } }),
      prisma.notification.create({
        data: {
          userId: inquiry.userId,
          type:   "RENTAL_DECLINED",
          title:  "Update on your rental request",
          body:   `The owner has declined your ${inquiry.type.toLowerCase()} for "${inquiry.rental.title}".`,
          link:   `/rentals/${inquiry.rental.id}`,
        },
      }),
    ])
  }

  return NextResponse.json({ ok: true, status: newStatus })
}
