import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { resolveUserFromRequest } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    await resolveUserFromRequest(req)
    const users = await prisma.profileUser.findMany({ select: { id: true, email: true, name: true, createdAt: true } })
    return NextResponse.json(users)
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message || 'Unauthorized' }, { status: 401 })
  }
}
