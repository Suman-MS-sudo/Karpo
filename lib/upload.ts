import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const BUCKET = "korpo"

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
  }
}

export async function uploadImage(
  buffer: Buffer,
  contentType: string,
  folder = "uploads"
): Promise<string> {
  await ensureBucket()

  const ext = contentType.split("/")[1]?.split("+")[0] ?? "jpg"
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType, upsert: false })

  if (error) throw new Error(error.message)

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

export async function deleteImage(publicUrl: string): Promise<void> {
  // Extract path after /object/public/<bucket>/
  const marker = `/object/public/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = publicUrl.slice(idx + marker.length)
  await supabaseAdmin.storage.from(BUCKET).remove([path])
}
