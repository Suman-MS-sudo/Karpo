export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-5 w-32 bg-muted rounded mb-6" />
      <div className="flex items-center gap-3 mb-8">
        <div className="h-11 w-11 rounded-2xl bg-muted" />
        <div className="space-y-2">
          <div className="h-5 w-48 bg-muted rounded" />
          <div className="h-3 w-64 bg-muted rounded" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border p-5 space-y-3">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded-xl" />
            <div className="h-10 w-full bg-muted rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
