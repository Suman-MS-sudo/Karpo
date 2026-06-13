import { NextResponse } from "next/server"
import { uploadImage } from "@/lib/upload"
import { requireAuth } from "@/lib/api-auth"

export async function POST(req: Request) {
  const { error } = await requireAuth()
  if (error) return error

  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const url = await uploadImage(buffer, file.type || "image/jpeg", "uploads")
  return NextResponse.json({ url })
}
