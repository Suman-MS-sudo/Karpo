import { emitNotification } from "@/lib/notification-events"

interface CreatedNotification {
  id:        string
  userId:    string
  title:     string
  body:      string
  type:      string
  isRead:    boolean
  link:      string | null
  createdAt: Date
}

/** Pushes an already-created Notification row live to its recipient over SSE
 * so it shows up in their bell instantly, without waiting for the 60s poll
 * fallback or a page navigation refetch. Call this right after every
 * `prisma.notification.create` (or the array-form `$transaction` equivalent). */
export function pushNotification(notification: CreatedNotification) {
  emitNotification(notification.userId, {
    id:        notification.id,
    title:     notification.title,
    body:      notification.body,
    type:      notification.type,
    isRead:    notification.isRead,
    link:      notification.link,
    createdAt: notification.createdAt.toISOString(),
  })
}
