import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { resolveUserFromRequest } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await resolveUserFromRequest(req)
    const { id } = await params

    const now = new Date()

    await prisma.media.update({ where: { id }, data: { deletedAt: now } })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message || 'Unauthorized' }, { status: 401 })
  }
}
