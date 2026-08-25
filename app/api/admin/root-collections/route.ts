import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { resolveUserFromRequest } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    await resolveUserFromRequest(req)

    const roots = await prisma.rootCollection.findMany({
      select: {
        id: true,
        name: true,
        path: true,
        collections: {
          select: { id: true }
        }
      }
    })

    const result = roots.map(r => ({ id: r.id, name: r.name, path: r.path, collections: r.collections.length }))

    return NextResponse.json(result)
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message || 'Unauthorized' }, { status: 401 })
  }
}
