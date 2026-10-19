import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { pushNotification } from "@/lib/notify"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const report = await prisma.listingReport.findUnique({ where: { id: params.id } })
  if (report) {
    const listing = await prisma.listing.update({
      where: { id: report.listingId }, data: { status: "REMOVED" }, select: { userId: true, title: true },
    })
    // Resolve every pending report on this listing, not just the one clicked.
    await prisma.listingReport.updateMany({
      where: { listingId: report.listingId, status: "PENDING" }, data: { status: "RESOLVED" },
    })
    const n = await prisma.notification.create({
      data: {
        userId: listing.userId,
        type:   "REPORT",
        title:  "Your listing was removed",
        body:   `"${listing.title}" was removed by an admin after being reported for: ${report.reason}.`,
        link:   null,
      },
    })
    pushNotification(n)
    for (const p of ["/marketplace", `/marketplace/${report.listingId}`, "/dashboard", "/my-postings", "/my-listings", "/wishlist", "/admin/reports"]) revalidatePath(p)
  }
  // 303 so the browser follows with a GET (a default 307 would re-POST to the page).
  return NextResponse.redirect(new URL("/admin/reports", _req.url), 303)
}
