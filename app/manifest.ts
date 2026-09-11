import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Korpo",
    short_name: "Korpo",
    description: "A corporate-email-verified marketplace for corporate professionals.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      { src: "/favicon.png", sizes: "any", type: "image/png" },
    ],
  }
}
