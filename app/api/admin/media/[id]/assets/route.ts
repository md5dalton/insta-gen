import { NextResponse } from "next/server"
import { db } from "@/server/db"
import prisma from "@/lib/prisma"
import { authenticateRequest } from "@/server/auth"

export async function GET(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const id = params.id
    const item = await db.findMediaById(id)
    if (!item) return NextResponse.json({ error: "Media not found" }, { status: 404 })
    return NextResponse.json(item.assets || [])
}

export async function POST(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const id = params.id
    const item = await db.findMediaById(id)
    if (!item) return NextResponse.json({ error: "Media not found" }, { status: 404 })

    const body = await request.json()
    const { type, status = "READY", path, size, error } = body
    if (!type) return NextResponse.json({ error: "Asset type is required" }, { status: 400 })

    const existing = (item.assets || []).find((a: any) => a.type === type)
    const assetPayload: any = { type, status, path, error }
    if (existing) {
        await prisma.mediaAsset.update({ where: { mediaId_type: { mediaId: id, type } }, data: ({ ...assetPayload, generatedAt: status === "READY" ? new Date() : undefined } as any) })
    } else {
        await prisma.mediaAsset.create({ data: ({ mediaId: id, ...assetPayload, generatedAt: status === "READY" ? new Date() : undefined } as any) })
    }
    const updated = await db.findMediaById(id)
    const asset = (updated.assets || []).find((a: any) => a.type === type)
    return NextResponse.json({ success: true, asset, media: updated })
}
