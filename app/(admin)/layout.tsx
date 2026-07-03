import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AppShell } from "@/components/layout/AppShell"

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin")
  if (session.user.role !== "ADMIN") redirect("/dashboard")
  return <AppShell>{children}</AppShell>
}
