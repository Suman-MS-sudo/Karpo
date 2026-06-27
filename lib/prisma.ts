import { PrismaClient } from "@prisma/client"
import { PrismaLibSQL } from "@prisma/adapter-libsql"
import { createClient } from "@libsql/client"

// Fields stored as JSON strings in SQLite that the app treats as arrays.
const ARRAY_FIELDS: Record<string, string[]> = {
  User:          ["hiddenServices", "skills"],
  Listing:       ["images"],
  RentalPost:    ["amenities", "images", "furnishingItems"],
  JobReferral:   ["skills", "perks"],
  CarpoolRoute:  ["pickupPoints"],
  ServicePost:   ["portfolio"],
  Deal:          ["images"],
  Event:         ["images", "tags"],
  Course:        ["images", "tags"],
  SkillListing:  ["skills", "deliverables", "certifications"],
  SkillOrder:    ["attachments", "deliverables"],
  BenefitProduct:["features", "applicationSteps"],
}

// Fields stored as JSON strings that the app treats as objects/arrays (Json? fields).
const JSON_FIELDS: Record<string, string[]> = {
  User:         ["socialLinks"],
  CarpoolRoute: ["stopCoords"],
  SkillListing: ["faqs", "packages", "availability"],
  Event:        ["agenda"],
  Course:       ["curriculum"],
}

function parseField(value: unknown): unknown {
  if (typeof value !== "string") return value
  try { return JSON.parse(value) } catch { return value }
}

function transformResult(model: string | undefined, result: unknown): unknown {
  if (!model || !result || typeof result !== "object") return result
  const arrayFs = ARRAY_FIELDS[model] ?? []
  const jsonFs  = JSON_FIELDS[model]  ?? []
  const fields  = [...arrayFs, ...jsonFs]
  if (fields.length === 0) return result

  if (Array.isArray(result)) return result.map((r) => transformResult(model, r))

  const obj = result as Record<string, unknown>
  for (const f of fields) {
    if (f in obj) obj[f] = parseField(obj[f])
  }
  return obj
}

function serializeInput(model: string | undefined, data: unknown): void {
  if (!model || !data || typeof data !== "object" || Array.isArray(data)) return
  const arrayFs = ARRAY_FIELDS[model] ?? []
  const jsonFs  = JSON_FIELDS[model]  ?? []
  const fields  = [...arrayFs, ...jsonFs]
  const obj = data as Record<string, unknown>
  for (const f of fields) {
    if (f in obj && (Array.isArray(obj[f]) || (obj[f] !== null && typeof obj[f] === "object"))) {
      obj[f] = JSON.stringify(obj[f])
    }
  }
}

function createPrismaClient() {
  const libsql = createClient({
    url:       process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const adapter = new PrismaLibSQL(libsql)
  const client  = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

  // Middleware: serialize arrays/json before write, parse after read.
  client.$use(async (params, next) => {
    // Serialize arrays/objects in write payloads
    if (params.args?.data) serializeInput(params.model, params.args.data)

    const result = await next(params)

    // Parse JSON strings back to arrays/objects on read
    return transformResult(params.model, result)
  })

  return client
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
