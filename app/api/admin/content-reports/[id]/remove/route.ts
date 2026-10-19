import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { pushNotification } from "@/lib/notify"
import { CONTENT_TYPES, isReportableType } from "@/lib/content-moderation"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const report = await prisma.contentReport.findUnique({ where: { id: params.id } })
  if (report && isReportableType(report.itemType)) {
    const cfg  = CONTENT_TYPES[report.itemType]
    const item = await cfg.load(report.itemId)
    if (item) {
      await cfg.takedown(report.itemId)
      // Resolve every pending report on this post, not just the one clicked.
      await prisma.contentReport.updateMany({
        where: { itemType: report.itemType, itemId: report.itemId, status: "PENDING" },
        data:  { status: "RESOLVED" },
      })
      const n = await prisma.notification.create({
        data: {
          userId: item.ownerId,
          type:   "REPORT",
          title:  `Your ${cfg.label.toLowerCase()} was removed`,
          body:   `"${item.title}" was removed by an admin after being reported for: ${report.reason}.`,
          link:   null,
        },
      })
      pushNotification(n)
      const section = cfg.path(report.itemId).split("/")[1]
      for (const p of [`/${section}`, cfg.path(report.itemId), "/dashboard", "/my-postings", "/wishlist", "/admin/reports"]) revalidatePath(p)
    } else {
      // Post no longer exists — just close the report.
      await prisma.contentReport.update({ where: { id: report.id }, data: { status: "RESOLVED" } })
    }
  }
  return NextResponse.redirect(new URL("/admin/reports", req.url), 303)
}
