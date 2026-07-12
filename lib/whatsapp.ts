// WhatsApp Cloud API (Meta) — free tier, no SDK needed, plain fetch.
// Setup: developers.facebook.com → create app → add "WhatsApp" product →
// copy Phone Number ID + a temporary/permanent access token into .env.local.

const GRAPH_VERSION = "v21.0"

function getConfig() {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) return null
  return { token, phoneNumberId }
}

interface WhatsAppResult {
  success: boolean
  error?: string
}

// `to` must be in international format, digits only (e.g. "919876543210")
export async function sendWhatsAppMessage(to: string, body: string): Promise<WhatsAppResult> {
  const config = getConfig()
  if (!config) {
    console.log(`\n${"─".repeat(50)}`)
    console.log(`[KORPO DEV] WhatsApp message`)
    console.log(`To:   ${to}`)
    console.log(`Body: ${body}`)
    console.log(`${"─".repeat(50)}\n`)
    return { success: true }
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body },
        }),
      }
    )

    if (!res.ok) {
      const errBody = await res.text()
      console.error("[WhatsApp] send failed:", res.status, errBody)
      return { success: false, error: `WhatsApp API error ${res.status}` }
    }

    return { success: true }
  } catch (err) {
    console.error("[WhatsApp] send error:", err)
    return { success: false, error: "Failed to send WhatsApp message" }
  }
}

// Send a pre-approved template message (required for messages outside the
// 24-hour customer-service window, e.g. the very first contact with a user).
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode = "en_US",
  parameters: string[] = []
): Promise<WhatsAppResult> {
  const config = getConfig()
  if (!config) {
    console.log(`\n${"─".repeat(50)}`)
    console.log(`[KORPO DEV] WhatsApp template message`)
    console.log(`To:       ${to}`)
    console.log(`Template: ${templateName}`)
    console.log(`Params:   ${parameters.join(", ")}`)
    console.log(`${"─".repeat(50)}\n`)
    return { success: true }
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode },
            ...(parameters.length > 0 && {
              components: [
                {
                  type: "body",
                  parameters: parameters.map((text) => ({ type: "text", text })),
                },
              ],
            }),
          },
        }),
      }
    )

    if (!res.ok) {
      const errBody = await res.text()
      console.error("[WhatsApp] template send failed:", res.status, errBody)
      return { success: false, error: `WhatsApp API error ${res.status}` }
    }

    return { success: true }
  } catch (err) {
    console.error("[WhatsApp] template send error:", err)
    return { success: false, error: "Failed to send WhatsApp message" }
  }
}
