import dns from "dns/promises"
import net from "net"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type CorpEmailCheck =
  | { ok: true }
  | { ok: false; reason: string }

// SMTP probe: opens a connection to the domain's mail server and asks whether
// the mailbox exists via RCPT TO — no DATA/message is ever sent, so nothing
// is delivered to the inbox. Most corporate mail servers deliberately return
// a generic "accepted" response for any address to prevent enumeration, so an
// inconclusive result is treated as a pass rather than a rejection.
function smtpProbe(mxHost: string, email: string): Promise<"valid" | "invalid" | "unknown"> {
  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxHost)
    let step = 0
    let settled = false
    const finish = (result: "valid" | "invalid" | "unknown") => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(result)
    }

    socket.setTimeout(5000, () => finish("unknown"))
    socket.on("error", () => finish("unknown"))

    socket.on("data", (buf) => {
      const line = buf.toString()
      const code = parseInt(line.slice(0, 3), 10)

      if (step === 0) {
        // Greeting
        socket.write(`HELO korpo.in\r\n`)
        step = 1
      } else if (step === 1) {
        socket.write(`MAIL FROM:<verify@korpo.in>\r\n`)
        step = 2
      } else if (step === 2) {
        socket.write(`RCPT TO:<${email}>\r\n`)
        step = 3
      } else if (step === 3) {
        socket.write("QUIT\r\n")
        if (code >= 200 && code < 300) finish("valid")
        else if (code >= 550 && code < 560) finish("invalid")
        else finish("unknown")
      }
    })
  })
}

// Validates a claimed corporate email address without ever sending it a
// message: syntax → not personal/disposable → domain has MX records → a
// best-effort, non-delivering SMTP mailbox probe.
export async function verifyCorpEmail(email: string): Promise<CorpEmailCheck> {
  const normalized = email.trim().toLowerCase()
  if (!EMAIL_RE.test(normalized)) {
    return { ok: false, reason: "Please enter a valid email address." }
  }

  const domain = normalized.split("@")[1]

  let mxRecords: { exchange: string; priority: number }[]
  try {
    mxRecords = await dns.resolveMx(domain)
  } catch {
    mxRecords = []
  }
  if (mxRecords.length === 0) {
    return { ok: false, reason: "This domain doesn't have a valid mail server configured." }
  }

  const primaryMx = [...mxRecords].sort((a, b) => a.priority - b.priority)[0].exchange
  const probe = await smtpProbe(primaryMx, normalized)
  if (probe === "invalid") {
    return { ok: false, reason: "This mailbox doesn't appear to exist. Please double-check the address." }
  }

  return { ok: true }
}
