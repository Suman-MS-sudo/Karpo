import { NextResponse } from "next/server"
import { uploadImage } from "@/lib/upload"
import { requireAuth } from "@/lib/api-auth"

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024 // 8MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export async function POST(req: Request) {
  const { error } = await requireAuth()
  if (error) return error

  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 413 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const url = await uploadImage(buffer, file.type, "uploads")
  return NextResponse.json({ url })
}
