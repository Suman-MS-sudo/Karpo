// Wraps LinkedIn's "Verified on LinkedIn" Verification Report API — this reads
// the member's Account preferences → Verifications tab (identity/workplace
// verification via work email or Microsoft Entra), which is a distinct signal
// from the Sign in & Security email_verified claim returned in the OIDC profile.
// Requires the "Verified on LinkedIn" product to be added to the app in the
// LinkedIn Developer Portal and the r_verify_details scope to be granted.
const LINKEDIN_VERSION = process.env.LINKEDIN_VERIFICATION_API_VERSION ?? "202510"

export type LinkedInVerificationResult =
  | { ok: true; verifications: string[]; verificationUrl?: string }
  | { ok: false; reason: "no_access" | "request_failed" }

export async function getLinkedInVerificationReport(accessToken: string): Promise<LinkedInVerificationResult> {
  try {
    const res = await fetch(
      "https://api.linkedin.com/rest/verificationReport?verificationCriteria=WORKPLACE",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": LINKEDIN_VERSION,
        },
      }
    )

    // 403 here means the app hasn't been granted the "Verified on LinkedIn"
    // product / r_verify_details scope yet — a config gap, not a member-level
    // failure, so callers should fall back rather than block sign-in on it.
    if (res.status === 403) return { ok: false, reason: "no_access" }
    if (!res.ok) return { ok: false, reason: "request_failed" }

    const data = (await res.json()) as { verifications?: string[]; verificationUrl?: string }
    return { ok: true, verifications: data.verifications ?? [], verificationUrl: data.verificationUrl }
  } catch {
    return { ok: false, reason: "request_failed" }
  }
}
