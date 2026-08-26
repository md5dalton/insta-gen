import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { enrichMediaItem } from "@/server/policy"
import { authenticateRequest } from "@/server/auth"

function requireAdmin(request: any) {
    const auth = request.headers.get("authorization") || undefined
    return authenticateRequest(auth)
}

export async function GET(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const id = params.id
    const item = db.media.find((m) => m.id === id)
    if (!item) return NextResponse.json({ error: "Media not found" }, { status: 404 })
    return NextResponse.json(enrichMediaItem(item))
}

export async function POST(request: any, context: any) {
    const params =
        context?.params && typeof context.params.then === "function"
            ? await context.params
            : context?.params
    const id = params.id
    const action = new URL(request.url).pathname.split("/").pop()
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const item = db.media.find((m) => m.id === id)
    if (!item) return NextResponse.json({ error: "Media not found" }, { status: 404 })

    const body = await request.json().catch(() => ({}))

    if (action === "policy") {
        item.processingProfileId = body.processingProfileId || null
        return NextResponse.json(enrichMediaItem(item))
    }

    if (action === "access") {
        item.visibility = body.visibility !== undefined ? body.visibility : item.visibility
        item.allowedUserIds =
            body.allowedUserIds !== undefined ? body.allowedUserIds : item.allowedUserIds
        return NextResponse.json(enrichMediaItem(item))
    }

    if (action === "process" || action === "retry") {
        item.processingStatus = "PROCESSING"
        item.processingStatus = "READY"
        return NextResponse.json(enrichMediaItem(item))
    }

    if (action === "delete") {
        item.deletedAt = new Date().toISOString()
        return NextResponse.json(enrichMediaItem(item))
    }

    if (action === "restore") {
        item.deletedAt = null
        return NextResponse.json(enrichMediaItem(item))
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
}
