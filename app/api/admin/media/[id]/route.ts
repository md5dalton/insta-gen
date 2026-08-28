import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { enrichMediaItem } from "@/server/policy"
import { authenticateRequest } from "@/server/auth"

async function requireAdmin(request: any) {
    const auth = request.headers.get("authorization") || undefined
    return await authenticateRequest(auth)
}

export async function GET(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const id = params.id
    const item = await db.findMediaById(id)
    if (!item) return NextResponse.json({ error: "Media not found" }, { status: 404 })
    return NextResponse.json(await enrichMediaItem(item))
}

export async function POST(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const id = params.id
    const action = new URL(request.url).pathname.split("/").pop()
    const admin = await requireAdmin(request)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const item = await db.findMediaById(id)
    if (!item) return NextResponse.json({ error: "Media not found" }, { status: 404 })

    const body = await request.json().catch(() => ({}))

    if (action === "policy") {
        const updated = await db.updateMedia(id, { processingProfileId: body.processingProfileId || null } as any)
        return NextResponse.json(await enrichMediaItem(updated))
    }

    if (action === "access") {
        const updated = await db.updateMedia(id, { visibility: body.visibility !== undefined ? body.visibility : undefined, allowedUserIds: body.allowedUserIds !== undefined ? body.allowedUserIds : undefined } as any)
        return NextResponse.json(await enrichMediaItem(updated))
    }

    if (action === "process" || action === "retry") {
        await db.updateMedia(id, { processingStatus: "READY" as any } as any)
        const up = await db.findMediaById(id)
        return NextResponse.json(await enrichMediaItem(up))
    }

    if (action === "delete") {
        await db.softDeleteMedia(id)
        const up2 = await db.findMediaById(id)
        return NextResponse.json(await enrichMediaItem(up2))
    }

    if (action === "restore") {
        await db.updateMedia(id, { deletedAt: null } as any)
        const up3 = await db.findMediaById(id)
        return NextResponse.json(await enrichMediaItem(up3))
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
}
