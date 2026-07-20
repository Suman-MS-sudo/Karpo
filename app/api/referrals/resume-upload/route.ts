import { NextResponse } from "next/server"
import { uploadFile } from "@/lib/upload"
import { requireAuth } from "@/lib/api-auth"

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const MAX_BYTES = 5 * 1024 * 1024 // 5MB

export async function POST(req: Request) {
  const { error } = await requireAuth()
  if (error) return error

  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PDF, DOC, or DOCX files are allowed" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large — max 5MB" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const url = await uploadFile(buffer, file.type, "resumes", file.name)
  return NextResponse.json({ url, name: file.name })
}
