import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { resolveUserFromRequest } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    await resolveUserFromRequest(req)

    const url = new URL(req.url)
    const filter = url.searchParams.get('filter') || 'new'

    if (filter === 'new') {
      const since = new Date()
      since.setDate(since.getDate() - 7)
      const items = await prisma.media.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, path: true, type: true, createdAt: true }
      })
      return NextResponse.json({ items })
    }

    return NextResponse.json({ items: [] })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message || 'Unauthorized' }, { status: 401 })
  }
}
