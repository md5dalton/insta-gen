import { NextResponse } from "next/server"
import { db } from "@/server/db"
import prisma from "@/lib/prisma"
import { authenticateRequest } from "@/server/auth"

export async function DELETE(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id, assetId } = params
    const item = await db.findMediaById(id)
    if (!item) return NextResponse.json({ error: "Media not found" }, { status: 404 })

    const asset = (item.assets || []).find((a: any) => a.id === assetId || a.type === assetId)
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    await prisma.mediaAsset.delete({ where: { id: asset.id } })
    const updated = await db.findMediaById(id)
    return NextResponse.json({ success: true, deleted: asset, media: updated })
}
