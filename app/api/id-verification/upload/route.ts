import { NextResponse } from "next/server"
import { uploadImage } from "@/lib/upload"

const MAX_BYTES = 8 * 1024 * 1024 // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"])

// Unauthenticated by necessity — this runs before the user has an account/session.
// Locked down to small, image-only uploads into a dedicated Cloudinary folder to
// limit abuse; the resulting URL is only ever attached to an IdVerificationRequest.
export async function POST(req: Request) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 })
  }
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WEBP or HEIC images are allowed" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 8MB" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    const url = await uploadImage(buffer, file.type, "id-verification")
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: "That file couldn't be processed as an image. Please try another." }, { status: 400 })
  }
}
