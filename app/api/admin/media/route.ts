import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { resolveUserFromRequest } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    await resolveUserFromRequest(req)

    const url = new URL(req.url)
    const take = Number(url.searchParams.get('take') || '20')
    const cursor = url.searchParams.get('cursor') || undefined

    const items = await prisma.media.findMany({
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        path: true,
        type: true,
        deletedAt: true,
        owner: { select: { id: true, name: true, picture: true } },
        createdAt: true,
      }
    })

    return NextResponse.json({ items })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message || 'Unauthorized' }, { status: 401 })
  }
}
