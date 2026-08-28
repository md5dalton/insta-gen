import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { enrichMediaItem } from "@/server/policy"
import { authenticateRequest } from "@/server/auth"

export async function GET(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const counts: Record<string, number> = {}
    const enriched = await Promise.all((await db.listMedia()).map((m) => enrichMediaItem(m)))
    const active = enriched.filter((m) => !m.isEffectivelyDeleted)
    active.forEach((m) => {
        ;(m.tags || []).forEach((t: string) => {
            counts[t] = (counts[t] || 0) + 1
        })
    })
    const tagList = Object.entries(counts).map(([name, count]) => ({ name, count }))
    tagList.sort((a, b) => b.count - a.count)
    return NextResponse.json(tagList)
}
