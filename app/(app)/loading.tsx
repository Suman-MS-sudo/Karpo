// Shown automatically by Next.js while a module page's server component is
// fetching data — the shell (nav, sidebar) stays mounted since this only
// replaces the content slot in app/(app)/layout.tsx. Paired with
// RouteProgressBar (a top progress bar that starts the instant a nav link
// is clicked) so a module switch never looks frozen, even on a slower load.
export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-40 sm:h-52 w-full rounded-3xl bg-muted mb-8" />
      <div className="flex gap-2 mb-8 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-24 shrink-0 rounded-full bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border overflow-hidden">
            <div className="h-40 w-full bg-muted" />
            <div className="p-4 space-y-2.5">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
              <div className="h-3 w-1/3 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
