import { NextResponse } from "next/server"
import { db } from "@/server/db"
import { authenticateRequest } from "@/server/auth"

export async function POST(request: Request) {
    const admin = await authenticateRequest(request.headers.get("authorization") || undefined)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const {
        rootCollectionId,
        name,
        path: dirPath,
        processingProfileId,
        visibility,
        allowedUserIds,
    } = await request.json()
    if (!rootCollectionId || !name)
        return NextResponse.json(
            { error: "rootCollectionId and name are required" },
            { status: 400 }
        )
    const rootExists = await db.findRootCollectionById(rootCollectionId)
    if (!rootExists)
        return NextResponse.json({ error: "Root Collection not found" }, { status: 404 })
    const cleanPath = dirPath ? dirPath.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    const created = await db.createCollection({
        rootCollectionId,
        name: name.trim(),
        path: cleanPath,
        processingProfileId: processingProfileId || null,
        visibility: visibility || null,
        allowedUserIds: allowedUserIds || [],
    })
    await db.logActivity({ type: "POLICY_CHANGE", title: "Collection created", description: `Created collection "${created?.name}" under "${rootExists?.name}"` })
    return NextResponse.json(created, { status: 201 })
}
