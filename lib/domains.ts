// Personal consumer email providers — never valid for corporate use
export const PERSONAL_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.co.in", "yahoo.co.uk", "yahoo.in", "yahoo.com.au", "ymail.com", "rocketmail.com",
  "hotmail.com", "hotmail.co.in", "hotmail.co.uk", "hotmail.fr", "hotmail.de", "hotmail.it",
  "outlook.com", "outlook.in", "outlook.co.uk", "outlook.fr", "outlook.de",
  "live.com", "live.in", "live.co.uk", "live.fr", "live.de",
  "msn.com", "windowslive.com",
  "icloud.com", "me.com", "mac.com",
  "rediffmail.com", "rediff.com", "indiatimes.com",
  "protonmail.com", "proton.me", "pm.me",
  "aol.com", "aim.com", "verizon.net",
  "zoho.com", "zohomail.com",
  "yandex.com", "yandex.ru", "yandex.net",
  "gmx.com", "gmx.net", "gmx.de", "gmx.at",
  "mail.com", "email.com", "usa.com", "myself.com",
  "inbox.com", "fastmail.com", "fastmail.fm",
  "hushmail.com", "tutanota.com", "tutanota.de",
  "mailfence.com", "disroot.org",
  "cock.li", "tfwno.gf",
])

// Disposable / temp email providers — one-time use throwaway addresses
export const TEMP_DOMAINS = new Set([
  // Guerrilla Mail family
  "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
  "guerrillamail.biz", "guerrillamail.de", "guerrillamail.info",
  "guerrillamailblock.com", "grr.la", "sharklasers.com", "spam4.me",
  // YOP Mail family
  "yopmail.com", "yopmail.fr", "cool.fr.nf", "jetable.fr.nf", "nospam.ze.tc",
  "nomail.xl.cx", "mega.zik.dj", "speed.1s.fr", "courriel.fr.nf",
  "moncourrier.fr.nf", "monemail.fr.nf", "monmail.fr.nf",
  // Trash Mail family
  "trashmail.com", "trashmail.net", "trashmail.me", "trashmail.at",
  "trashmail.io", "trashmail.org", "discard.email", "trashmailer.com",
  // 10 Minute Mail family
  "10minutemail.com", "10minutemail.net", "10minutemail.org", "10minutemail.co.za",
  "10minemail.com", "20minutemail.com", "1minutemail.com", "5minutemail.com",
  // Temp Mail family
  "tempmail.com", "tempmail.net", "tempmail.org", "temp-mail.org", "temp-mail.ru",
  "tempr.email", "tempemail.com", "tempinbox.com", "tempinbox.co.uk",
  "tmpmail.net", "tmpmail.org", "tmpjr.me",
  // Throwaway
  "throwam.com", "throwam.net", "throwam.org", "throwam.info", "throwam.me", "throwam.top",
  "throwaway.email", "throwam.space",
  // Spam filters / honeypots
  "mailnull.com", "spamgourmet.com", "spamgourmet.net", "spamgourmet.org",
  "spamspot.com", "spamgap.com", "spamfree.eu", "spamweed.net",
  "spamhole.com", "spamify.com", "spam.la", "bspamfree.org", "spamfree24.org",
  // Mailinator / bulk
  "mailinator.com", "mailinator2.com", "maildrop.cc", "mailnesia.com", "mailsac.com",
  // Fake / generate
  "fakeinbox.com", "fakemailgenerator.com", "fakeinbox.net",
  "getairmail.com", "getnada.com", "nada.email",
  "dispostable.com", "objectmail.com",
  "einrot.com", "einrot.de", "hide.biz.st", "wh4f.org", "crapmail.org",
  "mytempemail.com", "emailondeck.com", "emailondeck.net",
  // Privacy / anon relay
  "anonaddy.com", "anonaddy.me", "simplelogin.co", "simplelogin.io",
  "33mail.com", "burnermail.io",
  // Inbox bear / misc
  "inboxbear.com", "mailtemp.info", "mohmal.com", "getonemail.com",
  "mailforspam.com", "mt2015.com", "mt2014.com", "filzmail.com",
  "spoofmail.de", "klzlk.com",
  // Common random-domain disposables
  "onldm.net", "rfcdrive.com", "uvapp.net", "binkmail.com",
  "mailmetrash.com", "trashdevil.com", "trashdevil.de",
  "wegwerfmail.de", "wegwerfmail.net", "wegwerfmail.org",
  "sogetthis.com", "spamgoes.in", "amilegit.com", "tempalias.com",
  "kurzepost.de", "objectmail.com", "reallymymail.com",
  "reconmail.com", "safetymail.info", "sendspamhere.com",
  "sharedmailbox.org", "skeefmail.com", "smellfear.com",
  "snkmail.com", "sofort-mail.de", "sogetthis.com",
  "spam.su", "spamavert.com", "spambox.info",
  "spamcannon.com", "spamcannon.net", "spamcon.org",
  "spamevader.com", "spamfighter.cf", "spamfighter.ga",
  "mailnew.com", "mailnull.com", "mailscrap.com", "mailzilla.com",
  "mega.zik.dj", "meltmail.com", "messagebeamer.de",
  "mierdamail.com", "migumail.com", "mintemail.com",
  "moburl.com", "moncourrier.fr.nf", "monemail.fr.nf",
  "monmail.fr.nf", "moreorless.com", "motique.de",
  "nospamfor.us", "nospammail.net", "nospamthanks.info",
  "nus.edu.sg.mailinator.com",
  "objectmail.com", "odnorazovoe.ru", "one-time.email",
  "oneoffmail.com", "onewaymail.com", "online.ms",
  "pecinan.com", "pecinan.net", "pecinan.org",
  "pepbot.com", "pfui.ru",
  "pookmail.com", "privacy.net", "proxymail.eu",
  "punkass.com", "putthisinyourspamdatabase.com",
  "quickinbox.com", "rcpt.at",
  "recode.me", "recursor.net",
  "regbypass.com", "regbypass.comsafe-mail.net",
  // Additional disposables caught in the wild
  "fivejm.com", "fivermail.com", "five-mail.com",
  "byom.de", "clrmail.com", "cuvox.de", "dayrep.com",
  "deagot.com", "desoz.com", "dingbone.com", "doanart.com",
  "donemail.ru", "dontrackme.com", "drdrb.com", "drdrb.net",
  "dumankaya.com", "dumpandfuck.com", "dumpmail.de", "dumpyemail.com",
  "egxmail.com", "eightfifteen.com", "emaildienst.de",
  "emailias.com", "emailinfive.com", "emailisvalid.com",
  "emailpinoy.com", "emailsensei.com", "emailtemporanea.com",
  "fakemailz.com", "fakeemailgenerator.com",
  "mailtemp.net", "mailtemp.co.uk", "tempmailo.com",
  "spamwc.de", "spamwc.org", "spamwc.net",
])

// Suspicious TLDs heavily abused by disposable services
const SUSPICIOUS_TLDS = new Set([
  ".cf", ".ga", ".gq", ".ml", ".tk",   // free Freenom TLDs — almost no legit corporate use
])

// Local parts that are clearly machine-generated (16+ random chars)
const RANDOM_LOCALPART_RE = /^[a-z0-9]{16,}$/

export function isDomainBlocked(email: string): { blocked: boolean; reason?: string } {
  const [localPart, domain] = email.split("@")
  if (!domain || !domain.includes(".")) return { blocked: true, reason: "invalid" }
  const d = domain.toLowerCase()

  if (PERSONAL_DOMAINS.has(d)) return { blocked: true, reason: "personal" }
  if (TEMP_DOMAINS.has(d)) return { blocked: true, reason: "temp" }

  // Block free TLDs with no real corporate presence
  for (const tld of SUSPICIOUS_TLDS) {
    if (d.endsWith(tld)) return { blocked: true, reason: "temp" }
  }

  // Block obviously machine-generated local parts (e.g. deooopdfodiocxsggp@...)
  if (RANDOM_LOCALPART_RE.test(localPart.toLowerCase())) {
    return { blocked: true, reason: "temp" }
  }

  return { blocked: false }
}
