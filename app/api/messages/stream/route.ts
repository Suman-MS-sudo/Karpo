import { requireVerified } from "@/lib/api-auth"
import { onNewMessage } from "@/lib/message-events"

export const dynamic = "force-dynamic"

/**
 * GET /api/messages/stream
 *
 * Server-Sent Events endpoint.  Each connected client receives real-time
 * message events pushed by the server whenever a new message is saved for
 * that user — no client polling required.
 *
 * The client opens this URL once and keeps the connection alive.
 * The server pushes `data: {...}\n\n` frames for every new message.
 * A `: heartbeat\n\n` comment is sent every 25 s to keep the connection alive
 * through proxies / load balancers.
 */
export async function GET() {
  const { session, error } = await requireVerified()
  if (error) return error

  const userId = session.user.id
  const encoder = new TextEncoder()

  let cleanup: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      // Initial acknowledgement
      controller.enqueue(encoder.encode(`: connected\n\n`))

      // Heartbeat — keeps the TCP connection alive through idle periods
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          // Connection already closed
        }
      }, 25_000)

      // Subscribe to new messages for this user
      const unsubscribe = onNewMessage(userId, (msg) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)
          )
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
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  })
}
