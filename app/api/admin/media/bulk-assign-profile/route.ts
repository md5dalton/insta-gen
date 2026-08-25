import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { resolveUserFromRequest } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    await resolveUserFromRequest(req)
    const { ids, profileId } = await req.json()
    if (!Array.isArray(ids) || !profileId) return NextResponse.json({ error: 'ids and profileId required' }, { status: 400 })

    const update = await prisma.media.updateMany({ where: { id: { in: ids } }, data: { processingProfileId: profileId } })

    return NextResponse.json({ updated: update.count })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message || 'Unauthorized' }, { status: 401 })
  }
}
