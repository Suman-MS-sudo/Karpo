"use client"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { ServiceRail } from "./ServiceRail"
import { TopNav } from "./TopNav"
import { MobileNav } from "./MobileNav"
import { ChatProvider } from "@/components/chat/ChatContext"
import { FloatingChatContainer } from "@/components/chat/FloatingChatContainer"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setDrawerOpen(false) }, [pathname])

  return (
    <ChatProvider>
      <div className="fixed inset-0 flex overflow-hidden">

        {/* ── Desktop 3-column layout ─────────────────────────────── */}
        {/* Icon rail — always visible on desktop */}
        <ServiceRail />

        {/* Mobile sidebar drawer */}
        {drawerOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden animate-in slide-in-from-left duration-200">
              <div className="relative h-full">
                <Sidebar className="flex h-full" />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="absolute top-4 right-3 h-8 w-8 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Main content column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopNav onMenuClick={() => setDrawerOpen((o) => !o)} />
          <main
            id="main-scroll"
            className="flex-1 overflow-y-auto pb-20 lg:pb-0"
            style={{ overflowAnchor: "none" }}
          >
            {children}
          </main>
        </div>

        <MobileNav />

        {/* ── Floating Chat Windows ────────────────────────────────── */}
        <FloatingChatContainer />
      </div>
    </ChatProvider>
  )
}
