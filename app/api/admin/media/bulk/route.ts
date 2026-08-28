import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"

export async function POST(request: Request) {
    const auth = request.headers.get("authorization") || undefined
    const admin = await authenticateRequest(auth)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { ids, action, payload } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Array of media IDs required" }, { status: 400 })
    }

    let updatedCount = 0
    for (const id of ids) {
        const item = await db.findMediaById(id)
        if (!item) continue
        if (action === "PROCESS" || action === "RETRY") {
            await db.updateMedia(id, { processingStatus: "READY" } as any)
            updatedCount++
        } else if (action === "SET_PROFILE") {
            await db.updateMedia(id, { processingProfileId: payload?.profileId || null } as any)
            updatedCount++
        } else if (action === "SET_VISIBILITY") {
            await db.updateMedia(id, { visibility: payload?.visibility || null, allowedUserIds: payload?.allowedUserIds !== undefined ? payload.allowedUserIds : undefined } as any)
            updatedCount++
        } else if (action === "ADD_TAG") {
            if (payload?.tag) {
                const tags = Array.from(new Set([...(item.tags || []), payload.tag]))
                await db.updateMedia(id, { tags } as any)
                updatedCount++
            }
        } else if (action === "REMOVE_TAG") {
            if (payload?.tag) {
                const tags = (item.tags || []).filter((t: string) => t !== payload.tag)
                await db.updateMedia(id, { tags } as any)
                updatedCount++
            }
        } else if (action === "DELETE") {
            await db.softDeleteMedia(id)
            updatedCount++
        } else if (action === "RESTORE") {
            await db.updateMedia(id, { deletedAt: null } as any)
            updatedCount++
        }
    }

    await db.logActivity({ type: "PROCESSED", title: `Bulk Action: ${action}`, description: `Applied ${action} across ${updatedCount} media items` })

    return NextResponse.json({ success: true, count: updatedCount })
}
