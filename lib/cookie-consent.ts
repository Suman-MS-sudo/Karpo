"use client"

import { useEffect, useState } from "react"

/**
 * Cookie-consent state, stored in a first-party cookie so it is readable on
 * every page (public and signed-in) without a round trip.
 *
 * Categories (see /cookies):
 *  - necessary  — sign-in, security, consent itself. Always on.
 *  - functional — optional third-party embeds that set their own cookies
 *                 (currently Google Maps iframes). Off until the user opts in.
 *
 * Bump COOKIE_POLICY_VERSION whenever the Cookie Policy changes materially —
 * every visitor is then asked again.
 */
export const CONSENT_COOKIE        = "korpo_cookie_consent"
export const COOKIE_POLICY_VERSION = "2026-10-20"
const MAX_AGE_SECONDS              = 180 * 24 * 60 * 60
const CHANGED_EVENT                = "korpo:cookie-consent-changed"
const OPEN_EVENT                   = "korpo:open-cookie-settings"

export interface CookieConsent {
  id: string          // random id so a stored decision can be matched to its server-side log entry
  v: string           // policy version the visitor answered
  ts: string          // ISO timestamp of the decision
  functional: boolean
}

export function readConsent(): CookieConsent | null {
  if (typeof document === "undefined") return null
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw.slice(CONSENT_COOKIE.length + 1))) as CookieConsent
    return parsed.v === COOKIE_POLICY_VERSION ? parsed : null
  } catch {
    return null
  }
}

export function saveConsent(functional: boolean) {
  const consent: CookieConsent = {
    id: readConsent()?.id ?? crypto.randomUUID(),
    v: COOKIE_POLICY_VERSION,
    ts: new Date().toISOString(),
    functional,
  }
  const secure = location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(consent))}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT, { detail: consent }))

  // Evidence of the decision (version + time + choice). Best-effort: the
  // cookie above is what the site actually honours.
  fetch("/api/cookie-consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(consent),
    keepalive: true,
  }).catch(() => {})
}

/** Re-opens the consent dialog (footer / settings "Cookie settings" links). */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export function onOpenCookieSettings(handler: () => void) {
  window.addEventListener(OPEN_EVENT, handler)
  return () => window.removeEventListener(OPEN_EVENT, handler)
}

/** Current consent, kept in sync across components. `undefined` until mounted. */
export function useCookieConsent(): CookieConsent | null | undefined {
  const [consent, setConsent] = useState<CookieConsent | null | undefined>(undefined)
  useEffect(() => {
    setConsent(readConsent())
    const onChange = (e: Event) => setConsent((e as CustomEvent<CookieConsent>).detail)
    window.addEventListener(CHANGED_EVENT, onChange)
    return () => window.removeEventListener(CHANGED_EVENT, onChange)
  }, [])
  return consent
}
