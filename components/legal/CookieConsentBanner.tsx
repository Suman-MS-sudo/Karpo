"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cookie, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { onOpenCookieSettings, openCookieSettings, readConsent, saveConsent, useCookieConsent } from "@/lib/cookie-consent"

/**
 * Cookie consent pop-up. Shown on first visit (and again whenever
 * COOKIE_POLICY_VERSION changes) on every page, public or signed-in.
 * Re-openable via openCookieSettings() from the footer / settings.
 */
export function CookieConsentBanner() {
  const consent = useCookieConsent()
  const [open, setOpen]               = useState(false)
  const [customising, setCustomising] = useState(false)
  const [functional, setFunctional]   = useState(false)

  // First visit / outdated policy version → ask.
  useEffect(() => {
    if (consent === null) setOpen(true)
  }, [consent])

  useEffect(() => onOpenCookieSettings(() => {
    setFunctional(readConsent()?.functional ?? false)
    setCustomising(true)
    setOpen(true)
  }), [])

  if (!open) return null

  const decide = (allowFunctional: boolean) => {
    saveConsent(allowFunctional)
    setOpen(false)
    setCustomising(false)
  }
  // Closing without choosing is only possible once a choice already exists.
  const canDismiss = consent != null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-5 pointer-events-none"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto mx-auto max-w-2xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl shadow-black/20 p-5 sm:p-6 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Cookie className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 id="cookie-consent-title" className="font-semibold text-base text-foreground">
                {customising ? "Cookie preferences" : "We use cookies"}
              </h2>
              {canDismiss && (
                <button type="button" onClick={() => { setOpen(false); setCustomising(false) }} aria-label="Close" className="text-muted-foreground hover:text-foreground -mt-1">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Korpo uses strictly necessary cookies to keep you signed in and secure. With your permission we
              also load optional third-party content, such as Google Maps previews, which may set its own
              cookies. We do not use advertising or cross-site tracking cookies. Read our{" "}
              <Link href="/cookies" className="underline font-medium text-foreground hover:text-primary">Cookie Policy</Link>.
            </p>

            {customising && (
              <div className="mt-4 space-y-2.5">
                <CategoryRow
                  title="Strictly necessary"
                  desc="Sign-in session, security (CSRF) and remembering this choice. Required for the site to work."
                  checked
                  disabled
                />
                <CategoryRow
                  title="Functional & third-party embeds"
                  desc="Google Maps location previews on events and skills. Google may set cookies when these load."
                  checked={functional}
                  onChange={setFunctional}
                />
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:justify-end">
              {customising ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => decide(false)}>Necessary only</Button>
                  <Button size="sm" onClick={() => decide(functional)}>Save preferences</Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => { setFunctional(false); setCustomising(true) }}>Manage preferences</Button>
                  <Button variant="outline" size="sm" onClick={() => decide(false)}>Necessary only</Button>
                  <Button size="sm" onClick={() => decide(true)}>Accept all</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryRow({ title, desc, checked, disabled, onChange }: {
  title: string; desc: string; checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void
}) {
  return (
    <label className={cn("flex items-start justify-between gap-4 rounded-xl border border-border p-3", !disabled && "cursor-pointer hover:bg-muted/50")}>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{title}{disabled && <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">Always on</span>}</span>
        <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        className="mt-1 h-4 w-4 shrink-0 accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
    </label>
  )
}

/** Small text button that re-opens the consent dialog. */
export function CookieSettingsButton({ className, children = "Cookie settings" }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={openCookieSettings}>
      {children}
    </button>
  )
}
