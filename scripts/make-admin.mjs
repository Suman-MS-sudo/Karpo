import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const email = "charan-kumar-baalaje.chandrasekar@capgemini.com"

const user = await prisma.user.update({
  where: { email },
  data:  { role: "ADMIN" },
  select: { id: true, email: true, name: true, role: true },
})

console.log("Updated:", user)
await prisma.$disconnect()
