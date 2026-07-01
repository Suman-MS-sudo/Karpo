import { EventEmitter } from "events"

// Global singleton so the emitter survives Next.js hot-reloads in development
const g = globalThis as typeof globalThis & { _msgEmitter?: EventEmitter }
if (!g._msgEmitter) {
  g._msgEmitter = new EventEmitter()
  g._msgEmitter.setMaxListeners(200)
}
const emitter = g._msgEmitter

export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  createdAt: string
  isRead: boolean
}

/** Called by the POST /api/messages/[userId] route after saving to DB. */
export function emitNewMessage(receiverId: string, message: ChatMessage) {
  emitter.emit(`msg:${receiverId}`, message)
}

/** Subscribe to messages arriving for a given user. Returns an unsubscribe fn. */
export function onNewMessage(
  userId: string,
  handler: (msg: ChatMessage) => void
): () => void {
  emitter.on(`msg:${userId}`, handler)
  return () => emitter.off(`msg:${userId}`, handler)
}
