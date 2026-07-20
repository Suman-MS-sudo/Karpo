import { v2 as cloudinary } from "cloudinary"
import crypto from "crypto"

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(
  buffer: Buffer,
  contentType: string,
  folder = "uploads"
): Promise<string> {
  const dataUri = `data:${contentType};base64,${buffer.toString("base64")}`

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `korpo/${folder}`,
  })

  return result.secure_url
}

/** Uploads a non-image file (PDF/DOC/etc) as resource_type "raw". Using
 * "auto" instead would let Cloudinary classify PDFs as "image" assets (for
 * its page-rendering feature), but delivering PDFs under the image resource
 * type is blocked by default on most Cloudinary accounts (security setting
 * for PDF/ZIP delivery) — the file uploads fine but downloads as a broken/
 * empty document. "raw" delivers the file as-is with no such restriction.
 *
 * Unlike "image", Cloudinary does NOT auto-append a file extension to a raw
 * upload's public_id/secure_url — without one, browsers save the download
 * with no extension at all (and can't tell it's a PDF/DOC). We pass an
 * explicit public_id ending in the original file's extension so the URL
 * (and therefore the downloaded filename) keeps it. */
export async function uploadFile(
  buffer: Buffer,
  contentType: string,
  folder = "uploads",
  originalName?: string
): Promise<string> {
  const dataUri = `data:${contentType};base64,${buffer.toString("base64")}`

  const ext = originalName?.includes(".") ? originalName.split(".").pop() : undefined
  const publicId = ext ? `${crypto.randomUUID()}.${ext}` : undefined

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `korpo/${folder}`,
    resource_type: "raw",
    ...(publicId ? { public_id: publicId } : {}),
  })

  return result.secure_url
}

export async function deleteImage(publicUrl: string): Promise<void> {
  const marker = "/upload/"
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return

  // Strip the version segment (v1234567890/) and file extension to get the public_id
  let path = publicUrl.slice(idx + marker.length).replace(/^v\d+\//, "")
  path = path.replace(/\.[a-zA-Z0-9]+$/, "")

  await cloudinary.uploader.destroy(path)
}
