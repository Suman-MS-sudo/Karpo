import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const user = await prisma.user.upsert({
  where: { email: "mssworlz@gmail.com" },
  update: { role: "ADMIN", isVerified: true, name: "Admin" },
  create: { email: "mssworlz@gmail.com", name: "Admin", role: "ADMIN", isVerified: true },
})

await prisma.membership.upsert({
  where: { userId: user.id },
  update: { plan: "PREMIUM" },
  create: { userId: user.id, plan: "PREMIUM" },
})

console.log("Admin ready:", user.email, "| role:", user.role)
await prisma.$disconnect()
