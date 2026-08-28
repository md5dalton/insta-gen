import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"

export async function POST(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const {
        name,
        path: dirPath,
        processingProfileId,
        visibility,
        allowedUserIds,
    } = await request.json()
    if (!name)
        return NextResponse.json({ error: "Root Collection name is required" }, { status: 400 })
    const cleanPath = dirPath ? dirPath.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    const created = await db.createRootCollection({ name: name.trim(), path: cleanPath, processingProfileId: processingProfileId || null, visibility: visibility || "ALL_USERS", allowedUserIds: allowedUserIds || [] })
    await db.logActivity({ type: "POLICY_CHANGE", title: "Root Collection created", description: `Created root collection "${created?.name}"` })
    return NextResponse.json(created, { status: 201 })
}
