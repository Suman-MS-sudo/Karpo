import { v2 as cloudinary } from "cloudinary"

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

export async function deleteImage(publicUrl: string): Promise<void> {
  const marker = "/upload/"
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return

  // Strip the version segment (v1234567890/) and file extension to get the public_id
  let path = publicUrl.slice(idx + marker.length).replace(/^v\d+\//, "")
  path = path.replace(/\.[a-zA-Z0-9]+$/, "")

  await cloudinary.uploader.destroy(path)
}
