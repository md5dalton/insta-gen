import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"

export async function PUT(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { type, id } = params
    const { processingProfileId, visibility, allowedUserIds, deleted } = await request.json()
    let target: any = null
    let entityType = ""
    try {
        if (type === "root") {
            target = await db.findRootCollectionById(id)
            entityType = "Root Collection"
        } else if (type === "collection") {
            target = await db.findCollectionById(id)
            entityType = "Collection"
        } else if (type === "user") {
            target = await db.findMediaUserById(id)
            entityType = "Media User"
        }
        if (!target) return NextResponse.json({ error: `${entityType || "Entity"} not found` }, { status: 404 })
        if (processingProfileId !== undefined) {
            if (type === "root") await db.updateRootCollection(id, { processingProfileId } as any)
            else if (type === "collection") await db.updateCollection(id, { processingProfileId } as any)
            else if (type === "user") await db.updateMediaUser(id, { processingProfileId } as any)
        }
        if (visibility !== undefined) {
            if (type === "root") await db.updateRootCollection(id, { visibility } as any)
            else if (type === "collection") await db.updateCollection(id, { visibility } as any)
            else if (type === "user") await db.updateMediaUser(id, { visibility } as any)
        }
        if (allowedUserIds !== undefined) {
            if (type === "root") await db.updateRootCollection(id, { allowedUserIds } as any)
            else if (type === "collection") await db.updateCollection(id, { allowedUserIds } as any)
            else if (type === "user") await db.updateMediaUser(id, { allowedUserIds } as any)
        }
        if (deleted !== undefined) {
            if (type === "root") await db.updateRootCollection(id, { deletedAt: deleted ? new Date().toISOString() : null } as any)
            else if (type === "collection") await db.updateCollection(id, { deletedAt: deleted ? new Date().toISOString() : null } as any)
            else if (type === "user") await db.updateMediaUser(id, { deletedAt: deleted ? new Date().toISOString() : null } as any)
        }
        await db.logActivity({ type: "POLICY_CHANGE", title: `${entityType} policy modified`, description: `Updated configuration for "${target.name || target.username}"` })
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || String(e) }, { status: 400 })
    }
}
