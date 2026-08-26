import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"

export async function DELETE(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const admin = authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id, assetId } = params
    const item = db.media.find((m) => m.id === id)
    if (!item) return NextResponse.json({ error: "Media not found" }, { status: 404 })

    const idx = item.assets.findIndex((a) => a.id === assetId || a.type === assetId)
    if (idx === -1) return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    const deleted = item.assets.splice(idx, 1)[0]
    return NextResponse.json({ success: true, deleted, media: item })
}
