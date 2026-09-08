import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { getMedia } from "@/lib/db/admin/media"
import { authenticateRequest } from "@/server/auth"
import { listMedia } from "@/lib/db/admin/effectiveProcessingMedia"

export async function GET(request: Request) {
    const auth = request.headers.get("authorization") || undefined
    const admin = await authenticateRequest(auth)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const q = Object.fromEntries(url.searchParams.entries())

    // Use DB helper to fetch paginated, filtered media
    const result = await listMedia(q as any)

    return NextResponse.json({
        items: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
    })
}