import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AdminShell } from "@/components/layout/AdminShell"

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin")
  if (session.user.role !== "ADMIN") redirect("/dashboard")
  return <AdminShell>{children}</AdminShell>
}
