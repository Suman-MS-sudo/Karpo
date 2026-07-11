import { EventEmitter } from "events"

// Global singleton so the emitter survives Next.js hot-reloads in development
const g = globalThis as typeof globalThis & { _notifEmitter?: EventEmitter }
if (!g._notifEmitter) {
  g._notifEmitter = new EventEmitter()
  g._notifEmitter.setMaxListeners(200)
}
const emitter = g._notifEmitter

export interface NotificationPayload {
  id: string
  title: string
  body: string
  type: string
  isRead: boolean
  link?: string | null
  createdAt: string
}

/** Called after saving a notification to DB to push it to the recipient in real time. */
export function emitNotification(userId: string, notification: NotificationPayload) {
  emitter.emit(`notif:${userId}`, notification)
}

/** Subscribe to notifications arriving for a given user. Returns an unsubscribe fn. */
export function onNotification(
  userId: string,
  handler: (notification: NotificationPayload) => void
): () => void {
  emitter.on(`notif:${userId}`, handler)
  return () => emitter.off(`notif:${userId}`, handler)
}
