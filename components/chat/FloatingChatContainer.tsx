"use client"
import { useChatContext } from "./ChatContext"
import { ChatWindow } from "./ChatWindow"

const WINDOW_WIDTH  = 320
const WINDOW_GAP    = 12
const RIGHT_OFFSET  = 16  // distance from the right edge of the screen

/**
 * Renders all open floating chat windows, stacked horizontally from the
 * bottom-right corner.  Up to 3 windows appear side by side; a scrolling
 * tray is not needed because ChatContext caps open windows at 3.
 */
export function FloatingChatContainer() {
  const { windows } = useChatContext()

  if (windows.length === 0) return null

  return (
    <>
      {windows.map((win, idx) => {
        // Stack windows: rightmost is the newest (idx = windows.length - 1)
        const offsetRight = RIGHT_OFFSET + idx * (WINDOW_WIDTH + WINDOW_GAP)
        return (
          <ChatWindow
            key={win.partner.id}
            win={win}
            offsetRight={offsetRight}
          />
        )
      })}
    </>
  )
}
