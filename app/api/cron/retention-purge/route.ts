/**
 * GET|POST /api/cron/retention-purge
 *
 * Daily: permanently removes DeletedUserArchive rows whose 180-day statutory
 * retention period has ended (see lib/user-retention.ts).
 *
 * Protected by Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse } from "next/server"
import { isAuthorizedCronRequest } from "@/lib/cron-auth"
import { purgeExpiredArchives } from "@/lib/user-retention"

async function handler(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const purged = await purgeExpiredArchives()
  return NextResponse.json({ purged })
}

export { handler as GET, handler as POST }
