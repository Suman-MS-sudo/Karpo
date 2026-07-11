import { auth } from "@/auth"
import { onNotification } from "@/lib/notification-events"

export const dynamic = "force-dynamic"

/**
 * GET /api/notifications/stream
 *
 * Server-Sent Events endpoint. Pushes a notification to the client the
 * instant it's created (e.g. someone shows interest or schedules a visit
 * on a rental) — no polling/reload required to see it.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const userId = session.user.id
  const encoder = new TextEncoder()

  let cleanup: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`: connected\n\n`))

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          // Connection already closed
        }
      }, 25_000)

      const unsubscribe = onNotification(userId, (notif) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(notif)}\n\n`))
        } catch {
          // Connection already closed
        }
      })

      cleanup = () => {
        clearInterval(heartbeat)
        unsubscribe()
      }
    },
    cancel() {
      cleanup?.()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
