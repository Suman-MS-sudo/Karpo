import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      image: true,
      avatarUrl: true,
      isVerified: true,
      jobTitle: true,
      city: true,
      bio: true,
      department: true,
      username: true,
      skills: true,
      yearsOfExp: true,
      socialLinks: true,
      reputationScore: true,
      createdAt: true,
      company: { select: { name: true, logo: true, domain: true } },
    },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(user)
}
