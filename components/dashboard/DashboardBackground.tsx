export function DashboardBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <div className="absolute -top-48 -left-40 h-[32rem] w-[32rem] rounded-full bg-primary-400/25 dark:bg-primary-500/15 blur-[110px]" />
      <div className="absolute -top-20 right-0 h-[30rem] w-[30rem] rounded-full bg-accent-400/25 dark:bg-accent-500/15 blur-[110px]" />
      <div className="absolute top-[40%] left-1/3 h-96 w-96 rounded-full bg-fuchsia-300/20 dark:bg-fuchsia-500/10 blur-[110px]" />
      <div className="absolute bottom-0 left-0 h-[28rem] w-[28rem] rounded-full bg-emerald-300/20 dark:bg-emerald-500/10 blur-[110px]" />
      <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-amber-300/20 dark:bg-amber-500/10 blur-[110px]" />
    </div>
  )
}
