export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/** Crops `imageSrc` to `cropAreaPixels` (from react-easy-crop) and resizes to
 * `outputSize` (square) — keeps uploaded avatars a consistent, small size. */
export async function getCroppedImageBlob(
  imageSrc: string,
  cropAreaPixels: CropArea,
  outputSize = 512
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement("canvas")
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas context")

  ctx.drawImage(
    image,
    cropAreaPixels.x,
    cropAreaPixels.y,
    cropAreaPixels.width,
    cropAreaPixels.height,
    0,
    0,
    outputSize,
    outputSize
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))),
      "image/jpeg",
      0.92
    )
  })
}
