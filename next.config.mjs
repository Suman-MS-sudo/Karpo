/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "logos-world.net" },
      { protocol: "https", hostname: "b.zmtcdn.com" },
      { protocol: "https", hostname: "imgak.mmtcdn.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
      { protocol: "https", hostname: "rukminim2.flixcart.com" },
      { protocol: "https", hostname: "static-assets-web.flixcart.com" },
      { protocol: "https", hostname: "img-c.udemycdn.com" },
      { protocol: "https", hostname: "d3njjcbhbojbot.cloudfront.net" },
      { protocol: "https", hostname: "gos3.ibcdn.com" },
      { protocol: "https", hostname: "www.hdfcbank.com" },
      { protocol: "https", hostname: "www.swiggy.com" },
      { protocol: "https", hostname: "*.flixcart.com" },
      { protocol: "https", hostname: "*.udemycdn.com" },
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@libsql/client", "@prisma/adapter-libsql"],
  },
};

export default nextConfig;
