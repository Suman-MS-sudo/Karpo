export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-surface flex items-center justify-center p-4 overflow-hidden">
      {/* Logo watermark — full colour, matching the home page hero treatment */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] opacity-[0.14] dark:opacity-[0.20] pointer-events-none select-none"
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-transparent.png"
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
